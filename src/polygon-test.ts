import * as THREE from 'three';
import * as dat from 'dat.gui/build/dat.gui';
import utils from './utils';
import IntersectionPlane from './intersection-plane';
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

  let cutter = new IntersectionPlane();
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

      origami.fold(cutter.plane, 110);
      origami.updateMesh();
      origami.updatePlaneView();
      console.log('cutter updated')
    }

    if(event.key == 'f'){
      cutter.setStart(ruler.start.x, ruler.start.y);
      cutter.setEnd(ruler.end.x, ruler.end.y);
      cutter.calculate(camera);

      origami.reflect(cutter.plane);
      origami.updateMesh();
      origami.updatePlaneView();
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
  origami.updateMesh();
  origami.updatePlaneView();

  return container;
}

export default { create }
