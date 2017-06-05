import * as THREE from 'three';
import Origami from './origami';
import { gui, updateDisplay } from './panel';
import * as Rx from 'rxjs/Rx';
export class Playbook {
  private panelFolder;
  private instructions;
  private currentIndex = 0;
  private panelData;

  constructor(private origami: Origami) {
    this.initPanel();
  }

  public run(instructions, progress = 1) {
    this.instructions = instructions;
    this.updatePanel();

    this.play();
  }
  
  public next() {
    this.play(this.currentIndex + 1);
  }

  public previous() {
    this.play(this.currentIndex - 1);
  }
  public play(count = 0) {
    if (count === this.currentIndex) {
      return;
    }

    this.currentIndex = count;
    this.panelData.index = count;
    this.origami.reset();
    this.instructions
    .slice(0, this.currentIndex)
    .forEach((data, index) => this.runCommand(data, index));
    
    updateDisplay();
  }
  
  public updatePanel() {
    this.panelData = {
      index: 0
    };

    const progressController = this.panelFolder
      .add(this.panelData, 'index', 0, this.instructions.length - 1)
      .listen();
    this.panelFolder.add(this, 'next');
    this.panelFolder.add(this, 'previous');

    const source = Rx.Observable.create(function(observer) {
      progressController.onChange((value) => observer.next(value));
    });

    const subscription = source.debounceTime(250).subscribe(
      (step) => this.play(step)
    );

  }

  public runCommand(data, index) {
    const ruler = this.origami.getRuler();
    const plane = this.getPlane(data);

    // tslint:disable-next-line:max-line-length
    console.warn(`run ${index + 1}/${this.instructions.length} - \${data.command} ${data.polygonIndex !== undefined ? data.polygonIndex : ''}`, plane);
    
    ruler.show(plane);

    switch (data.command) {
      case 'FOLD_REFLECTION': this.foldReflection(plane); break;
      case 'FOLD_REFLECTION_P': this.foldReflection(plane, data.polygonIndex); break;

      case 'FOLD_ROTATION': this.foldRotation(plane, data.phi); break;
      case 'FOLD_ROTATION_P': this.foldRotation(plane, data.phi, data.polygonIndex); break;

      case 'FOLD_CREASE': this.crease(plane); break;
    }

    this.origami.stats();
  }
  private foldRotation(plane, angle, index?) {
    this.origami.fold(plane, angle, index );
    if (index) {
      this.origami.highlightPolygon(index);
    }
  }

  private foldReflection(plane, index = null) {
    this.origami.reflect(plane, index);
    if (index !== null) {
      this.origami.highlightPolygon(index);
    }
  }

  private crease(plane) {
    this.origami.crease(plane);
  }

  private getPlane({pnormal, ppoint}) {
    const normal = new THREE.Vector3().fromArray(pnormal).normalize();
    const coplanar = new THREE.Vector3().fromArray(ppoint);
    const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(normal, coplanar);

    return plane;
  }

  private initPanel() {
    this.panelFolder = gui.addFolder('Playbook');
    this.panelFolder.closed = false;
  }
}
