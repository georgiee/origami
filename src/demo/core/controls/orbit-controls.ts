import * as THREE from 'three';
const OriginalControls = require('vendor/three-orbit-controls')(THREE);

export class OrbitControls {
  private controls: any;

  constructor(camera, domElement) {
    this.controls = new OriginalControls(camera, domElement);
  }
}
