import * as THREE from 'three';
import * as dat from 'dat.gui/build/dat.gui';
import utils from './utils';

import Origami from './origami';
import Ruler from './ruler';

let container = new THREE.Object3D();
let guiData:any = {}

/* TODO
0: Fix Plane Normal if it points in the wrong direction :-)
1. polygonSelect to select all polygons connected to a polygon (but not on the reflecting plane)
*/

function create(world){
  const gui = new dat.GUI();
  const ruler = Ruler.init(world);
  let {cutter} = ruler;
  let {camera} = world;

  let origami = new Origami();
  container.add(origami);
  
  origami.addVertex(new THREE.Vector3(0,0,0));
  origami.addVertex(new THREE.Vector3(50,0,0));
  origami.addVertex(new THREE.Vector3(50,50,0));
  origami.addVertex(new THREE.Vector3(0,50,0));

  origami.addVertex2D(new THREE.Vector3(0,0,0));
  origami.addVertex2D(new THREE.Vector3(50,0,0));
  origami.addVertex2D(new THREE.Vector3(50,50,0));
  origami.addVertex2D(new THREE.Vector3(0,50,0));

  let polygon = [0,1,2,3];
  origami.addPolygon(polygon);
  origami.update();

  guiData.angle = 75;

  guiData.fold = function(){
    console.log('cut with angle', guiData.angle);
    origami.fold(cutter.plane, guiData.angle);
  }

  guiData.reflect = function(){
    origami.reflect(cutter.plane);
  }

  guiData.crease = function(){
    origami.crease(cutter.plane);
  }

  gui.add(guiData,'crease');
  gui.add(guiData,'reflect');
  gui.add(guiData,'fold');
  gui.add(guiData,'angle', 0, 360, 15);

  function replay(x1, y1, x2, y2, options, action = 'fold'){
    ruler.cut(x1,y1,x2,y2);

    if(action === 'fold'){
      origami.fold(ruler.cutter.plane, options.angle);
    }
  }

  replay(0.30584192439862545,0.5292096219931272,-0.16151202749140892,0.14432989690721654, {angle: 120})

  return container;
}

export default { create }
