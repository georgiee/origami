import * as THREE from 'three';
import OrigamiShape from "./origami-shape";
import OrigamiMesh from "./origami-mesh";
import Ruler from "./ruler/ruler";
import {World} from './../world';
import {Snapper} from './ruler/snapper';

let plane1 = new THREE.Plane(new THREE.Vector3(0.6715879468732249,-0.7384693109531753,0.06027193704328063),25.58769667414134);
let plane2 = new THREE.Plane(new THREE.Vector3(0.6190934504438543,-0.7837590901632208,0.049446821981230724),18.978032225100296);

export default class Origami extends THREE.Object3D {
  private shape: OrigamiShape;
  private mesh: OrigamiMesh;
  private ruler: Ruler;
    constructor(private world: World, initialShape?:OrigamiShape){
      super();
      this.shape = initialShape;
      this.init();
    }

    init(){
      this.mesh = new OrigamiMesh(this.shape);
      //this.mesh.position.y = -75;

      this.mesh.update();

      this.add(this.mesh);

      let snapper = new Snapper(this.shape);
      snapper.start();

      this.ruler = new Ruler(this.world, snapper);
      this.ruler.addEventListener('enabled', () => {
        this.world.controls.enabled = false;
      })

      this.ruler.addEventListener('disabled', () => {
        this.world.controls.enabled = true;
      })

      this.ruler.addEventListener('completed', (event:any) => {
        console.log('handle new plane', event.plane)
        //this.shape.cut(event.plane);
        this.shape.fold(event.plane, 30);
        this.mesh.update();
      });
      //this.ruler.enable();
      //this.shape.fold(plane1, 30);
      //this.shape.fold(plane2, 30);

      //this.shape.cut(plane1);
      //this.shape.cut(plane2);

      this.mesh.update();

      this.add(this.ruler);
      this.add(snapper);
    }


    getRuler(){
      return this.ruler;
    }

    get camera(){
      return this.world.camera;
    }
}
