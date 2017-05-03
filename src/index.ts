import * as THREE from 'three';
import World from './world';
//import Origami from './origami';
//import HalfSpace from './half-space';
import RulerTest from './ruler-test';
import PolygonTest from './polygon-test';
import OrigamiRunner from './refactor/index';
import * as Panel from './refactor/panel';

function run(){
  Panel.create();

  let world = World.getInstance();
  OrigamiRunner.run(world);

  //world.add(RulerTest.create(world));
  //world.add(PolygonTest.create(world));
}

window.addEventListener('load', run)
