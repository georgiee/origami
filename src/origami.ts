import * as THREE from 'three';
import OrigamiShape from "./origami-shape";
import OrigamiMesh from "./origami-mesh";
import {OrigamiCreases} from './origami-creases';
import Ruler from "./ruler/ruler";
import {World, getInstance as getWorld } from './world';
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
      this.shape = initialShape ? initialShape : createSquare();
      this.init();
    }

    center(){
      let world = getWorld();
      world.center(this.mesh.getWorldCenter());
    }

    fold(plane: THREE.Plane, angle){
      this.shape.fold(plane || this.currentPlane, angle);
      this.update()

      //this.center();
    }

    foldIndex(plane: THREE.Plane, angle, index){
      //debugger;
      this.shape.foldIndex(plane || this.currentPlane, angle, index);
      this.update()

      //this.center();
    }


    reflect(plane: THREE.Plane){
      this.shape.reflect(plane || this.currentPlane);
      this.update()

    //  this.center();
    }
    reflectIndex(plane: THREE.Plane, index){
      //debugger;
      this.shape.reflectIndex(plane || this.currentPlane, index);
      this.update()

      //this.center();
    }

    crease(plane: THREE.Plane){
      this.shape.fold(plane || this.currentPlane, 0);
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

function createSquare(){

  let geometry = new OrigamiShape();
  geometry.addVertex(new THREE.Vector3(-25,-25,0));
  geometry.addVertex(new THREE.Vector3(25,-25,0));
  geometry.addVertex(new THREE.Vector3(25,25,0));
  geometry.addVertex(new THREE.Vector3(-25,25,0));

  geometry.addVertex2D(new THREE.Vector3(-25,-25,0));
  geometry.addVertex2D(new THREE.Vector3(25,-25,0));
  geometry.addVertex2D(new THREE.Vector3(25,25,0));
  geometry.addVertex2D(new THREE.Vector3(-25,25,0));

  geometry.addPolygon([0,1,2,3]);

  return geometry;
}
