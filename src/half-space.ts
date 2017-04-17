import * as THREE from 'three';

function createArrow( color = 0xffff00){
  return new THREE.ArrowHelper(
              new THREE.Vector3(),
              new THREE.Vector3(),
              100, color);
}

function mouseTo3D(camera, mouse){
  var vector = new THREE.Vector3(mouse.x, mouse.y, mouse.z);
  vector.unproject( camera );
  var dir = vector.sub( camera.position ).normalize();
  var distance = - camera.position.z / dir.z;
  var pos = camera.position.clone().add( dir.multiplyScalar( distance ) );

  return pos;
}



function unproject(object, camera, vector){
  var dir = vector.sub( camera.position ).normalize();
  var distance = - camera.position.z / dir.z;
  var pos = camera.position.clone().add( dir.multiplyScalar( distance ) );

  object.position.copy(pos)
}
// todo: make plane with camera view and line through two points.
// idead: plane form three points?

function planeToPlane(mathPlane, plane){
    var coplanarPoint = mathPlane.coplanarPoint();
    var focalPoint = new THREE.Vector3().copy(coplanarPoint).add(mathPlane.normal);
    plane.lookAt(focalPoint);
    plane.position.copy(coplanarPoint);
}

function create(world){
  let camera = world.camera;
  let container = new THREE.Object3D();

  let plane = new THREE.Mesh(new THREE.PlaneGeometry(100,100,2,2));
  container.add(plane);

    let arrow = createArrow();
    container.add(arrow)
    let arrow2 = createArrow(0x00ffff);
    container.add(arrow2)
    let arrow3 = createArrow(0xff00ff);
    container.add(arrow3)

    let sphere1 = new THREE.Mesh(new THREE.SphereGeometry(5, 10, 10))
    container.add(sphere1);
  let ruler1 = new THREE.Vector3(0,0,0);
  let ruler2 = new THREE.Vector3(100,0,0);
  let rulerDirection = ruler2.clone().sub(ruler1);

  let rulerNormal = new THREE.Vector3(ruler2.y - ruler1.y,ruler1.x - ruler2.x, 0);
  let test = new THREE.Vector3();

  window.addEventListener( 'mousemove', onMouseMove, false );
  let mathPlane = new THREE.Plane()

  function onMouseMove(event){
    let cameraAligned = new THREE.Vector3()
    cameraAligned.crossVectors(camera.getWorldDirection(), camera.up);

    //mathPlane.setFromNormalAndCoplanarPoint(cameraAligned, new THREE.Vector3());
    //planeToPlane(mathPlane, plane)
    //console.log('cameraAligned', cameraAligned)
    arrow.setDirection(cameraAligned)
    arrow.setLength(50)
    test4(camera, arrow2,arrow3, mathPlane, plane);

  }

  //plane.lookAt(rulerDirection)
  return container;
}

function test4(camera, object, arrow3, mathPlane, plane){
  let ruler_x1  = -0.5;
  let ruler_y1   = -0.5;

  let ruler_x2  = 0.5;
  let ruler_y2  = 0.5;

  let dy = ruler_y2 - ruler_y1;
  let dx = ruler_x1 - ruler_x2;

  let v1 = new THREE.Vector3(1,1, 0.5);
  let v2 = new THREE.Vector3(-1,0.1, 0.5);

  let v3 = new THREE.Vector3();
  v3.x = v1.x - v2.x
  v3.y = (v2.y - v1.y);

  v1 = mouseTo3D(camera, v1)
  v2 = mouseTo3D(camera, v2)
  v3 = mouseTo3D(camera, v3)

  let line = new THREE.Line3(v1, v2);

  object.position.copy(line.getCenter());
  object.setDirection(v3.normalize());

  arrow3.position.copy(line.start);
  arrow3.setDirection(line.delta().normalize());
  arrow3.setLength(line.distance(), 10, 10)

  //mathPlane.setFromNormalAndCoplanarPoint(line.delta().normalize(), line.getCenter());
  //planeToPlane(mathPlane, plane)
}

export default {create};
