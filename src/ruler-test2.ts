import * as THREE from 'three';
import utils from './utils';
import IntersectionPlane from './intersection-plane';

let container = new THREE.Object3D();
import * as dat from 'dat.gui/build/dat.gui';


let guiData:any = {}



function create(world){
  const gui = new dat.GUI();

  let camera = world.camera;

  console.log('camera:', camera)
  let a1 = utils.createArrow();
  container.add(a1);

  guiData.unprojectPoints = function(){
    let oSphere1 = utils.createSphereFrom2D(0,0,camera);
    let oSphere2 = utils.createSphereFrom2D(0.5,0.5,camera);

    container.add(oSphere1)
    container.add(oSphere2)
  }

  console.log(guiData.unprojectPoints)
  gui.add(guiData, 'unprojectPoints');

  //guiData.cameraLine()
  //gui.add(guiData, 'cameraLine');

  function planeFromCamera(x, y){
    let cameraNormal = camera.getWorldDirection()

    let v = new THREE.Vector3(x, y, 0);
    v.unproject(camera);

    let arrow = utils.createArrow();
    arrow.position.copy(camera.position);
    arrow.setDirection(cameraNormal)

    container.add(arrow)

    let mathPlane = new THREE.Plane()
    mathPlane.setFromNormalAndCoplanarPoint(cameraNormal, camera.position);

    let plane = new THREE.Mesh(new THREE.PlaneGeometry(100,100,2,2), new THREE.MeshBasicMaterial({side:THREE.DoubleSide}));
    utils.planeToPlane(mathPlane, plane);
    container.add(plane)


    /*var dir = v.sub( camera.position ).normalize();
    var distance = - camera.position.z / dir.z;
    var viewPlanePos = camera.position.clone().add( dir.multiplyScalar( 1 ) );

    let arrow = utils.createArrow();
    arrow.position.copy(viewPlanePos);
    arrow.setDirection(cameraNormal)

    container.add(arrow)*/


  }

  function arrowFromCamera(x, y, camera){
    let arrow = utils.createArrow();

    let v = new THREE.Vector3(x, y, 0);
    v.unproject(camera);

    var dir = v.sub( camera.position ).normalize();
    arrow.setDirection(dir)
    arrow.position.copy(camera.position);
    //arrow.setLength(distance)
    container.add(arrow)
  }


  function arrowToCamera(x, y, camera){
    let arrow = utils.createArrow(0xff0000);

    let cameraNormal = camera.getWorldDirection();

    let v = new THREE.Vector3(x, y, 0);
    v.unproject(camera);

    var dir = v.sub( camera.position ).normalize();
    arrow.setDirection(dir)
    arrow.position.copy(camera.position);
    container.add(arrow)

    var pos = camera.position.clone().add( dir.multiplyScalar( 100 ) );


    arrow.setDirection(cameraNormal.clone().negate())
    arrow.position.copy(pos);
    container.add(arrow)

    var s = utils.createSphere();
    s.position.copy(pos);
    container.add(s)
  }

  function unprojectPoint(x, y, camera){
    let cameraNormal = camera.getWorldDirection();

    let v = new THREE.Vector3(x, y, -1); //on near plane
    v.unproject(camera);

    let v2 = new THREE.Vector3(x, y, 1); //on near plane
    v2.unproject(camera);
    console.log(v, v2);
    let v3 = new THREE.Vector3().lerpVectors(v, v2, 0.01);

    var s = utils.createSphere(0x00ff00, 0.1);
    s.position.copy(v)
    container.add(s)


    let arrow = utils.createArrow(0x00ff00);
    arrow.setLength(100,1,1)
    arrow.position.copy(v3);
    arrow.setDirection(cameraNormal)
    container.add(arrow)
  }

  guiData.cutPlane = function(){
    let cutter = new IntersectionPlane();
    cutter.setStart(-0.7,0)
    cutter.setEnd(0.2,-0.5)
    cutter.calculate(camera)

    container.add(cutter);
  }

  guiData.cutPlane();

  gui.add(guiData, 'cutPlane');
  guiData.unprojectArrows = function(){

    unprojectPoint(-1,1, camera)
    unprojectPoint(1,1, camera)
    unprojectPoint(1,-1, camera)
    unprojectPoint(-1,-1, camera)

    unprojectPoint(0, 0, camera)



    /*arrowFromCamera(-0.5,0.5, camera)
    arrowFromCamera(0.5,0.5, camera)
    arrowFromCamera(0.5,-0.5, camera)
    arrowFromCamera(-0.5,-0.5, camera)
    arrowFromCamera(0, 0, camera)

    arrowToCamera(-0.5,0.5, camera)
    arrowToCamera(0.5,0.5, camera)
    arrowToCamera(0.5,-0.5, camera)
    arrowToCamera(-0.5,-0.5, camera)
    arrowToCamera(0, 0, camera)
    */
  }
  //guiData.unprojectArrows();
  gui.add(guiData, 'unprojectArrows');


  window.addEventListener('mousedown', function(event){
    let vector = utils.getMouseScreenCoordinates(event);
    //planeFromCamera(vector.x,vector.y)

  })

  world.addEventListener('render', function(){

  })

  return container;
}

export default { create }




/*


  guiData.cameraLine = function(){
    let p1 = {x: -0.2, y: -1};
    let p2 = {x: 1, y: 0};


    let y = p2.y - p1.y;
    let x = p1.x - p2.x;

    let y2 = p1.y - p2.y;
    let x2 = p2.x - p1.x;

    let v1 = utils.createPointInFrontOfCamera(p1.x,p1.y, camera);
    let v2 = utils.createPointInFrontOfCamera(p2.x,p2.y, camera);
    let vNormal = v2.clone().sub(v1).normalize();
    let line = utils.createLine(v1, v2);
    container.add(line)

    let planePoint = new THREE.Vector3().lerpVectors(v1,v2, 0.5);

    v1 = utils.createPointInFrontOfCamera(x, y, camera);
    v2 = utils.createPointInFrontOfCamera(x2, y2, camera);
    vNormal = v2.clone().sub(v1).normalize();
    line = utils.createLine(v1, v2);
    container.add(line)

    let mathPlane = new THREE.Plane()

    mathPlane.setFromNormalAndCoplanarPoint(vNormal, planePoint);
    console.log(planePoint)

    let plane = new THREE.Mesh(new THREE.PlaneGeometry(100,100,2,2), new THREE.MeshBasicMaterial({side:THREE.DoubleSide}));
    utils.planeToPlane(mathPlane, plane);
    container.add(plane)

  }

  */
