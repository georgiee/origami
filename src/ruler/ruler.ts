import * as THREE from 'three'
import utils from '../utils';
import math from '../math';
import {World} from '../world';
import RulerHelper from "./ruler-helper";
import MouseControls from './mouse-controls';
import PlaneHelper from './plane-helper';
import {Snapper} from './snapper';

export default class Ruler extends THREE.Object3D {
  private enabled: Boolean = false;
  private startPoint: THREE.Vector2;
  private endPoint: THREE.Vector2;
  private rulerHelper: RulerHelper;
  private controls: MouseControls;
  private planeHelper: PlaneHelper;
  private currentPlane: THREE.Plane;
  constructor(private world: World, private snapper: Snapper){
    super();
    this.snapper = snapper;
    this.init();
  }

  get camera(){
    return this.world.camera;
  }

  init(){
    this.controls = new MouseControls();
    this.controls.addEventListener('move', (event:any) => {
      let point = this.getTargetPosition(event.x, event.y);
      this.moveTo(point.x, point.y);
    })

    this.controls.addEventListener('start', (event:any) => {
      let point = this.getTargetPosition(event.x, event.y);
      this.setCenter(point.x, point.y);
      let pos = this.getLocalPoint(event.x, event.y);
      let s = utils.createSphere();
      s.position.copy(pos);
      this.add(s);

    })

    this.controls.addEventListener('complete', (event:any) => {
      this.completed();
    })

    this.rulerHelper = new RulerHelper();
    this.add(this.rulerHelper);

    this.planeHelper = new PlaneHelper();
    this.add(this.planeHelper);
  }

  getTargetPosition(x, y){
    let mouseLocal = utils.globalToLocal(x, y, this.world.domElement);
    let point = new THREE.Vector3(mouseLocal.x, mouseLocal.y);

    this.snapper.findNearestFromMouse(x, y);

    if(this.snapper.hasSnaped()){
      point = this.snapper.getSnappedPosition();
      point = point.clone().project(this.camera);
    }

    return point;
  }

  enable(){
    this.enabled = true;
    this.controls.enable();

    this.dispatchEvent({type: 'enabled'});
  }

  disable(){
    this.enabled = true;
    this.controls.disable();

    this.dispatchEvent({type: 'disabled'});
  }
  show(plane){
    this.planeHelper.fromPlane(plane);
  }

  completed(){
    this.currentPlane = this.calculate();
    this.planeHelper.fromPlane(this.currentPlane);

    this.disable();
    this.dispatchEvent({type: 'completed', plane: this.currentPlane})

  }

  getLocalPoint(x, y){
    let raycaster = new THREE.Raycaster();
    let plane = new THREE.Plane(new THREE.Vector3(0,0,1), 0);
    //let {x, y} = utils.globalToLocal(clientX, clientY, this.world.domElement);

    let screenCoords = new THREE.Vector3(x, y, this.world.camera.near)
    //plane aligned to camera through origin
    plane.setFromNormalAndCoplanarPoint(this.camera.getWorldDirection(), new THREE.Vector3());

    raycaster.setFromCamera(screenCoords, this.world.camera);
    let result = raycaster.ray.intersectPlane(plane)

    return result;
  }
  getProjectedPosition(x, y){
    return this.getLocalPoint(x, y)
  }


  getNormal(camera, rulerPoint1){
    //make 2d line orthogonal, proejct again and calculate normal
    //2d normal is switch components and negating x
    let vOrtho1 = this.getProjectedPosition(-this.startPoint.y, this.startPoint.x);
    let vOrtho2 = this.getProjectedPosition(-this.endPoint.y, this.endPoint.x);
    let normal = vOrtho2.clone().sub(vOrtho1).normalize();
    let delta = camera.position.dot(normal) - rulerPoint1.dot(normal);

    if(delta < 0){
      return normal.negate();
    }

    return normal;
  }

  calculate() {
    let v1 = this.getProjectedPosition(this.startPoint.x, this.startPoint.y);
    let v2 = this.getProjectedPosition(this.endPoint.x, this.endPoint.y);
    let vCenter = new THREE.Vector3().lerpVectors(v1, v2, 0.5);

    let vNormal = this.getNormal(this.camera, v1);

    let mathPlane = new THREE.Plane()
    mathPlane.setFromNormalAndCoplanarPoint(vNormal, vCenter).normalize();

    return mathPlane;
  }

  setCenter(x, y){
    if(!this.enabled) return;
    this.startPoint = this.endPoint = new THREE.Vector2(x, y)

    this.update();
  }

  moveTo(x, y){
    if(!this.enabled) return;
    this.endPoint = new THREE.Vector2(x, y);

    this.update();
  }

  update(){
    let p1:THREE.Vector3 = this.getProjectedPosition(this.startPoint.x, this.startPoint.y);
    let p2:THREE.Vector3 = this.getProjectedPosition(this.endPoint.x, this.endPoint.y);
    let plane = this.calculate();
    this.rulerHelper.update(p1, p2, plane);
  }


}
