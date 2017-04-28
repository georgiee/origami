import utils from './utils';
import * as THREE from 'three';

export default class IntersectionPlane extends THREE.Object3D {
  private _start: THREE.Vector2;
  private _end: THREE.Vector2;
  private mathPlane: THREE.Plane;

  constructor(){
    super();
  }

  setStart(x, y){
    this._start = new THREE.Vector2(x,y);
  }

  setEnd(x, y){
    this._end = new THREE.Vector2(x,y);
  }

  getNormal(camera, rulerPoint1){
    //make 2d line orthogonal, proejct again and calculate normal
    let vOrtho1 = this.getProjectedPosition(-this._start.y, this._start.x, camera);
    let vOrtho2 = this.getProjectedPosition(-this._end.y, this._end.x, camera);
    let normal = vOrtho2.clone().sub(vOrtho1).normalize();

    let delta = camera.position.dot(normal) - rulerPoint1.dot(normal);
    if(delta > 0){
      console.log('invert normal');
      return normal.negate();
    }

    return normal;
  }

  adjustNormal(normal, coplanarPoint, camera){
    let delta = camera.position.dot(normal) - coplanarPoint.dot(normal);
    if(delta > 0){
      return normal.multiplyScalar(-1);

    }

    return normal;
  }

  reset(){
    while (this.children.length){
      this.remove(this.children[0]);
    }
  }

  calculate(camera) {
    let cameraNormal = camera.getWorldDirection();

    let center = new THREE.Vector2().lerpVectors(this._start, this._end, 0.5);
    let v1 = this.getProjectedPosition(this._start.x, this._start.y, camera);
    let v2 = this.getProjectedPosition(this._end.x, this._end.y, camera);

    let mathPlane = new THREE.Plane()

    let vCenter = this.getProjectedPosition(center.x,center.y, camera);
    let vNormal = this.getNormal(camera, v1);

    mathPlane.setFromNormalAndCoplanarPoint(vNormal, vCenter).normalize();
    var coplanarPoint = mathPlane.coplanarPoint();

    //vNormal = this.adjustNormal(vNormal, coplanarPoint, camera)


    //this.addArrow(v1, cameraNormal)
    //this.addArrow(v2, cameraNormal)
    this.addArrow(v1, v2.clone().sub(v1), true)
    //this.addArrow(vCenter, cameraNormal)
    //this.addArrow(vCenter, vNormal)
    this.addArrow(coplanarPoint, vNormal)
    let s = utils.createSphere();
    s.position.copy(coplanarPoint);
    this.add(s)
    this.addPlane(mathPlane);

    this.mathPlane = mathPlane;
  }

  get plane(){
    return this.mathPlane;
  }

  addArrow(pos, direction, absolute = false){
    let arrow = utils.createArrow(0x00ff00);
    arrow.position.copy(pos);
    if(absolute){
      arrow.setLength(direction.length())
      arrow.setDirection(direction.clone().normalize())
    }else{
      arrow.setDirection(direction)

    }
    this.add(arrow)
  }

  addPlane(mathPlane){
    let plane = new THREE.Mesh(new THREE.PlaneGeometry(100,100,10,10), new THREE.MeshBasicMaterial({wireframe: true, side:THREE.DoubleSide}));
    this.planeToPlane(mathPlane, plane);
    this.add(plane)
  }

  planeToPlane(mathPlane, plane, center = null){
      var coplanarPoint = mathPlane.coplanarPoint();
      var focalPoint = new THREE.Vector3().copy(coplanarPoint).add(mathPlane.normal);
      plane.lookAt(focalPoint);
      if(center){
        plane.position.copy(center);
      }else {
        plane.position.copy(coplanarPoint);
      }
  }

  getProjectedPosition(x, y, camera){
    let cameraNormal = camera.getWorldDirection();
    let v = new THREE.Vector3(x, y, -1); //on near plane
    v.unproject(camera);

    let v2 = new THREE.Vector3(x, y, 1); //on near plane
    v2.unproject(camera);

    let v3 = new THREE.Vector3().lerpVectors(v, v2, 0.01);

    return v3;
  }
}
