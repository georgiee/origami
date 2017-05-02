import * as THREE from 'three';
import OrigamiShape from "./origami-shape";
import OrigamiMesh from "./origami-mesh";
import Ruler from "./ruler/ruler";
import {World} from './../world';
import {Snapper} from './ruler/snapper';

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
      });
      //this.ruler.enable();


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
