import * as THREE from 'three';

import * as fragmentShader from 'demo/shaders/sky.fs';
import * as vertexShader from 'demo/shaders/sky.vs';
import { IWorldScene, World } from 'demo/core/world';

export class FoggyGroundScene extends THREE.Scene  {

  private hemiLight: THREE.HemisphereLight;
  private dirLight: THREE.DirectionalLight;
  private ground: THREE.Mesh;

  constructor() {
    super();
    this.init();
  }

  private init() {
    this.enableFog();
    this.addLights();
    this.addEnvironment();
    this.createSkybox();

    this.prepareShadows();
  }

  private enableFog() {
    this.fog = new THREE.Fog( 0xffffff, 1, 5000 );
    this.fog.color.setHSL( 0.6, 0, 1 );
  }

  private createSkybox() {
    const uniforms = {
      topColor:    { value: new THREE.Color( 0x0077ff ) },
      bottomColor: { value: new THREE.Color( 0xffffff ) },
      offset:      { value: 33 },
      exponent:    { value: 0.6 }
    };
    uniforms.topColor.value.copy( this.hemiLight.color );
    this.fog.color.copy( uniforms.bottomColor.value );

    const skyGeo = new THREE.SphereGeometry( 4000, 32, 15 );
    const skyMat = new THREE.ShaderMaterial( {
      vertexShader: (vertexShader as any),
      fragmentShader: (fragmentShader as any),
      uniforms,
      side: THREE.BackSide
    } );

    const sky = new THREE.Mesh( skyGeo, skyMat );
    this.add( sky );
  }

  private addEnvironment() {
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
    this.add( ground );

    this.ground = ground;
  }

  private addLights() {
    const hemiLight = new THREE.HemisphereLight( 0xffffff, 0xffffff, 0.6 );
    hemiLight.color.setHSL( 0.6, 1, 0.6 );
    hemiLight.groundColor.setHSL( 0.095, 1, 0.75 );
    hemiLight.position.set( 0, 500, 0 );
    this.add( hemiLight );

    const dirLight = new THREE.DirectionalLight( 0xffffff, 1 );
    dirLight.color.setHSL( 0.1, 1, 0.95 );
    dirLight.position.set( 1, 1.75, -1 );
    dirLight.position.multiplyScalar( 500 );
    this.add( dirLight );

    this.dirLight = dirLight;
    this.hemiLight = hemiLight;
  }

  private prepareShadows() {
    const d = 500;

    const { dirLight, ground } = this;
    const lightShadow = dirLight.shadow;
    const camera = lightShadow.camera as THREE.OrthographicCamera;

    ground.receiveShadow = true;

    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;

    camera.left = -d;
    camera.right = d;
    camera.top = d;
    camera.bottom = -d;
    camera.far = 1500;
  }
}