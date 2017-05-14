import * as THREE from 'three';

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

function createSphere(color = 0xff0000,size = 2){
  let s = new THREE.Mesh(new THREE.SphereGeometry(size, 10, 10), new THREE.MeshBasicMaterial({wireframe:true,color}))
  return s;
}

function createArrow( color = 0xffff00){
  return new THREE.ArrowHelper(
              new THREE.Vector3(),
              new THREE.Vector3(),
              100, color);
}

function createSphereFrom2D(x, y, camera){
  let pos = createPointFrom2D(x,y,camera)
  let sphere = createSphere();
  sphere.position.copy(pos);

  return sphere;
}

function getProjectedPosition(x, y, camera){
  let cameraNormal = camera.getWorldDirection();

  let v = new THREE.Vector3(x, y, -1); //on near plane
  v.unproject(camera);

  let v2 = new THREE.Vector3(x, y, 1); //on near plane
  v2.unproject(camera);

  let v3 = new THREE.Vector3().lerpVectors(v, v2, 0.01);

  return v3;
}

function createPointFrom2D(x, y, camera){
  let v = new THREE.Vector3(x, y, 0);
  v.unproject(camera);

  var dir = v.sub( camera.position ).normalize();
  var distance = - camera.position.z / dir.z;
  var pos = camera.position.clone().add( dir.multiplyScalar( distance ) );
  return pos;
}


function createPointInFrontOfCamera(x, y, camera, distance = 100){
  let v = new THREE.Vector3(x, y, 0);
  v.unproject(camera);

  var dir = v.sub( camera.position ).normalize();
  var pos = camera.position.clone().add( dir.multiplyScalar( distance ) );
  return pos;
}


function createLine(v1, v2){
  let geometry = new THREE.Geometry();
  geometry.vertices.push(v1);
  geometry.vertices.push(v2);
  let edges = new THREE.LineSegments(geometry);

  return edges;
}


function getMouseScreenCoordinates(event){
  let x = ( event.clientX / window.innerWidth ) * 2 - 1;
	let y = - ( event.clientY / window.innerHeight ) * 2 + 1;

  let v = new THREE.Vector3(x, y, 0.5);
  return v;
}
function planeToPlane(mathPlane, plane){
    var coplanarPoint = mathPlane.coplanarPoint();
    var focalPoint = new THREE.Vector3().copy(coplanarPoint).add(mathPlane.normal);
    plane.lookAt(focalPoint);
    plane.position.copy(coplanarPoint);

    return plane;
}


function getPlaneMesh(mathPlane){
  let plane = new THREE.Mesh(new THREE.PlaneGeometry(100,100,10,10), new THREE.MeshBasicMaterial({wireframe: true, side:THREE.DoubleSide}));
  return planeToPlane(mathPlane, plane);
}


export default {
  createArrow,
  createSphere,
  createPointFrom2D,
  createPointInFrontOfCamera,
  createLine,
  planeToPlane,
  createSphereFrom2D,
  getMouseScreenCoordinates,
  getProjectedPosition,
  globalToLocal,
  getPlaneMesh
}
