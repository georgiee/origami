import * as THREE from 'three';
import World from './../shared/world';
import { Origami } from './../origami/origami';
import * as Panel from './../debug/panel';
import { Playbook } from './../playbook';
import * as playbooks from './../playbooks/index';
import Ruler from './ruler/ruler';
import {Snapper} from './ruler/snapper';
import {OrigamiCreases} from './../origami/creases';
import { CreaseViewer } from './crease-viewer';

export class OrigamiEditor {
  private world;
  private origami: Origami;
  private ruler: Ruler;
  private creasing: OrigamiCreases;
  private currentPlane: THREE.Plane;
  private playbook: Playbook;
  private creaseViewer: CreaseViewer;

  constructor() {
    Panel.create();

    this.initWorld();
    this.initOrigami();
    this.initRuler();
    this.initPanel();
    this.initPlaybook();
  }

  public getOrigami() {
    return this.origami;
  }

  public get camera(){
    return this.world.camera;
  }

  public resetCamera() {
    this.world.resetCamera();
  }

  public center() {
    // this.world.center(this.origami.getMesh().getWorldCenter());
  }
  private initWorld() {
    this.world = World.getInstance();

    this.world.render$.subscribe( (renderer) => {
      this.creaseViewer.render(renderer);
    });
  }

  private initPanel( ) {
    Panel.create();
    Panel.initOrigamiEditor(this, this.ruler);
  }

  private initOrigami() {
    const origami = new Origami();
    origami.events$.on('update', () => { this.update(); });

    this.origami = origami;
    this.creasing = this.origami.getCreases();
    this.creasing.addEventListener('polygon-selected', (event: any) => {
      this.origami.showPoint2D(event.point);
    });

    this.creaseViewer = new CreaseViewer(250, this.creasing);

    this.world.add(origami);

    window.addEventListener('keyup', (event) => {
      if (event.key === 't') {
        this.ruler.enable();
      }
    });
  }

  private update() {
    this.creasing.update();
  }

  private initPlaybook() {
    this.playbook = new Playbook(this.origami, this.ruler);

    this.playbook.set(playbooks.working.catamaran);
    this.playbook.play(-1);
  }

  private highlightPolygon(index) {
    this.creasing.showPolygons([index]);
  }

  // TODO: Call me
  private reset() {
    this.ruler.reset();
  }

  private initRuler() {
    const snapper = new Snapper(this.origami.getShape());

    this.ruler = new Ruler(this.world, snapper);
    this.ruler.addEventListener('enabled', () => {
      this.world.controls.enabled = false;
    });

    this.ruler.addEventListener('disabled', () => {
      this.world.controls.enabled = true;
    });

    this.ruler.addEventListener('completed', (event: any) => {
      this.currentPlane = event.plane;
    });

    this.ruler.addEventListener('update', (event: any) => {
      this.creasing.preview(event.plane);
    });

    this.world.add(snapper);
    this.world.add(this.ruler);

    snapper.start();
  }
}
