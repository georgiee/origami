import * as THREE from 'three';
import Origami from './origami';

var OrbitControls = require('three-orbit-controls')(THREE)

var camera, scene, renderer;
var geometry, material, mesh;


class OrigamiFace {
  public a: THREE.Vector3;
  public b: THREE.Vector3;
  public c: THREE.Vector3;
  public d: THREE.Vector3;

  constructor(a, b, c, d){
    this.a = a;
    this.b = b;
    this.c = c;
    this.d = d;
  }
}

class Face{
  vertices: Array<THREE.Vector3>;
  edges: Array<Number>;
}

class Edge {
  vertice1: THREE.Vector3;
  vertice2: THREE.Vector3;
}


class Tree {

}

function faceToGeometry(face){
  var geometry = new THREE.Geometry();

  geometry.vertices.push(face.vertices[0]);
  geometry.vertices.push(face.vertices[1]);
  geometry.vertices.push(face.vertices[2]);
  geometry.vertices.push(face.vertices[3]);

  geometry.faces.push( new THREE.Face3( 0, 1, 3 ) ); // counter-clockwise winding order
  geometry.faces.push( new THREE.Face3( 1, 2, 3 ) );

  geometry.computeFaceNormals();
  geometry.computeVertexNormals();

  return geometry;
}

class Origami2 extends THREE.Object3D{
  private faces: Array<any>;

  constructor(){
    super();
    //this.sample();
    this.test();
  }

  test(){
    console.log('test');
    var face = new Face();
    face.vertices = [
      new THREE.Vector3(-50, 50, 0),
      new THREE.Vector3(50, 50, 0),
      new THREE.Vector3(50, -50, 0),
      new THREE.Vector3(-50, -50, 0)
    ]

    let geo = faceToGeometry(face)
    geo.computeFaceNormals();

    let material = new THREE.MeshBasicMaterial( { wireframe: true } );
    let mesh  = new THREE.Mesh( geo, material);

    this.add(mesh);

    //split
    var v1 = new THREE.Vector3(0, 50, 0);
    var v2 = new THREE.Vector3(0, -50, 0);
    //new Edge(v1, v2);

    //edge intersect face = two faces
    //plane through normal and edge
    var plane = new THREE.Plane();
    plane.setFromNormalAndCoplanarPoint(new THREE.Vector3(1,0,0), new THREE.Vector3(0,0,0))

    var m2 = new THREE.LineBasicMaterial({
    	color: 0xff00ff
    });

    var geometry = new THREE.Geometry();
    geometry.vertices.push(v1, v2);

    var line = new THREE.Line( geometry, m2 );
    this.add( line );
  }

  sample(){
    let geometry = new THREE.PlaneGeometry( 100, 100, 1);
    let material = new THREE.MeshBasicMaterial( { wireframe: true } );
    let mesh  = new THREE.Mesh( geometry, material);

    this.add(mesh);
  }

}

window.addEventListener('load', function(){
  init();
  animation();
  create();
})

let mouse = new THREE.Vector2();

function create(){
  let origami = new Origami();
  scene.add(origami);
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
