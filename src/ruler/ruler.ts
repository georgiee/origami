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
  private startPointProjected: THREE.Vector3;

  private endPoint: THREE.Vector2;
  private endPointProjected: THREE.Vector3;

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
    this.rulerHelper = new RulerHelper();
    this.add(this.rulerHelper);

    this.planeHelper = new PlaneHelper();
    this.add(this.planeHelper);

    this.initMouse();
  }

  initMouse() {
    this.controls = new MouseControls();

    this.controls.addEventListener('move', (event:any) => {
      const point = this.getRulerPoint(event.x, event.y);
      this.moveTo(point.x, point.y);
    })

    this.controls.addEventListener('start', (event:any) => {
      let point = this.getRulerPoint(event.x, event.y);
      this.setStart(point.x, point.y);
    })

    this.controls.addEventListener('complete', (event:any) => {
      this.completed();
    })
  }

  getRulerPoint(mouseX, mouseY){
    this.snapper.findNearestFromMouse(mouseX, mouseY);

    if(this.snapper.hasSnaped()){

      let point = this.snapper.getSnappedPosition().project(this.camera);
      return point;

    }else{

      const deviceCoordinates = utils.mouseToDeviceCoordinates(mouseX, mouseY, this.world.domElement);
      let point = new THREE.Vector3(deviceCoordinates.x, deviceCoordinates.y);

      return point;
    }
  }

  enable(){
    this.enabled = true;
    this.controls.enable();

    this.dispatchEvent({type: 'enabled'});
  }

  disable(){
    this.enabled = true;
    this.controls.disable();
    this.rulerHelper.reset();
    
    this.dispatchEvent({type: 'disabled'});
  }

  reset(){
    this.disable();
    this.planeHelper.reset();
  }

  show(plane){
    this.planeHelper.fromPlane(plane);
  }

  completed(){
    if(!this.endPointProjected || !this.startPointProjected){
      //raycast failed or didn't move
      this.disable();
      return;
    }

    this.calculatePlane();
    this.planeHelper.fromPlane(this.currentPlane);

    this.disable();
    this.dispatchEvent({type: 'completed', plane: this.currentPlane})
  }

  getLocalPoint(x, y){
    let raycaster = new THREE.Raycaster();
    let plane = new THREE.Plane();
    let screenCoords = new THREE.Vector3(x, y, 0);
    raycaster.setFromCamera(screenCoords, this.world.camera);

    //plane aligned to camera through origin
    plane.setFromNormalAndCoplanarPoint(this.camera.getWorldDirection(), new THREE.Vector3());

    let result = raycaster.ray.intersectPlane(plane)

    return result;
  }
  getProjectedPosition(x, y){
    return this.getLocalPoint(x, y)
  }


  getNormal(camera, rulerPoint1){
    //make 2d line orthogonal, proejct again and calculate normal
    //2d normal is switch components and negating x

    // So we are flipping the components of the 2d line here.
    // We MUST use the screen coordinates to do so.
    // if we would use the normalized device cords it wouldn't work together with an orthographic projection
    // wher width and height are not square. So back to screen, switch components, and back to device coords.
    let v1Local = utils.deviceToScreen(this.startPoint.x, this.startPoint.y, this.world.domElement);
    let v2Local = utils.deviceToScreen(this.endPoint.x, this.endPoint.y, this.world.domElement);

    v1Local = utils.mouseToDeviceCoordinates(-v1Local.y, v1Local.x, this.world.domElement, false);
    v2Local = utils.mouseToDeviceCoordinates(-v2Local.y, v2Local.x, this.world.domElement, false);

    let vOrtho1 = this.getProjectedPosition(v1Local.x, v1Local.y);
    let vOrtho2 = this.getProjectedPosition(v2Local.x, v2Local.y);
    let normal = vOrtho2.clone().sub(vOrtho1).normalize();

    let delta = camera.position.dot(normal) - rulerPoint1.dot(normal);

    if(delta < 0){
      return normal.negate();
    }

    return normal;
  }

  calculatePlane() {
    let vCenter = new THREE.Vector3().lerpVectors(this.startPointProjected, this.endPointProjected, 0.5);
    let vNormal = this.getNormal(this.camera, this.startPointProjected);

    let mathPlane = new THREE.Plane()
    mathPlane.setFromNormalAndCoplanarPoint(vNormal, vCenter).normalize();

    this.currentPlane = mathPlane;
  }

  setStart(x, y){
    if(!this.enabled) return;

    this.startPoint = this.endPoint = new THREE.Vector2(x, y)
    this.startPointProjected = this.getProjectedPosition(x, y);
  }

  moveTo(x, y){
    if(!this.enabled) return;

    this.endPoint = new THREE.Vector2(x, y);
    this.endPointProjected = this.getProjectedPosition(x, y);

    this.update();
  }

  update(){
    // this happens when the raycast fails. In most cases it is because the camera's z value is to low compared to the width of the origami.
    if(!this.endPointProjected || !this.startPointProjected){
      this.disable();
      return;
    }

    this.rulerHelper.update(this.startPointProjected, this.endPointProjected);
    this.rulerHelper.show();
  }


}
