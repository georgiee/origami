import * as THREE from 'three';
import { CreaseViewer } from './crease-viewer';
import * as Rx from 'rxjs';

var OrbitControls = require('./vendor/three-orbit-controls')(THREE)
import OrthographicTrackballControls from './vendor/orthographic-trackback-controls';

//import { CombinedCamera } from './vendor/combined-camera';

export class World extends THREE.EventDispatcher {
  private mouse = new THREE.Vector2();
  private scene: THREE.Scene;
  public creaseViewer: CreaseViewer;
  private renderer;
  private container;
  public orbitControls;
  public orthoTrackballControls;
  private _camera;

  constructor() {
    super();
    this.container = document.createElement( 'div' );
    document.body.appendChild( this.container );
    this.render = this.render.bind(this);

    this.init();
  }
  get controls(){
    return this.orthoTrackballControls;
  }

  center(point: THREE.Vector3) {
    this.controls.reset();
    this.controls.move(-point.x, point.y)
  }

  get domElement(){
    return this.renderer.domElement;
  }

  add(object){
    this.scene.add(object);
  }

  resize(width, height) {
    this.renderer.setSize( width, height );
    this.renderer.setViewport(0,0, width, height);
    let ratio = width/height

    let cameraWidth = 1000;
    let cameraHeight = 1000/ratio;

    let camera = this.camera;
    camera.left = -cameraWidth/2;
  	camera.right = cameraWidth/2;
  	camera.top = cameraHeight/2;
  	camera.bottom = - cameraHeight/2;
	  camera.updateProjectionMatrix();
  }

  createRenderer(){
    let renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );

    this.container.appendChild( renderer.domElement );
    this.renderer = renderer;
  }

  createResizeObserver() {
    const getWindowSize = function(){
      return {width: window.innerWidth, height: window.innerHeight}
    }

    let stream = new Rx.BehaviorSubject(getWindowSize());

    const resizeSubject = Rx.Observable
      .fromEvent(window, 'resize')
      .auditTime(500)
      .map((event: any) => getWindowSize())
      .subscribe(stream);

    stream.subscribe( res => {
      this.resize(res.width, res.height);
    })
  }

  resetCamera(){
    this.controls.reset();
    this.controls.move(-200, 200)
  }

  createCamera(){
    let ratio = window.innerWidth/window.innerHeight;

    let width = 1000;
    let height = 1000/ratio;

    var camera = new THREE.OrthographicCamera( width / - 2, width / 2, height / 2, height / - 2, -10000, 10000 );
    var camera2 = new THREE.OrthographicCamera( width / - 2, width / 2, height / 2, height / - 2, -10000, 10000 );
    this._camera = camera;
    this._camera.position.z = 1000;//must be far enough away otherwise the raycast with the ruler might fail sometimes.

    this.orbitControls = new OrbitControls(camera2, this.renderer.domElement);
    this.orbitControls.addEventListener('change', () => this.dispatchEvent({type: 'rotate'}))
    this.orbitControls.move(200, 200)

    this.createTrackballControl();
  }

  createTrackballControl(){
    let control = new OrthographicTrackballControls(this._camera, this.renderer.domElement );
    control.panSpeed = 1;
    control.rotateSpeed = 2;
    control.zoomSpeed = -0.2;
    control.dynamicDampingFactor = 1;
    control.staticMoving = true;
    this.orthoTrackballControls = control;
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

    this.createResizeObserver();
    this.resetCamera();
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
    this.orthoTrackballControls.update();
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
