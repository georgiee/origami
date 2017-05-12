import * as THREE from 'three';
import OrigamiShape from "./origami-shape";
import OrigamiMesh from "./origami-mesh";
import {OrigamiCreases} from './origami-creases';
import Ruler from "./ruler/ruler";
import {World, getInstance as getWorld } from './../world';
import {Snapper} from './ruler/snapper';
import * as Panel from './panel';

export default class Origami extends THREE.Object3D {
  private shape: OrigamiShape;
  private mesh: OrigamiMesh;
  private creasing: OrigamiCreases;
  private ruler: Ruler;
  private currentPlane:THREE.Plane;

    constructor(private world: World, initialShape?:OrigamiShape){
      super();
      this.shape = initialShape;
      this.init();
    }

    center(){
      let world = getWorld();
      world.center(this.mesh.getWorldCenter());
    }

    fold(angle){
      this.shape.fold(this.currentPlane, angle);
      this.update()

      this.center();
    }

    reflect(){
      this.shape.reflect(this.currentPlane);
      this.update()

      this.center();
    }

    crease(){
      console.log(this.mesh.localToWorld(new THREE.Vector3(25,25,0)));
      console.log(this.mesh.localToWorld(new THREE.Vector3(25,25,0)));

      this.shape.fold(this.currentPlane, 0);
      this.update()
    }

    update(){
      this.mesh.update();
      this.creasing.update();
    }

    initRuler(){
      let snapper = new Snapper(this.shape);
      this.add(snapper);

      snapper.start();

      this.ruler = new Ruler(this.world, snapper);
      this.ruler.addEventListener('enabled', () => {
        this.world.controls.enabled = false;
      })

      this.ruler.addEventListener('disabled', () => {
        this.world.controls.enabled = true;
      })

      this.ruler.addEventListener('completed', (event:any) => {
        this.currentPlane = event.plane;
      });
    }

    init(){
      Panel.initOrigami(this);
      this.initRuler();

      this.mesh = new OrigamiMesh(this.shape);

      this.creasing = new OrigamiCreases(this.shape);
      this.creasing.position.x = 60;

      this.add(this.mesh);
      this.add(this.ruler);
      this.add(this.creasing);

      this.update()
    }

    getRuler(){
      return this.ruler;
    }

    get camera(){
      return this.world.camera;
    }
}
