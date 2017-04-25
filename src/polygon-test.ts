import * as THREE from 'three';
import * as dat from 'dat.gui/build/dat.gui';
import utils from './utils';
import IntersectionPlane from './intersection-plane';
import Origami from './origami';

let container = new THREE.Object3D();
let guiData:any = {}

/* TODO
1. polygonSelect to select all polygons connected to a polygon (but not on the reflecting plane)
2. reflect vertices from polygons along plane normal
3. cutpolygon_pairs + last_cut_polygons to reunited cutted vertices from cutting step before
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
  [10/100,0, 10/100, 1],
  [20/100,0, 20/100, 1],
  [30/100,0, 30/100, 1],
  [40/100,0, 40/100, 1],
]

function create(world){
  const gui = new dat.GUI();
  let camera = world.camera;

  let origami = new Origami();
  container.add(origami);

  origami.addVertex(new THREE.Vector3(0,0,0));
  origami.addVertex(new THREE.Vector3(50,0,0));
  origami.addVertex(new THREE.Vector3(50,50,0));
  origami.addVertex(new THREE.Vector3(0,50,0));

  let polygon = [0,1,2,3];
  origami.addPolygon(polygon);

  let cutter = new IntersectionPlane();
  //container.add(cutter);

  cuts.forEach(cut => {
    cutter.reset();
    cutter.setStart(cut[0],cut[1]);
    cutter.setEnd(cut[2], cut[3]);
    cutter.calculate(camera);

    origami.cut(cutter.plane);
    //origami.reflect(cutter.plane);
    origami.rotationFold(cutter.plane, 35);
  })


  container.add(origami.toMesh());

  return container;
}

export default { create }
