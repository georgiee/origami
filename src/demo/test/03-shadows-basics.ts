import * as THREE from 'three';

import { World } from 'demo/core/world';
import { FoggyGroundScene } from 'demo/scenes/foggy-ground';
import { BackdropScene } from 'demo/scenes/backdrop';

export function run() {
  console.log('Starting Test 03');

  const backropScene = new BackdropScene();
  const world = new World(backropScene);
  world.showShadowmap(backropScene.light);

  world.run();

  const mesh = new THREE.Mesh(new THREE.SphereGeometry(100), new THREE.MeshNormalMaterial());
  mesh.castShadow = true;
  mesh.position.set(0, 0, 200);
  world.add(mesh);

  let theta = 0;
  const rad = Math.PI/180;

  world.render$.subscribe(() => {
    theta += 1/60 * 30;
    backropScene.light.position.x = Math.sin(theta * rad) * 100;
  });
}
