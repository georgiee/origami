import * as THREE from 'three';
import OrthographicTrackballControls from './../vendor/orthographic-trackback-controls';
const OrbitControls = require('./../vendor/three-orbit-controls')(THREE);
import * as Rx from 'rxjs';

import { Subject } from 'rxjs/Subject';
import { Observable } from 'rxjs/Observable';

export class BasicWorld {
  public renderSubject = new Subject();
  public render$ = Observable.from(this.renderSubject);

  public resizeSubject = new Subject();
  public resize$ = Observable.from(this.resizeSubject);
  public renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private orthoTrackballControls;
  private controls:any;
  private camera: THREE.Camera;
  private container;

  constructor() {
    this.container = document.createElement( 'div' );
    document.body.appendChild( this.container );
    this.render = this.render.bind(this);

    this.init();
    this.start();
  }

  public getScene() {
    return this.scene;
  }

  public getCamera() {
    return this.camera;
  }

  private init() {
    this.scene = new THREE.Scene();
    this.scene.add( new THREE.AxisHelper( 250 ) );

    this.createRenderer();
    this.createCamera();
    this.createControls();

    this.createResizeObserver();
  }

  private createRenderer() {
    const renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );

    this.container.appendChild( renderer.domElement );
    this.renderer = renderer;
  }

  private start() {
    this.render();
  }

  private render() {
    window.requestAnimationFrame( this.render );
    // this.orthoTrackballControls.update();

    this.step();

  }

  private step() {
    const renderer = this.renderer;

    renderer.clear();

    renderer.setViewport(0, 0, window.innerWidth, window.innerHeight);
    renderer.render( this.scene, this.camera );

    this.renderSubject.next(this.renderer);
  }

  private createControls() {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    // console.log('createControls');

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

  private createCamera() {
    this.camera = new THREE.PerspectiveCamera( 30, window.innerWidth / window.innerHeight, 1, 15000 );
    this.camera.position.set( 0, 0, 1600 );

  }

  private createOrthoCamera() {
    const ratio = window.innerWidth / window.innerHeight;

    const width = 1000;
    const height = 1000 / ratio;

    const camera = new THREE.OrthographicCamera( width / - 2, width / 2, height / 2, height / - 2, -10000, 10000 );
    this.camera = camera;

    // must be far enough away otherwise the raycast with the ruler might fail sometimes.
    this.camera.position.z = 100;
    // flip camera
    this.camera.up.set( 0, -1, 0 );
    this.camera.position.z = -this.camera.position.z;
  }

  private resize(width, height) {
    this.renderer.setSize( width, height );
    this.renderer.setViewport(0, 0, width, height);
    const ratio = width / height;

    const cameraWidth = 1000;
    const cameraHeight = 1000 / ratio;

    this.resizeSubject.next();
    // const camera = this.camera;
    // camera.left = -cameraWidth / 2;
    // camera.right = cameraWidth / 2;
    // camera.top = cameraHeight / 2;
    // camera.bottom = - cameraHeight / 2;
    // camera.updateProjectionMatrix();
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

}
