
import * as THREE from 'three';
var OrbitControls = require('./vendor/three-orbit-controls')(THREE)
//import { CombinedCamera } from './vendor/combined-camera';

export class World extends THREE.EventDispatcher {
  private mouse = new THREE.Vector2();
  private scene: THREE.Scene;
  private renderer;
  private container;
  public controls;
  private _camera;
  private _camera2;

  constructor() {
    super();
    this.container = document.createElement( 'div' );
    document.body.appendChild( this.container );
    this.render = this.render.bind(this);

    this.init();

  }

  center(point: THREE.Vector3) {
    this.controls.focus(point);
  }

  get domElement(){
    return this.renderer.domElement;
  }

  add(object){
    this.scene.add(object);
  }

  createRenderer(){
    let renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setPixelRatio( window.devicePixelRatio );
    //renderer.setSize( window.innerWidth, window.innerHeight );
    let size = Math.min( window.innerWidth, window.innerHeight )
    renderer.setSize( window.innerWidth, window.innerHeight );
    this.container.appendChild( renderer.domElement );
    this.renderer = renderer;
  }
  resetCamera(){
    this.controls.reset();
  }
  createCamera(){
    let ratio = window.innerWidth/window.innerHeight;

    let width = 1000;
    let height = 1000/ratio;

    var camera = new THREE.OrthographicCamera( width / - 2, width / 2, height / 2, height / - 2, -10000, 10000 );
    this._camera = camera;
    this._camera.__ratio = ratio;
    this._camera.position.z = 1000;
    //this._camera.position.y = -25;

    this.controls = new OrbitControls(this._camera, this.renderer.domElement);
    //this.controls.focus(new THREE.Vector3(0,200,0));
    this.controls.addEventListener('change', () => this.dispatchEvent({type: 'rotate'}))
    this.controls.zoom(0.5);
  }

  init(){
    let scene = new THREE.Scene();
    scene.add( new THREE.AxisHelper( 250 ) );
    scene.add( new THREE.AmbientLight( 0x404040 ) );

    let light = new THREE.DirectionalLight( 0xffffff );
    light.position.set( 0, 1, 0 );
    scene.add( light );

    //let camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 10000 );
    this.scene = scene;

    this.createRenderer();
    this.createCamera();
  }

  start(){
    this.render();
  }

  step(){
    let renderer = this.renderer;

    //renderer.clear();
		//renderer.setScissorTest( true );
		//renderer.setScissor( 0, 0, 500, 1000 );
		//renderer.render( this.scene, this.camera );
		//renderer.setScissor( 500, 0, 500, 1000  );
		//renderer.render( this.scene, camera );

		//renderer.setScissorTest( false );
    this.renderer.render( this.scene, this.camera);
    this.dispatchEvent({type: 'render'});
  }

  render(){
    window.requestAnimationFrame( this.render );
    //this.controls.update();
    this.step();
  }

  get camera(){
    return this._camera;
  }

  get camera2(){
    return this._camera2;
  }
}


let world;

export function getInstance() : World{
  if(world){
    return world;
  }
  world = new World();
  world.start();

  return world;
}

export default { getInstance }
