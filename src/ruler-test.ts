import * as THREE from 'three';
import utils from './utils';
import IntersectionPlane from './intersection-plane';

let container = new THREE.Object3D();
import * as dat from 'dat.gui/build/dat.gui';

let guiData:any = {}

function create(world){
  const gui = new dat.GUI();
  let camera = world.camera;

  function newCut(x1, y1, x2, y2){
    let cutter = new IntersectionPlane();
    cutter.setStart(x1, y1);
    cutter.setEnd(x2,y2);
    cutter.calculate(camera)
    container.add(cutter);
  }

  guiData.cutPlane = function(){
    //newCut(-0.7, 0, 0.2, -0.5);
    newCut(-1, -1, 1, 1);
  }

  //guiData.cutPlane();
  gui.add(guiData, 'cutPlane');

  let counter = 0;
  let cutter = new IntersectionPlane();
  container.add(cutter);

  let rulerActive = false;
  window.addEventListener('keydown', function(event){
    console.log();
    if(event.key == 'x'){
      rulerActive = !rulerActive;
    }
  })
  window.addEventListener('mousedown', function(event){
    if(!rulerActive) return;

    let mouse = utils.getMouseScreenCoordinates(event);

    if(counter >= 2){
      counter = 0
    }

    if(counter%2 == 0){
      console.log('set start')
      cutter.reset();
      cutter.setStart(mouse.x, mouse.y);
    }

    if(counter%2 == 1){
      console.log('set end')
      cutter.setEnd(mouse.x, mouse.y);
      cutter.calculate(camera);

      rulerActive = false;
    }

    counter++;

    //let vector = utils.getMouseScreenCoordinates(event);
    //planeFromCamera(vector.x,vector.y)

  })


  world.addEventListener('render', function(){

  })

  return container;
}

export default { create }
