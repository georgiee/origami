import * as THREE from 'three';

export default class PlaneHelper extends THREE.Object3D {
  addArrow(pos, direction, absolute = false){
    let arrow = this.createArrow(0x00ff00);
    arrow.position.copy(pos);
    if(absolute){
      arrow.setLength(direction.length())
      arrow.setDirection(direction.clone().normalize())
    }else{
      arrow.setDirection(direction)

    }
    this.add(arrow)
  }

  reset(){
    while (this.children.length){
      this.remove(this.children[0]);
    }
  }

  fromPlane(mathPlane){
    this.reset();

    let plane = new THREE.Mesh(new THREE.PlaneGeometry(100,100,10,10), new THREE.MeshBasicMaterial({wireframe: true, side:THREE.DoubleSide}));
    this.planeToPlane(mathPlane, plane);

    this.add(plane)
    this.addArrow(mathPlane.coplanarPoint(), mathPlane.normal);
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

 createArrow( color = 0xffff00){
    return new THREE.ArrowHelper(
                new THREE.Vector3(),
                new THREE.Vector3(),
                100, color);
  }
}
