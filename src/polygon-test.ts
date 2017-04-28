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

let cuts = [
  [25/100, -1, 25/100, 1],
  [0, 25/100, 1, 25/100],
  [0, 50/100, 50/100, 0],
  [0,0, 50/100, 50/100],
  [40/100,0, 40/100, 1],
  [20/100,0, 20/100, 1],
  [0, 25/100, 1, 25/100],
]

cuts = [
  [0, 25/100, 1, 25/100],
  [0,0, 50/100, 50/100],
  [40/100,0, 40/100, 1],
  [20/100,0, 20/100, 1]
]

cuts = [
  //[0, 25/100, 1, 25/100]
];

function create(world){
  const ruler = Ruler.init(world);
  let cutter = ruler.cutter;

  const gui = new dat.GUI();
  let camera = world.camera;

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

  container.add(cutter);

  cuts.forEach(cut => {
    cutter.setStart(cut[0],cut[1]);
    cutter.setEnd(cut[2], cut[3]);
    cutter.calculate(camera);

    //origami.reflect(cutter.plane);
    //origami.crease(cutter.plane);
    //origami.fold(cutter.plane, 110);
    origami.fold(cutter.plane, 30);
  })

  cutter.setStart(25/100,0);
  cutter.setEnd(25/100,1);
  //cutter.calculate(camera);

  //origami.cut(cutter.plane);

  //cutter.reset();

  window.addEventListener('keyup', function(event){
    if(event.key == 'r'){
      ruler.enable();
    }

    if(event.key == 'x'){
      cutter.setStart(ruler.start.x, ruler.start.y);
      cutter.setEnd(ruler.end.x, ruler.end.y);
      cutter.calculate(camera);


      origami.update();
    }

    if(event.key == 'f'){
      cutter.setStart(ruler.start.x, ruler.start.y);
      cutter.setEnd(ruler.end.x, ruler.end.y);
      cutter.calculate(camera);


      origami.update();
    }
  })

  //origami.shrink();
  //origami.prune();

  /*cutter.reset();
  cutter.setStart(25/100,0);
  cutter.setEnd(25/100,1);
  cutter.calculate(camera);*/

  //origami.polygonSelect(cutter.plane, 0);

  container.add(origami);
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

  //A: works
  //0.3986254295532645,0.5463917525773196,-0.07560137457044669,0.0068728522336769515
  
  //origami.debug();

  //replay(0.4914089347079038,0.5670103092783505,-0.10996563573883167,-0.05154639175257736, {angle: 135}, 'fold')
  return container;
}

export default { create }
