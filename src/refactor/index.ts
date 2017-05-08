import * as THREE from 'three';
import OrigamiShape from "./origami-shape";
import OrigamiMesh from './origami-mesh';
import Origami from './origami';

function run(world){
  run2(world);
}

function run2(world){
  let origami = new Origami(world, createSquare());
  world.add(origami);

  let ruler = origami.getRuler();

  window.addEventListener('keyup', (event) => {
    if(event.key == 't'){
      ruler.enable()
    }
  });
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

export default {run};
