import * as THREE from 'three';
var OrbitControls = require('three-orbit-controls')(THREE)

var camera, scene, renderer;
var geometry, material, mesh;


window.addEventListener('load', function(){
  init();
  animation();

})

let mouse = new THREE.Vector2();

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



	//object = new THREE.Mesh( new THREE.CubeGeometry(100,100,100), materialPoints);
	//scene.add( object );

  var geometry = new THREE.PlaneGeometry( 100, 100, 2);

    var material = new THREE.MeshBasicMaterial( {
      wireframe: true,
      vertexColors: THREE.FaceColors} );




  plane = new THREE.Mesh( geometry, material);

  scene.add( plane );


  var edges = new THREE.EdgesGeometry(new THREE.BufferGeometry().fromGeometry( geometry ), 0.1);

	var line = new THREE.LineSegments( edges );
	line.material.depthTest = false;
	line.material.opacity = 0.25;
	line.material.transparent = true;
	line.position.x = -4;
	//scene.add( new THREE.BoxHelper( line ) );


  let helper = new THREE.FaceNormalsHelper( plane, 2, 0x00ff00, 1 );
  scene.add(helper);

  var axisHelper = new THREE.AxisHelper( 250 );
  scene.add( axisHelper );

  renderer = new THREE.WebGLRenderer( { antialias: true } );
  renderer.setPixelRatio( window.devicePixelRatio );
  renderer.setSize( window.innerWidth, window.innerHeight );

  const controls = new OrbitControls(camera, renderer.domElement);

  container.appendChild( renderer.domElement );

  raycaster = new THREE.Raycaster();
  raycaster.params.Points.threshold = 0.1;
  let mouse = {}
	raycaster.setFromCamera( mouse, camera );


  document.addEventListener( 'mousemove', onDocumentMouseMove, false );

  splitGeometry();
}

let raycaster;
function onDocumentMouseMove( event ) {
  moved = true;

  event.preventDefault();
  mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
  mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
}

let plane;
let moved = false;

function splitGeometry(){
  var geometry = plane.geometry;
  console.log('geometry', geometry);

  var geometry2 = new THREE.Geometry();
  geometry2.verticesNeedUpdate = true;
  geometry2.vertices = [...geometry.vertices]
  geometry2.faces = [...geometry.faces]


  var dotMaterial = new THREE.PointsMaterial( { color:0xff0000, size: 10, sizeAttenuation: false } );
  var dot = new THREE.Points( geometry2, dotMaterial );
  scene.add( dot );

  var group = new THREE.Object3D();
  group.add(dot);

  var material = new THREE.MeshNormalMaterial();
  var mesh = new THREE.Mesh( geometry2, material);
  group.add(mesh);
  group.position.x = 100 + 10;

  scene.add(group)
}
function animation(){
  window.requestAnimationFrame( animation );
  let intersects = [];

  moved = false;

  if(moved){
    raycaster.setFromCamera( mouse, camera );
    intersects = raycaster.intersectObjects([plane]);
  }

	for ( var i = 0; i < intersects.length; i++ ) {
    console.log(intersects);
    let intersect = intersects[ i ];
    console.log(intersect.face.color)
    intersect.face.color.setRGB(1,0,0)
	}

  plane.geometry.colorsNeedUpdate = true

  renderer.render( scene, camera);

}
