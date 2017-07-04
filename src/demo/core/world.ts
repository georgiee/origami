import * as THREE from 'three';

import { Subscription } from 'rxjs';
import { Subject } from 'rxjs';
import { Observable } from 'rxjs';
import { BehaviorSubject } from 'rxjs';
import * as Rx from 'rxjs';
import 'rxjs/add/observable/fromEvent';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/auditTime';

import { ShadowMapViewer } from 'vendor/shadow-map-viewer';
import { OrbitControls } from 'demo/core/controls/orbit-controls';

export interface IWorldScene {
  addedToWorld(world: World);
}

interface IDimensions {
  width: number;
  height: number;
}

export class World {
  public resize$: Observable<IDimensions>;
  public render$: Observable<any>;
  private resizeSubscription: Subscription;
  private el: HTMLElement;
  private worldSize: IDimensions = { width: 100, height: 100};
  private scene: THREE.Scene;
  private controls: any;
  private lightShadowMapViewer;
  private renderSubject = new Subject();
  private _camera: THREE.Camera;
  private _renderer: THREE.WebGLRenderer;

  constructor(baseScene) {
    this.render = this.render.bind(this);
    this.render$ = Observable.from(this.renderSubject);

    this.init(baseScene);
  }

  public get renderer() {
    return this._renderer;
  }

  public get camera() {
    return this._camera;
  }

  public run() {
    this.resizeSubscription = this.resize$
      .subscribe((size: IDimensions) => {
        this.resize(size);
      });

    this.render();
  }

  public stop() {
    this.resizeSubscription.unsubscribe();
  }

  public add(object: THREE.Object3D) {
    this.scene.add(object);
  }

  public showShadowmap(light) {
    const lightShadowMapViewer = new ShadowMapViewer( light );

    lightShadowMapViewer.enabled = false;
    lightShadowMapViewer.enabled = true;

    lightShadowMapViewer.size.set( 128, 128 );
    lightShadowMapViewer.position.set( 10, 10 );

    this.resize$.subscribe(() => {
      lightShadowMapViewer.updateForWindowResize();
    });

    this.render$.subscribe(() => {
       lightShadowMapViewer.render(this.renderer);
    });

    this.lightShadowMapViewer = lightShadowMapViewer;

  }

  private init(baseScene) {
    this.attachElement();
    this.createRenderer();
    this.createScene(baseScene);
    this.createCamera();
    this.createControls();

    this.resize$ = this.createResizeStream();
  }

  private attachElement() {
    this.el = document.createElement( 'div' );
    document.body.appendChild( this.el );
  }

  private createScene(givenScene) {
    if (givenScene) {
      this.scene = givenScene;

      if ((givenScene as IWorldScene).addedToWorld) {
        givenScene.addedToWorld(this);
      }

    } else {
      this.scene = new THREE.Scene();
      this.scene.add( new THREE.AxisHelper( 250 ) );
    }
  }

  private resize(worldSize: IDimensions) {
    this.worldSize = worldSize;

    const { renderer, camera } = this;

    renderer.setSize( worldSize.width, worldSize.height );
    renderer.setViewport(0, 0, worldSize.width, worldSize.height);

    const perspectiveCamera = camera as THREE.PerspectiveCamera;
    perspectiveCamera.aspect = this.aspect;
    perspectiveCamera.updateProjectionMatrix();
  }

  private render() {
    window.requestAnimationFrame( this.render );
    // this.orthoTrackballControls.update();

    this.step();
  }

  private step() {
    const {renderer} = this;
    renderer.clear();
    renderer.setViewport(0, 0, window.innerWidth, window.innerHeight);
    renderer.render( this.scene, this.camera );

    this.renderSubject.next();
  }

  private createControls() {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
  }

  private createCamera() {
    const camera = new THREE.PerspectiveCamera( 30, this.aspect, 1, 15000 );
    camera.position.set( 0, 0, 1600 );

    this._camera = camera;
  }

  private createRenderer() {

    const renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( this.worldSize.width, this.worldSize.height );

    this.el.appendChild( renderer.domElement );
    this._renderer = renderer;
  }

  private createResizeStream(): Observable<IDimensions> {

    const getWindowSize = function(){
      return {width: window.innerWidth, height: window.innerHeight};
    };

    const stream = new BehaviorSubject(getWindowSize());

    const resizeSubject = Observable
      .fromEvent(window, 'resize')
      .auditTime(500)
      .map((event: any) => getWindowSize())
      .subscribe(stream);

    return stream.asObservable();
  }

  get aspect() {
    return this.worldSize.width / this.worldSize.height;
  }
}
