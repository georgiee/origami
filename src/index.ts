import * as THREE from 'three';
import World from './world';
//import Origami from './origami';
//import HalfSpace from './half-space';
import RulerTest from './ruler-test';

function run(){
  const world = new World();
  world.start();

  world.add(RulerTest.create(world));
}

window.addEventListener('load', run)
