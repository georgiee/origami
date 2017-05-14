import * as THREE from 'three';
import Origami from './origami';

export class Playbook {

  constructor(private origami: Origami){}

  run(instructions){
    console.log('run instructions', instructions);
    //this.runCommand(instructions[0]);
    //this.runCommand(instructions[1]);
    //this.runCommand(instructions[3]);
    let instructions2 = [{"command":"FOLD_REFLECTION","ppoint":[-11.391571044921875,-16.4395751953125,-280.6202697753906],"pnormal":[-411.3915710449219,-16.4395751953125,-280.6202697753906]}]
    this.play(instructions2)
    //this.play(instructions.slice(0,4))
    //this.runCommand(instructions[3]);
    //this.runCommand(instructions[4]);
  }

  play(list){
    list.forEach(data => this.runCommand(data))
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
      case "FOLD_REFLECTION": this.foldReflection(plane)
    }
  }

  foldReflection(plane){
    this.origami.reflect(plane);
  }
}
