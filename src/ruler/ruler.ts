import * as THREE from 'three';
import utils from '../utils';
import math from '../math';
import {World} from '../world';
import RulerHelper from './ruler-helper';
import MouseControls from './mouse-controls';
import PlaneHelper from './plane-helper';
import {Snapper} from './snapper';

export default class Ruler extends THREE.Object3D {
  private enabled = false;
  private startPoint: THREE.Vector2;
  private startPointProjected: THREE.Vector3;

  private endPoint: THREE.Vector2;
  private endPointProjected: THREE.Vector3;

  private rulerHelper: RulerHelper;
  private controls: MouseControls;
  private planeHelper: PlaneHelper;
  private currentPlane: THREE.Plane;

  constructor(private world: World, private snapper: Snapper) {
    super();
    this.snapper = snapper;
    this.init();
  }
  public show(plane) {
    this.planeHelper.fromPlane(plane);
  }

  public reset() {
    this.disable();
    this.planeHelper.reset();
  }

  public enable() {
    this.enabled = true;
    this.controls.enable();

    this.dispatchEvent({type: 'enabled'});
  }
  
  private getRulerPoint(mouseX, mouseY) {
    this.snapper.findNearestFromMouse(mouseX, mouseY);

    if (this.snapper.hasSnaped()) {

      const point = this.snapper.getSnappedPosition().project(this.camera);
      return point;

    }else {

      const deviceCoordinates = utils.mouseToDeviceCoordinates(mouseX, mouseY, this.world.domElement);
      const point = new THREE.Vector3(deviceCoordinates.x, deviceCoordinates.y);

      return point;
    }
  }

  private disable() {
    this.enabled = true;
    this.controls.disable();
    this.rulerHelper.reset();

    this.dispatchEvent({type: 'disabled'});
  }

  private completed() {
    this.calculatePlane();
    this.planeHelper.fromPlane(this.currentPlane);

    console.log('new plane: ', this.currentPlane);
    this.disable();
    this.dispatchEvent({type: 'completed', plane: this.currentPlane});
  }

  private getLocalPoint(x, y) {
    const raycaster = new THREE.Raycaster();
    const plane = new THREE.Plane();
    const screenCoords = new THREE.Vector3(x, y, 0);
    raycaster.setFromCamera(screenCoords, this.world.camera);

    // plane aligned to camera through origin
    plane.setFromNormalAndCoplanarPoint(this.camera.getWorldDirection(), new THREE.Vector3());

    const result = raycaster.ray.intersectPlane(plane);

    return result;
  }
  private getProjectedPosition(x, y) {
    return this.getLocalPoint(x, y);
  }

  private getNormal(camera, rulerPoint1) {
    // make 2d line orthogonal, proejct again and calculate normal
    // 2d normal is switch components and negating x

    // So we are flipping the components of the 2d line here.
    // We MUST use the screen coordinates to do so.
    // if we would use the normalized device cords it wouldn't work together with an orthographic projection
    // wher width and height are not square. So back to screen, switch components, and back to device coords.
    let v1Local = utils.deviceToScreen(this.startPoint.x, this.startPoint.y, this.world.domElement);
    let v2Local = utils.deviceToScreen(this.endPoint.x, this.endPoint.y, this.world.domElement);

    v1Local = utils.mouseToDeviceCoordinates(-v1Local.y, v1Local.x, this.world.domElement, false);
    v2Local = utils.mouseToDeviceCoordinates(-v2Local.y, v2Local.x, this.world.domElement, false);

    const vOrtho1 = this.getProjectedPosition(v1Local.x, v1Local.y);
    const vOrtho2 = this.getProjectedPosition(v2Local.x, v2Local.y);
    const normal = vOrtho2.clone().sub(vOrtho1).normalize();

    const delta = camera.position.dot(normal) - rulerPoint1.dot(normal);

    if (delta < 0) {
      return normal.negate();
    }

    return normal;
  }

  private calculatePlane() {
    if (!this.endPointProjected || !this.startPointProjected) {
      return; // raycast failed or didn't move
    }

    const vCenter = new THREE.Vector3().lerpVectors(this.startPointProjected, this.endPointProjected, 0.5);
    const vNormal = this.getNormal(this.camera, this.startPointProjected);

    const mathPlane = new THREE.Plane();
    mathPlane.setFromNormalAndCoplanarPoint(vNormal, vCenter).normalize();

    this.currentPlane = mathPlane;
  }

  private setStart(x, y) {
    if (!this.enabled) {
      return;
    }

    this.startPoint = this.endPoint = new THREE.Vector2(x, y);
    this.startPointProjected = this.getProjectedPosition(x, y);
  }

  private moveTo(x, y) {
    if (!this.enabled) {
      return;
    }

    this.endPoint = new THREE.Vector2(x, y);
    this.endPointProjected = this.getProjectedPosition(x, y);
    
    this.update();
  }

  private update() {
    // this happens when the raycast fails. In most cases it is because the camera's z value is to low compared to the
    // width of the origami.
    if (!this.endPointProjected || !this.startPointProjected) {
      this.disable();
      return;
    }

    this.rulerHelper.update(this.startPointProjected, this.endPointProjected);
    this.rulerHelper.show();
  }

  private init() {
    this.rulerHelper = new RulerHelper();
    this.add(this.rulerHelper);

    this.planeHelper = new PlaneHelper();
    this.add(this.planeHelper);

    this.initMouse();
  }

  get camera(){
    return this.world.camera;
  }

  private initMouse() {
    this.controls = new MouseControls();

    this.controls.addEventListener('move', (event: any) => {
      const point = this.getRulerPoint(event.x, event.y);
      this.moveTo(point.x, point.y);
      this.calculatePlane();
      this.dispatchEvent({type: 'update', plane: this.currentPlane});
    });

    this.controls.addEventListener('start', (event: any) => {
      const point = this.getRulerPoint(event.x, event.y);
      this.setStart(point.x, point.y);
    });

    this.controls.addEventListener('complete', (event: any) => {
      this.completed();
    });
  }

}
