import * as THREE from 'three';
import utils from './utils';
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
  private debugMarker;
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
      this.creasing.addEventListener('polygon-selected', this.handlePolygonSelected.bind(this));
      this.creasing.position.x = 60;

      this.add(this.mesh);
      this.add(this.ruler);
      this.add(this.creasing);

      this.update()
    }

    handlePolygonSelected({index, point}){
      //vertices = vertexIndices.map(index => vertices[index]);
      //vertices2d = vertexIndices.map(index => vertices2d[index]);
      console.log('handlePolygonSelected', index, point);
      //console.log(vertices, vertices2d)
      let result = this.getPointOnOrigami(index, point)
      if(!this.debugMarker){
        this.debugMarker = utils.createSphere();
        this.add(this.debugMarker);
      }

      this.debugMarker.position.copy(result);
    }

    getPointOnOrigami(index, point){
      let polygons = this.shape.getPolygons();
      let vertices = this.shape.getVertices();
      let vertices2d = this.shape.getVertices2d();

      let vertexIndices = polygons[index];;

      let orig = vertices[vertexIndices[0]];
      let orig_2d = vertices2d[vertexIndices[0]];

      for(let i = 0; i < vertexIndices.length;i++){
        for(let j = 0;j < vertexIndices.length;j++){
          let point1Index = vertexIndices[i];
          let point1 = vertices[vertexIndices[i]];
          let point1_2d = vertices2d[vertexIndices[i]];

          let point2Index = vertexIndices[j];
          let point2 = vertices[vertexIndices[j]];
          let point2_2d = vertices2d[vertexIndices[j]];

          let base1 = point1.clone().sub(orig)
          let base2 = point2.clone().sub(orig)

          if(base1.clone().cross(base2).lengthSq() > 0){
              base1.normalize();
              base2.normalize();

              let base1_2d = point1_2d.clone().sub(orig_2d).normalize();
              let base2_2d = point2_2d.clone().sub(orig_2d).normalize();

              let det = base1_2d.x * base2_2d.y - base1_2d.y * base2_2d.x;
              let coord1 = point.clone().sub(orig_2d).dot(new THREE.Vector3(base2_2d.y/det, -base2_2d.x/det, 0));
              let coord2 = point.clone().sub(orig_2d).dot(new THREE.Vector3(-base1_2d.y/det, base1_2d.x/det, 0));
              let result = orig.clone()
              result.add(base1.setLength(coord1).add(base2.setLength(coord2)));
              return result;
          }
        }
      }
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
