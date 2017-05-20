import * as THREE from 'three';
import Origami from './origami';

export class Playbook {

  constructor(private origami: Origami){}

  run(instructions){
    this.play(instructions)
  }

  play(list, count = -1){
    list.slice(0, count).forEach(data => this.runCommand(data))
  }
  getPlane({pnormal, ppoint}){
    let normal = new THREE.Vector3().fromArray(pnormal).normalize();
    let coplanar = new THREE.Vector3().fromArray(ppoint);
    let plane = new THREE.Plane().setFromNormalAndCoplanarPoint(normal, coplanar);

    return plane;
  }

  runCommand(data){
    console.log('runCommand', data);

    let ruler = this.origami.getRuler()
    let plane = this.getPlane(data);
    ruler.show(plane);

    switch(data.command){
      case "FOLD_REFLECTION": this.foldReflection(plane);break;
      case "FOLD_REFLECTION_P": this.foldReflection(plane, data.polygonIndex);break;
      case "FOLD_ROTATION_P": this.foldRotation(plane, data.phi, data.polygonIndex);break;
      case "FOLD_CREASE": this.crease(plane);break;
    }
  }
  foldRotation(plane, angle, index?){
    this.origami.fold(plane, angle, index )
  }
  foldReflection(plane, index = null){
    console.log('foldReflection', index)
    this.origami.reflect(plane, index);
  }

  crease(plane){
    this.origami.crease(plane);
  }
}
