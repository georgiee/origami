
import * as THREE from 'three';
var OrbitControls = require('three-orbit-controls')(THREE)
import TrackbackControls from './trackback-controls';

export default class World extends THREE.EventDispatcher {
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
    renderer.setSize( window.innerHeight, window.innerHeight );
    this.container.appendChild( renderer.domElement );
    this.renderer = renderer;
  }

  createCamera(){
    let ratio = window.innerWidth/window.innerHeight;

    let width = 200;
    let height = 200;

    var camera = new THREE.OrthographicCamera( width / - 2, width / 2, height / 2, height / - 2, -5000, 10000 );
    //camera.position.y = 100;
    camera.position.z = 100;

    this._camera = camera;

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    ///this.controls = new TrackbackControls(this.camera, this.renderer.domElement);
    this.controls.addEventListener('change', () => this.dispatchEvent({type: 'rotate'}))
  }

  init(){
    let scene = new THREE.Scene();
    scene.add( new THREE.AxisHelper( 250 ) );
    scene.add( new THREE.AmbientLight( 0x404040 ) );

    let light = new THREE.DirectionalLight( 0xffffff );
    light.position.set( 0, 1, 0 );
    scene.add( light );

    //let camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 10000 );
    //camera.position.z = 200;
    this.scene = scene;

    this.createRenderer();
    this.createCamera();
  }

  start(){
    this.render();
  }

  step(){
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
