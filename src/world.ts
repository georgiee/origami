import * as THREE from 'three';
import { CreaseViewer } from './crease-viewer';
import * as Rx from 'rxjs';

import OrthographicTrackballControls from './vendor/orthographic-trackback-controls';

// flip the camera to mathc opengl environments.
// This app uses raw playbooks from such an environment
// and therefore relies on the flipped state. But this is not required
// for custom platys.
const FLIP_CAMERA = true;

export class World extends THREE.EventDispatcher {
  public creaseViewer: CreaseViewer;
  public orthoTrackballControls;
  public camera;

  private mouse = new THREE.Vector2();
  private scene: THREE.Scene;
  private renderer;
  private container;

  constructor() {
    super();
    this.container = document.createElement( 'div' );
    document.body.appendChild( this.container );
    this.render = this.render.bind(this);

    this.init();
  }

  public center(point: THREE.Vector3) {
    this.controls.reset();
    
    if (FLIP_CAMERA) {
      this.controls.move(-point.x, -point.y);
    }else {
      this.controls.move(-point.x, point.y);
    }
  }

  public resetCamera() {
    this.center(new THREE.Vector3(200, 200));
  }

  get controls(){
    return this.orthoTrackballControls;
  }

  get domElement(){
    return this.renderer.domElement;
  }

  private add(object) {
    this.scene.add(object);
  }

  private resize(width, height) {
    this.renderer.setSize( width, height );
    this.renderer.setViewport(0, 0, width, height);
    const ratio = width / height;

    const cameraWidth = 1000;
    const cameraHeight = 1000 / ratio;

    const camera = this.camera;
    camera.left = -cameraWidth / 2;
    camera.right = cameraWidth / 2;
    camera.top = cameraHeight / 2;
    camera.bottom = - cameraHeight / 2;
    camera.updateProjectionMatrix();
  }

  private createRenderer() {
    const renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );

    this.container.appendChild( renderer.domElement );
    this.renderer = renderer;
  }

  private createResizeObserver() {
    
    const getWindowSize = function(){
      return {width: window.innerWidth, height: window.innerHeight};
    };

    const stream = new Rx.BehaviorSubject(getWindowSize());

    const resizeSubject = Rx.Observable
      .fromEvent(window, 'resize')
      .auditTime(500)
      .map((event: any) => getWindowSize())
      .subscribe(stream);

    stream.subscribe( (res) => {
      this.resize(res.width, res.height);
    });
  }

  private createCamera() {
    const ratio = window.innerWidth / window.innerHeight;

    const width = 1000;
    const height = 1000 / ratio;

    const camera = new THREE.OrthographicCamera( width / - 2, width / 2, height / 2, height / - 2, -10000, 10000 );
    
    this.camera = camera;
    // must be far enough away otherwise the raycast with the ruler might fail sometimes.
    this.camera.position.z = 1000; 

    if (FLIP_CAMERA) {
      this.camera.up.set( 0, -1, 0 );
      this.camera.position.z = -this.camera.position.z;
    }

    this.createTrackballControl();
  }

  private createTrackballControl() {
    const control = new OrthographicTrackballControls(this.camera, this.renderer.domElement );
    control.panSpeed = 1;
    control.rotateSpeed = 2;
    control.zoomSpeed = -0.2;
    control.dynamicDampingFactor = 1;
    control.staticMoving = true;
    this.orthoTrackballControls = control;
  }

  private init() {
    const scene = new THREE.Scene();
    scene.add( new THREE.AxisHelper( 250 ) );
    scene.add( new THREE.AmbientLight( 0x404040 ) );

    const light = new THREE.DirectionalLight( 0xffffff );
    light.position.set( 0, 1, 0 );
    scene.add( light );

    // let camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 10000 );
    this.scene = scene;

    this.creaseViewer = new CreaseViewer(250);
    this.createRenderer();
    this.createCamera();
    this.createResizeObserver();
    this.resetCamera();
  }

  private start() {
    this.render();
  }

  private step() {
    const renderer = this.renderer;

    renderer.clear(0xffffff);
    renderer.setViewport(0, 0, window.innerWidth, window.innerHeight);
    renderer.render( this.scene, this.camera );
    this.creaseViewer.render(renderer);

    this.dispatchEvent({type: 'render'});
  }

  private render() {
    window.requestAnimationFrame( this.render );
    this.orthoTrackballControls.update();
    this.step();
  }
}

let world;

export function getInstance(): World {
  if (world) {
    return world;
  }
  world = new World();
  world.start();

  return world;
}

export default { getInstance };
