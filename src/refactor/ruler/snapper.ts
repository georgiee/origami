import * as THREE from 'three';
import OrigamiShape from '../origami-shape';
import { throttle }  from 'lodash';
import utils from '../../utils';
import World from '../../world';

const THRESHOLD = 0.05;
const THRESHOLD_CLEAR = 0.1;

export class Snapper extends THREE.Object3D {
  private mouseScreenCoords = new THREE.Vector3();
  private point: THREE.Points;
  private lastSnappedPoint: THREE.Vector3;

  constructor(private shape: OrigamiShape){
    super();

    this.handleMouseMove = throttle(this.handleMouseMove.bind(this), 100);

    let geometry = new THREE.Geometry();
    geometry.vertices.push(new THREE.Vector3(0,0, 0));

    let material = new THREE.PointsMaterial({size: 3, color: 0xffb6c1});
    this.point = new THREE.Points( geometry, material );
    this.add( this.point );

    this.show();
  }
  start(){
    document.addEventListener('mousemove', this.handleMouseMove);
  }

  handleMouseMove({clientX, clientY}){
    this.findNearestFromMouse(clientX, clientY);

    if(this.hasSnaped()){
      this.show();
    }else {
      //this.hide();
    }
  }

  hasSnaped(){
    return this.lastSnappedPoint!==null;
  }

  getSnappedPosition(){
    return this.lastSnappedPoint;
  }

  findNearestFromMouse(clientX, clientY){
    let world = World.getInstance();
    let {x, y} = utils.globalToLocal(clientX, clientY, world.domElement);

    return this.findNearestVertex(x, y);
  }

  findNearestVertex(screenX, screenY){
    let world = World.getInstance();
    let vertices = this.shape.getAlignmentPoints();
    let screenCoords = new THREE.Vector3(screenX, screenY, 0)
    let matched = false;
    let vertexFound;

    this.lastSnappedPoint = null;

    for(let vertex of vertices){
      let projection = vertex.clone().project(world.camera);
      projection.z = 0;

      let distance = projection.distanceTo(screenCoords);

      if(distance < THRESHOLD){
        this.updatePosition(vertex);
        this.lastSnappedPoint = vertex;
        break;
      }
    }
    return vertexFound;
  }

  updatePosition(point){
    let geometry:any = this.point.geometry;
    let v = geometry.vertices[geometry.vertices.length - 1];
    console.log(v);
    v.copy(point);

    geometry.verticesNeedUpdate = true;
    console.log('point', point)
    //console.log('test', new THREE.Vector3(25,25,0).applyMatrix4(this.modelViewMatrix));
    //this.point.position.set(point.x, point.y, point.z);
  }

  show(){
    this.point.visible = true;
  }

  hide(){
    this.point.visible = false;
  }

}
