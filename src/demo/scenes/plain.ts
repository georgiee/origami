import * as THREE from 'three';

import * as fragmentShader from 'demo/shaders/sky.fs';
import * as vertexShader from 'demo/shaders/sky.vs';
import { IWorldScene, World } from 'demo/core/world';

export class PlainScene extends THREE.Scene implements IWorldScene {
  private hemiLight: THREE.HemisphereLight;
  private dirLight: THREE.DirectionalLight;
  private backdrop: THREE.Mesh;

  constructor() {
    super();
    this.init();
  }

  public addedToWorld(world: World) {
    const { renderer } = world;

  }

  private init() {

    this.add( new THREE.AxisHelper( 250 ) );
    this.add(new THREE.AmbientLight(0xffffff))
  }
}
