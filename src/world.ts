import * as THREE from 'three';
import { CreaseViewer } from './crease-viewer';

var OrbitControls = require('./vendor/three-orbit-controls')(THREE)
//import { CombinedCamera } from './vendor/combined-camera';

export class World extends THREE.EventDispatcher {
  private mouse = new THREE.Vector2();
  private scene: THREE.Scene;
  public creaseViewer: CreaseViewer;
  private renderer;
  private container;
  public controls;
  private _camera;

  constructor() {
    super();
    this.container = document.createElement( 'div' );
    document.body.appendChild( this.container );
    this.render = this.render.bind(this);

    this.init();
  }

  center(point: THREE.Vector3) {
    this.controls.move(point.x, point.y)
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
    this._camera.position.z = 100;

    this.controls = new OrbitControls(this._camera, this.renderer.domElement);
    this.controls.addEventListener('change', () => this.dispatchEvent({type: 'rotate'}))

    this.controls.move(200, 200)
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

    this.creaseViewer = new CreaseViewer();
    this.createRenderer();
    this.createCamera();
  }

  start(){
    this.render();
  }

  step(){
    let renderer = this.renderer;

    renderer.clear(0xffffff);
    renderer.setViewport(0,0, window.innerWidth, window.innerHeight);
		renderer.render( this.scene, this.camera );

    this.creaseViewer.render(renderer);

    this.dispatchEvent({type: 'render'});
  }

  render(){
    window.requestAnimationFrame( this.render );
    this.step();
  }

  get camera(){
    return this._camera;
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
