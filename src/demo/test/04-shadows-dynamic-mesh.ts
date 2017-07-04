import * as THREE from 'three';

import { World } from 'demo/core/world';
import { FoggyGroundScene } from 'demo/scenes/foggy-ground';
import { BackdropScene } from 'demo/scenes/backdrop';

// Demonstrates how a mesh with a updated geometry casts a shadow
// I was under the impression that this shoudl require a separate Materil through customDepthMaterial
// to cast a correct shadow. But this is working?
export function run() {
  console.log('Starting Test 04');

  const backropScene = new BackdropScene();
  const world = new World(backropScene);
  world.showShadowmap(backropScene.light);

  world.run();



  const geometry = new THREE.Geometry();

  geometry.vertices = [
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0, 50, 0),
    new THREE.Vector3(50, 50, 0),
    new THREE.Vector3(50, 0, 0)
  ];

  geometry.faces = [
    new THREE.Face3(0, 1, 2),
    new THREE.Face3(2, 3, 0)
  ];
  geometry.computeFaceNormals();
  geometry.center();

  const mesh = new THREE.Mesh(geometry, new THREE.MeshNormalMaterial({
    side: THREE.FrontSide
  }));

  mesh.castShadow = true;
  mesh.position.set(0, 0, 200);
  mesh.rotateY(Math.PI);
  world.add(mesh);

  let theta = 0;
  const rad = Math.PI/180;
  const bottomLeft: THREE.Vector3 = geometry.vertices[0];

  world.render$.subscribe(() => {
    theta += 1/60 * 30;
    bottomLeft.z = Math.sin(theta * rad) * 50;
    bottomLeft.x = Math.cos(theta * rad) * 10;

    geometry.computeFaceNormals();
    geometry.computeVertexNormals();
    geometry.normalsNeedUpdate = true;
    geometry.verticesNeedUpdate = true;
  })

}
