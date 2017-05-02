import * as THREE from 'three'
import utils from '../../utils';
import math from '../../math';
import {World} from '../../world';
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
      console.log('this.snapper.hasSnaped()', this.snapper.hasSnaped());
      let point = this.getTargetPosition(event.x, event.y);
      this.setCenter(point.x, point.y);
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

  completed(){
    this.currentPlane = this.calculate();
    this.planeHelper.fromPlane(this.currentPlane);

    this.disable();
    this.dispatchEvent({type: 'completed', plane: this.currentPlane})
  }

  getProjectedPosition(x, y){
    let cameraNormal = this.camera.getWorldDirection();
    let v = new THREE.Vector3(x, y, -1); //on near plane
    v.unproject(this.camera);

    let v2 = new THREE.Vector3(x, y, 1); //on near plane
    v2.unproject(this.camera);

    let v3 = new THREE.Vector3().lerpVectors(v, v2, 0.01);

    return v3;
  }


  getNormal(camera, rulerPoint1){
    //make 2d line orthogonal, proejct again and calculate normal
    let vOrtho1 = this.getProjectedPosition(-this.startPoint.y, this.startPoint.x);
    let vOrtho2 = this.getProjectedPosition(-this.endPoint.y, this.endPoint.x);
    let normal = vOrtho2.clone().sub(vOrtho1).normalize();
    let delta = camera.position.dot(normal) - rulerPoint1.dot(normal);

    if(delta > 0){
      console.log('invert normal');
      return normal.negate();
    }

    return normal;
  }

  calculate() {
    let cameraNormal = this.camera.getWorldDirection();

    let v1 = this.getProjectedPosition(this.startPoint.x, this.startPoint.y);
    let v2 = this.getProjectedPosition(this.endPoint.x, this.endPoint.y);
    let center = new THREE.Vector2().lerpVectors(this.startPoint, this.endPoint, 0.5);

    let mathPlane = new THREE.Plane()

    let vCenter = this.getProjectedPosition(center.x,center.y);
    let vNormal = this.getNormal(this.camera, v1);

    mathPlane.setFromNormalAndCoplanarPoint(vNormal, vCenter).normalize();
    var coplanarPoint = mathPlane.coplanarPoint();

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

    this.rulerHelper.update(p1, p2);
  }


}
