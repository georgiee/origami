import * as THREE from 'three';
var OrbitControls = require('three-orbit-controls')(THREE)

var camera, scene, renderer;
var geometry, material, mesh;


window.addEventListener('load', function(){
  init();
  animation();
  create();
})

let mouse = new THREE.Vector2();

function create(){
  var geometry = new THREE.PlaneGeometry( 100, 100, 1);
  var material = new THREE.MeshBasicMaterial( {
      wireframe: true,
      vertexColors: THREE.FaceColors} );

  plane = new THREE.Mesh( geometry, material);
  scene.add( plane );

  var geometry2 = geometry.clone();
  plane = new THREE.Mesh( geometry2, material);
  plane.position.x = 100;
  scene.add( plane );

  console.log(geometry);
  console.log(geometry.vertices)

  function r1(vector){
    //console.log(vector)

    var rotationMatrix = new THREE.Matrix4();

    var angle = Math.PI/180 * 1
    var axis = new THREE.Vector3( 0, 1, 0 ).normalize();

    let matrix = rotationMatrix.makeRotationAxis( axis, angle )
    //matrix.multiply( plane.matrix );
    //matrix.setPosition( new THREE.Vector3(-5,0,0) )

    vector.applyMatrix4( matrix )
  }

  //r1(geometry2.vertices[1])

  function animation2(){
    window.requestAnimationFrame( animation2 );

    //r1(geometry2.vertices[1])
    tt(geometry2.vertices[1], Math.PI/180 * 1);

    geometry2.verticesNeedUpdate = true
  }

  function tt(vector, radiant){
    var around = new THREE.Vector3(-50,0,0);
    var quaternion = new THREE.Quaternion();
    quaternion.setFromAxisAngle( new THREE.Vector3( 0, 1, 0 ), radiant);

    vector.sub(around)
    vector.applyQuaternion( quaternion );
    vector.add(around)
  }

  tt(geometry2.vertices[1], Math.PI/180 * 135);
  tt(geometry2.vertices[3], Math.PI/180 * 135);
  //animation2();

  //r1(geometry2.vertices[3])
  //geometry.vertices[1].x += 100;
  //geometry.vertices[3].x += 100;
}

function init(){

	let container = document.createElement( 'div' );
	document.body.appendChild( container );



  camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 2000 );
	camera.position.z = 400;

	scene = new THREE.Scene();
  camera.lookAt(scene.position);

	var light, object;

	scene.add( new THREE.AmbientLight( 0x404040 ) );

	light = new THREE.DirectionalLight( 0xffffff );
	light.position.set( 0, 1, 0 );
	scene.add( light );

  var axisHelper = new THREE.AxisHelper( 250 );
  scene.add( axisHelper );

  renderer = new THREE.WebGLRenderer( { antialias: true } );
  renderer.setPixelRatio( window.devicePixelRatio );
  renderer.setSize( window.innerWidth, window.innerHeight );

  const controls = new OrbitControls(camera, renderer.domElement);

  container.appendChild( renderer.domElement );

}

let raycaster;

let plane;
let moved = false;

function animation(){
  window.requestAnimationFrame( animation );

  renderer.render( scene, camera);

}


/*
function RotatePointAroundPivot(point: Vector3, pivot: Vector3, angles: Vector3): Vector3 {
  var dir: Vector3 = point - pivot; // get point direction relative to pivot
  dir = Quaternion.Euler(angles) * dir; // rotate it
  point = dir + pivot; // calculate rotated point
  return point; // return it
}

*/
