import { BasicWorld } from './basic-world';
import * as THREE from 'three';

import * as fragmentShader from './shaders/sky.fs';
import * as vertexShader from './shaders/sky.vs';

export class OrigamiWorld {
  private world: BasicWorld;
  private scene: THREE.Scene;
  private hemiLight: THREE.HemisphereLight;

  constructor() {
    this.world = new BasicWorld();
    this.scene = this.world.getScene();
    this.scene.fog = new THREE.Fog( 0xffffff, 1, 5000 );
    this.scene.fog.color.setHSL( 0.6, 0, 1 );

    this.build();
    this.createSkybox();
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
    dirLight.position.set( -1, 1.75, 1 );
    dirLight.position.multiplyScalar( 50 );
    this.scene.add( dirLight );

    const groundGeo = new THREE.PlaneBufferGeometry( 10000, 10000 );
    const groundMat = new THREE.MeshPhongMaterial( { color: 0xffffff, specular: 0x050505 } );
    groundMat.color.setHSL( 0.095, 1, 0.75 );
    const ground = new THREE.Mesh( groundGeo, groundMat );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -33;
    this.scene.add( ground );
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
