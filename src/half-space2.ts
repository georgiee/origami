import * as THREE from 'three';

class Origami {
  private vertices:Array<THREE.Vector3> = [];
  private polygons_size = 0;
  private polygons = [];

  addVertex(point: THREE.Vector3){
    this.vertices.push(point);
  }

  addPolygon(verticesIndices){
    this.polygons.push(verticesIndices);
    this.polygons_size++;
  }
}


function createArrow( color = 0xffff00){
  return new THREE.ArrowHelper(
              new THREE.Vector3(),
              new THREE.Vector3(),
              100, color);
}

function rulerNormal(camera, start, end){
  let ruler_x1  = start.x;
  let ruler_x2  = end.x;
  let ruler_y1   = start.y;
  let ruler_y2  = end.y;

  let dy = ruler_y2 - ruler_y1;
  let dx = ruler_x1 - ruler_x2;

  let rulerNV = new THREE.Vector3();
  rulerNV.set(
    camera.rotation.x * dy + camera.rotation.y * dx,
    camera.rotation.x * dy + camera.rotation.y * dx,
    camera.rotation.x * dy + camera.rotation.y * dx
  )

  let rulerPoint = new THREE.Vector3();
  if(camera.position.dot(rulerNV) - rulerPoint.dot(rulerNV) > 0){
    rulerNV.multiplyScalar(-1);
  }


  return rulerNV;
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

  mathPlane.setFromNormalAndCoplanarPoint(v3.normalize(), line.getCenter());
  planeToPlane(mathPlane, plane)
}

function create3(world){
  let camera = world.camera;
  let container = new THREE.Object3D();
  let arrow = createArrow();
  container.add(arrow);

  window.addEventListener( 'mousemove', onMouseMove, false );
  let startPoint2D = new THREE.Vector3(0,0,0);
  let endPoint  = new THREE.Vector3(0,0,0);

  let vector1 = new THREE.Vector3();
  let vector2 = new THREE.Vector3();


    let sphere1 = new THREE.Mesh(new THREE.SphereGeometry(5, 10, 10))
    container.add(sphere1);

      let sphere2 = new THREE.Mesh(new THREE.SphereGeometry(5, 10, 10))
      container.add(sphere2);

  function onMouseMove(event){
    endPoint.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    endPoint.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

    let nv = rulerNormal(camera, startPoint2D, endPoint);
    arrow.setDirection(nv)
    /*let direction = new THREE.Vector3();
    direction.copy(startPoint2D)
    direction.sub(endPoint)
    direction.normalize();

    vector2.sub(vector1)
    console.log(direction)
    sphere1.position.copy(endPoint)
    */

    let posStart = mouseTo3D(camera,startPoint2D);
    let posEnd = mouseTo3D(camera,endPoint);

    ///sphere1.position.copy(posStart);
    //sphere2.position.copy(posEnd);

    //unproject(sphere1, camera, endPoint);

    //var dir = vector2.sub( camera.position ).normalize();
    //arrow.setDirection(direction)
    //console.log(endPoint)
  }

  return container;
}


function create2(world){
  let camera = world.camera;
  let container = new THREE.Object3D();

  console.log('create');
  window.addEventListener( 'mousemove', onMouseMove, false );

  var raycaster = new THREE.Raycaster();
  var mouse = new THREE.Vector2();

  let origin = new THREE.Vector3();
  let direction = new THREE.Vector3();


  var arrow = new THREE.ArrowHelper(
              new THREE.Vector3(),
              new THREE.Vector3(),
              100,0xFF3333);


  let planeGeometry =new THREE.PlaneGeometry(100,100,2,2)
  var planeMaterial = new THREE.MeshLambertMaterial({color: 0xffff00, side: THREE.DoubleSide});
  var plane = new THREE.Mesh(planeGeometry, planeMaterial);
  let pplane = new THREE.Plane();

  let ppoint = new THREE.Vector3();
  container.add(plane)

  let startPoint2D = new THREE.Vector2(0,0);
  let mouse3D = new THREE.Vector3(0,0, 0.5);

  let sphere = new THREE.Mesh(new THREE.SphereGeometry(20, 10, 10))
  container.add(sphere);

  function onMouseMove(event){
    //projector.unprojectVector(mouse3D, camera);
    pplane.setFromNormalAndCoplanarPoint(camera.getWorldDirection(), ppoint)

    var coplanarPoint = pplane.coplanarPoint();
    var focalPoint = new THREE.Vector3().copy(coplanarPoint).add(pplane.normal);
    plane.lookAt(focalPoint);
    plane.position.copy(coplanarPoint);

    //plane.lookAt(camera.position)


    //console.log('mouse ok', camera.getWorldDirection());
    mouse3D.x = ( event.clientX / window.innerWidth );
    mouse3D.y = - ( event.clientY / window.innerHeight );
    mouse3D.z = 0.5;
    sphere.position.copy(mouse3D)

    console.log(mouse3D.unproject(camera));

    let line = new THREE.Line3();
    origin.setFromMatrixPosition( camera.matrixWorld );
		direction.set( mouse.x, mouse.y, 0.5 ).unproject( camera ).sub( origin ).normalize();
    arrow.setDirection(direction);
    //arrow.position.copy(origin);
  }




  container.add(arrow);

  return container;
}

export default {create};
