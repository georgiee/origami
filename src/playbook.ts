import * as THREE from 'three';
import Origami from './origami';
import { gui, updateDisplay } from './panel';
import * as Rx from 'rxjs/Rx';
import * as playbooks from './playbooks/index';

// const PLAYBOOKS = { ...playbooks.working, ...playbooks.pending, ...playbooks.raw};
const PLAYBOOKS = { ...playbooks.working, ...playbooks.testing};
export class Playbook {
  private newModel = false;
  private panelFolder;
  private instructions;
  private currentIndex = 0;
  private panelData =  {
    custom: '',
    index: 0,
    playbook: null,
    controllers: {
      next: null,
      previous: null
    }
  } as any;

  constructor(private origami: Origami) {
    this.initPanel();
  }

  public set(instructions) {
    this.setNewInstructions(instructions);
  }

  public next() {
    if (this.currentIndex + 1 <= this.instructions.length) {
      this.play(this.currentIndex + 1);
    }
  }

  public previous() {
    if (this.currentIndex - 1 >= 0) {
      this.play(this.currentIndex - 1);
    }
  }
  public play(count = 0) {
    if (count === this.currentIndex) {
      return;
    }
    if (count === -1) {
      count = this.instructions.length;
    }

    const delta = count - this.currentIndex;

    this.currentIndex = count;
    this.panelData.index = count;

    if (delta > 0 && this.newModel === false) {
      // partial run
      this.instructions
      .slice(this.currentIndex - delta, this.currentIndex)
      .forEach((data, index) => this.runCommand(data, this.instructions.indexOf(data)));
    } else {
      // full run
      this.newModel = false;
      this.origami.reset();
      this.instructions
      .slice(0, this.currentIndex)
      .forEach((data, index) => this.runCommand(data, index));
    }

    updateDisplay();
  }

  public runCommand(data, index) {
    const ruler = this.origami.getRuler();
    const plane = this.getPlane(data);

    // tslint:disable-next-line:max-line-length
    console.warn(`run ${index + 1}/${this.instructions.length} - ${data.command} ${data.polygonIndex !== undefined ? data.polygonIndex : ''} ${ data.phi ? data.phi : ''}`);

    ruler.show(plane);

    switch (data.command) {
      case 'FOLD_REFLECTION': this.foldReflection(plane); break;
      case 'FOLD_REFLECTION_P': this.foldReflection(plane, data.polygonIndex); break;

      case 'FOLD_ROTATION': this.foldRotation(plane, data.phi); break;
      case 'FOLD_ROTATION_P': this.foldRotation(plane, data.phi, data.polygonIndex); break;

      case 'FOLD_CREASE': this.crease(plane); break;
    }
  }

  private foldRotation(plane, angle, index = null) {
    this.origami.fold(plane, angle, index );
    if (index !== null && index !== undefined) {
      this.origami.highlightPolygon(index);
    }
  }

  private foldReflection(plane, index = null) {
    this.origami.reflect(plane, index);
    if (index !== null && index !== undefined) {
      this.origami.highlightPolygon(index);
    }
  }

  private crease(plane) {
    this.origami.crease(plane);
  }

  private getPlane({pnormal, ppoint}) {
    const normal = new THREE.Vector3().fromArray(pnormal);
    const coplanar = new THREE.Vector3().fromArray(ppoint);
    const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(normal.clone().normalize(), coplanar);

    (plane as any).__raw = {
      normal,
      coplanar
    };

    return plane;
  }

  private initPanel() {
    this.panelFolder = gui.addFolder('Playbook');
    this.panelFolder.closed = false;

    this.panelFolder
      .add(this.panelData, 'playbook',  ['custom', ...Object.keys(PLAYBOOKS)])
      .name('Choose: ')
      .onChange((key) => {
        this.handlePlaybookChanged(key);
      });
  }

  private handlePlaybookChanged(name) {
    if (name === 'custom') {
      const controller = this.panelFolder.add(this.panelData, 'custom');
      this.panelData.controllers.custom = controller;
      this.setNewInstructions([]);

      controller.onChange((value) => {
        try {
          const instructions = JSON.parse(value);
          this.setNewInstructions(instructions);
        } catch (Error) {
          console.error('Invalid JSON, paste here a json command list (sorry no documentation)');
        }
      });

    }else {
      this.removeCustomController();

      const data = PLAYBOOKS[name];
      this.setNewInstructions(data);
    }

    this.play(-1);
  }

  private removeCustomController() {
    if (this.panelData.controllers.custom) {
      this.panelFolder.remove(this.panelData.controllers.custom);
      this.panelData.controllers.custom = null;
    }
  }

  private removePlaybookController() {
    if (this.panelData.controllers.next) {
      this.panelFolder.remove(this.panelData.controllers.next);
      this.panelData.controllers.next = null;
    }

    if (this.panelData.controllers.previous) {
      this.panelFolder.remove(this.panelData.controllers.previous);
      this.panelData.controllers.previous = null;
    }

    if (this.panelData.controllers.progress) {
      this.panelFolder.remove(this.panelData.controllers.progress);
      this.panelData.controllers.progress = null;
    }
  }

  private setNewInstructions(data) {
      this.removePlaybookController();
      this.newModel = true;
      this.instructions = data;
      this.panelData.index = 0;
      this.panelData.controllers.next = this.panelFolder.add(this, 'next');
      this.panelData.controllers.previous = this.panelFolder.add(this, 'previous');

      this.updateProgressHandler();
  }

  private updateProgressHandler() {
    this.panelData.controllers.progress = this.panelFolder
      .add(this.panelData, 'index', 0, this.instructions.length)
      .listen();

    const source = Rx.Observable.create((observer) => {
      this.panelData.controllers.progress.onChange((value) => observer.next(value));
    });

    const subscription = source.debounceTime(250).subscribe(
      (step) => {
        this.play(step);
      }
    );
  }

}
