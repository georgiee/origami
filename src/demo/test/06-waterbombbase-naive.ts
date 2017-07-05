import * as THREE from 'three';
import { Origami } from 'origami/origami';
import { Playbook } from 'playbook';
import * as playbooks from 'playbooks/index';

import { World } from 'demo/core/world';
import { FoggyGroundScene } from 'demo/scenes/foggy-ground';
import { PlainScene } from 'demo/scenes/plain';
import { SimpleOrigamiGeometry } from 'demo/objects/simple-origami-geometry';
export function run() {
  console.log('Starting Test 03');

  const foggyScene = new PlainScene();
  const world = new World(foggyScene);

  world.run();

  const origami = createBirdBase();
  origami.position.set(0, 200, 0);
  world.add(origami);

  const mesh = new THREE.Mesh(new THREE.SphereGeometry(100), new THREE.MeshNormalMaterial());
  mesh.position.set(0, 0, 300);

  world.render$.subscribe(() => {
  });
}

function createBirdBase() {
  const origami = new Origami();
  const playbook = new Playbook(origami);
  playbook.set(playbooks.working.waterbombbase);
  playbook.play(-1);

  const material = new THREE.MeshLambertMaterial({
    color: 0x2194ce,
    side: THREE.DoubleSide
  });

  const origamiGeomtry = new SimpleOrigamiGeometry(origami);
  const origamiMesh = new THREE.Mesh(origamiGeomtry, material);
  // origamiMesh.rotateZ(45 * Math.PI/180);

  return origamiMesh;
}


