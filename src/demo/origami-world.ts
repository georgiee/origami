import { BasicWorld } from './basic-world';
import * as THREE from 'three';

import * as fragmentShader from './shaders/sky.fs';
import * as vertexShader from './shaders/sky.vs';
import { Subject } from 'rxjs/Subject';
import { Observable } from 'rxjs/Observable';
import { ShadowMapViewer } from '../vendor/shadow-map-viewer';

export class OrigamiWorld {
  public scene: THREE.Scene;
  public render$: Observable<any>;
  public lightShadowMapViewer;

  private world: BasicWorld;
  private hemiLight: THREE.HemisphereLight;

  constructor() {
    this.world = new BasicWorld();

    this.world.renderer.shadowMap.enabled = true;
    this.world.renderer.shadowMap.renderReverseSided = false;

    this.world.renderer.gammaInput = true;
    this.world.renderer.gammaOutput = true;

    this.render$ = Observable.from(this.world.render$);
    this.scene = this.world.getScene();
    this.scene.fog = new THREE.Fog( 0xffffff, 1, 5000 );
    this.scene.fog.color.setHSL( 0.6, 0, 1 );

    this.build();
    this.createSkybox();
  }

  public get camera(): THREE.Camera {
    return this.world.getCamera();
  }

  public add(mesh) {
    this.scene.add(mesh);
  }

  private build() {
    const hemiLight = new THREE.HemisphereLight( 0xffffff, 0xffffff, 0.6 );
    hemiLight.color.setHSL( 0.6, 1, 0.6 );
    hemiLight.groundColor.setHSL( 0.095, 1, 0.75 );
    hemiLight.position.set( 0, 500, 0 );
    this.scene.add( hemiLight );
    this.hemiLight = hemiLight;

    const dirLight = new THREE.DirectionalLight( 0xffffff, 1 );
    dirLight.color.setHSL( 0.1, 1, 0.95 );
    dirLight.position.set( 1, 1.75, -1 );
    dirLight.position.multiplyScalar( 500 );
    // dirLight.position.multiplyScalar( 50 );
    this.scene.add( dirLight );

    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;


    const d = 500;
    const camera = dirLight.shadow.camera as any;

    camera.left = -d;
    camera.right = d;
    camera.top = d;
    camera.bottom = -d;
    camera.far = 1500;

    dirLight.shadow.bias = 0.0001;
    this.scene.add(new THREE.CameraHelper( dirLight.shadow.camera ));

    const groundGeo = new THREE.PlaneBufferGeometry( 10000, 10000 );
    const groundMat = new THREE.MeshPhongMaterial( {
      color: 0xffffff,
      specular: 0x050505,
      side: THREE.FrontSide
    } );
    groundMat.color.setHSL( 0.095, 1, 0.75 );
    const ground = new THREE.Mesh( groundGeo, groundMat );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -33;
    this.scene.add( ground );

    ground.receiveShadow = true;

    this.showShadowmap(dirLight);
  }

  private showShadowmap(light) {
    const lightShadowMapViewer = new ShadowMapViewer( light );

    this.lightShadowMapViewer = lightShadowMapViewer;
    this.lightShadowMapViewer.enabled = false;

    setTimeout(function(){
      lightShadowMapViewer.enabled = true;
    }, 500);

    this.world.resize$.subscribe(() => {
      console.log('reisze');
      lightShadowMapViewer.updateForWindowResize();
    })

    this.render$.subscribe((renderer) => {
       lightShadowMapViewer.update()
       lightShadowMapViewer.render(renderer);
    })
  }

  private createSkybox() {
    const uniforms = {
      topColor:    { value: new THREE.Color( 0x0077ff ) },
      bottomColor: { value: new THREE.Color( 0xffffff ) },
      offset:      { value: 33 },
      exponent:    { value: 0.6 }
    };
    uniforms.topColor.value.copy( this.hemiLight.color );
    this.scene.fog.color.copy( uniforms.bottomColor.value );

    const skyGeo = new THREE.SphereGeometry( 4000, 32, 15 );
    const skyMat = new THREE.ShaderMaterial( {
      vertexShader: (vertexShader as any),
      fragmentShader: (fragmentShader as any),
      uniforms,
      side: THREE.BackSide
    } );
    const sky = new THREE.Mesh( skyGeo, skyMat );
    this.scene.add( sky );
  }
}
