import * as THREE from 'three';

import * as fragmentShader from 'demo/shaders/sky.fs';
import * as vertexShader from 'demo/shaders/sky.vs';
import { IWorldScene, World } from 'demo/core/world';

export class BackdropScene extends THREE.Scene implements IWorldScene {
  private hemiLight: THREE.HemisphereLight;
  private dirLight: THREE.DirectionalLight;
  private backdrop: THREE.Mesh;

  constructor() {
    super();
    this.init();
  }

  public get light() {
    return this.dirLight;
  }

  public addedToWorld(world: World) {
    const { renderer } = world;

    renderer.shadowMap.enabled = true;
    renderer.shadowMap.renderSingleSided = false;
    renderer.shadowMap.renderReverseSided = false;
  }

  private init() {
    this.addLights();
    this.addBackdrop();

    this.prepareShadows();

    this.add( new THREE.AxisHelper( 250 ) );
    this.add(new THREE.DirectionalLightHelper(this.dirLight));
    this.add(new THREE.CameraHelper( this.dirLight.shadow.camera ));
  }

  private addBackdrop() {
    const geoemtry = new THREE.PlaneBufferGeometry( 1000, 1000);
    const material = new THREE.MeshPhongMaterial( {
      color: 0xffffff,
      specular: 0x050505,
      side: THREE.FrontSide
    } );

    material.color.setHSL( 0.095, 1, 0.75 );

    const backdrop = new THREE.Mesh( geoemtry, material );
    // ground.rotation.x = -Math.PI / 2;
    // ground.position.y = -33;
    this.add( backdrop );

    this.backdrop = backdrop;
  }

  private addLights() {
    const hemiLight = new THREE.HemisphereLight( 0xffffff, 0xffffff, 0.6 );
    hemiLight.color.setHSL( 0.6, 1, 0.6 );
    // hemiLight.groundColor.setHSL( 0.095, 1, 0.75 );
    hemiLight.position.set( 0, 500, 0 );
    this.add( hemiLight );

    const dirLight = new THREE.DirectionalLight( 0xffffff, 1 );
    dirLight.color.setHSL( 0.1, 1, 0.95 );
    dirLight.position.set( 0, 0, 1 );
    dirLight.position.multiplyScalar( 1000 );
    this.add( dirLight );

    this.dirLight = dirLight;
    this.hemiLight = hemiLight;
  }

  private prepareShadows() {
    const d = 500;

    const { dirLight, backdrop } = this;
    const lightShadow = dirLight.shadow;
    const camera = lightShadow.camera as THREE.OrthographicCamera;

    backdrop.receiveShadow = true;

    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;

    camera.left = -d;
    camera.right = d;
    camera.top = d;
    camera.bottom = -d;
    camera.far = 1200;
  }
}
