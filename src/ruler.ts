import World from './world';
import * as THREE from 'three';
import math from './math';
import utils from './utils';
import IntersectionPlane from './intersection-plane';

class Ruler extends THREE.Object3D {
  private startPoint: THREE.Vector2;
  private endPoint: THREE.Vector2;

  private startMarker: THREE.Mesh;
  private endMarker: THREE.Mesh;
  private line: any;
  private camera;
  private enabled = false;
  private world;
  public cutter;

  constructor(){
    super();
    this.init();
    window.addEventListener('keyup', (event) => this.enable());
  }

  enable(){
    this.enabled = true;
    this.world.controls.enabled = false;
    enableMouse(this.world);
  }

  disable(){
    this.enabled = false;
    this.world.controls.enabled = true;
    disableMouse();
  }

  cutNow(){
    console.log("cut @", [this.start.x, this.start.y, this.end.x, this.end.y].join(','));
    this.cut(this.start.x, this.start.y, this.end.x, this.end.y);
  }

  cut(x1, y1, x2, y2){
    let { cutter } = this;
    cutter.reset();

    cutter.setStart(x1, y1);
    cutter.setEnd(x2, y2);
    cutter.calculate(this.camera);
  }

  setWorld(world){
    this.world = world;
  }

  setCamera(camera){
    this.camera = camera;
  }

  get start(){
    return this.startPoint;
  }

  get end(){
    return this.endPoint;
  }

  init(){
    let cutter = new IntersectionPlane();
    this.cutter = cutter;
    this.add(cutter);

    let startMarker = utils.createSphere();
    //this.add(startMarker);
    this.startMarker = startMarker;

    let endMarker = utils.createSphere();
    //this.add(endMarker);
    this.endMarker = endMarker;

    var material = new THREE.LineBasicMaterial( {
      linewidth: 10,
      color: 0xffffff
  } );

    let geometry = new THREE.Geometry();
    geometry.vertices.push(new THREE.Vector3(), new THREE.Vector3());
    var line = new THREE.Line( geometry, material );

    this.line = line;
    this.add(this.line);
  }

  toPosition(x, y){
    let vector = math.getProjectedPosition(x, y, this.camera);
    return vector;
  }

  setCenter(xGlobal, yGlobal){
    if(!this.enabled) return;

    let {x, y} = globalToLocal(xGlobal, yGlobal, this.world.domElement);
    this.startPoint = new THREE.Vector2(x, y)
    this.update();
  }

  saveTo(xGlobal, yGlobal){
    if(!this.enabled) return;

    this.cutNow();
    this.disable();
  }

  moveTo(xGlobal, yGlobal){
    if(!this.enabled) return;
    let {x, y} = globalToLocal(xGlobal, yGlobal, this.world.domElement);
    this.endPoint = new THREE.Vector2(x, y);
    this.update();
  }

  update(){
    if(this.startPoint && this.endPoint){
      let v1 = this.toPosition(this.startPoint.x, this.startPoint.y);
      let v2 = this.toPosition(this.endPoint.x, this.endPoint.y);

      this.line.geometry.vertices[ 0 ].copy(v1);
      this.line.geometry.vertices[ 1 ].copy(v2);
      this.line.geometry.verticesNeedUpdate = true;
    }


    if(this.startPoint){
      let v = this.toPosition(this.startPoint.x, this.startPoint.y);
      this.startMarker.position.copy(v);
    }

    if(this.endPoint){
      let v = this.toPosition(this.endPoint.x, this.endPoint.y);
      this.endMarker.position.copy(v);
    }
  }
}

const ruler = new Ruler();



function mousedown(event){
  document.addEventListener('mousemove', mousemove);
  let { clientX, clientY } = event;
  ruler.setCenter(clientX, clientY);
}

function mouseup(event){
  document.removeEventListener('mousemove', mousemove);
  let { clientX, clientY } = event;
  ruler.saveTo(clientX, clientY);
}

function mousemove(event){
  let { clientX, clientY } = event;
  ruler.moveTo(clientX, clientY);
}

function enableMouse(world){
  document.addEventListener('mousedown', mousedown);
  document.addEventListener('mouseup', mouseup);
}

function disableMouse(){
  document.removeEventListener('mousedown', mousedown);
  document.removeEventListener('mouseup', mouseup);
  document.removeEventListener('mousemove', mousemove);
}

function init(world: World){
  ruler.setWorld(world);
  ruler.setCamera(world.camera);
  world.add(ruler);


  return ruler;
}

function globalToLocal(x,y,element){
  let boundingRect = element.getBoundingClientRect();

  let width = boundingRect.right - boundingRect.left;
  let height = boundingRect.bottom - boundingRect.top;
  let x1 = x - boundingRect.left;
  let y1 = y - boundingRect.top;


  x1 = Math.max(Math.min(x1, width), boundingRect.left)
  y1 = Math.max(Math.min(y1, height), boundingRect.top)

  x1 = x1/width*2 - 1;
  y1 = y1/height* 2 - 1;
  return { x: x1, y: -y1 };
}
export default { init };
