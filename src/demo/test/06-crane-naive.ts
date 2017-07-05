import * as THREE from 'three';
import { Origami } from 'origami/origami';
import { Playbook } from 'playbook';
import * as playbooks from 'playbooks/index';

import { World } from 'demo/core/world';
import { FoggyGroundScene } from 'demo/scenes/foggy-ground';
import { Backdrop2Scene } from 'demo/scenes/backdrop2';
import { SimpleOrigamiGeometry } from 'demo/objects/simple-origami-geometry';
export function run() {
  console.log('Starting Test 03');

  const foggyScene = new Backdrop2Scene();
  const world = new World(foggyScene);
  world.showShadowmap(foggyScene.light);

  world.run();

  const origami = createCraneMesh();
  origami.position.set(0, 0, 200);
  origami.castShadow = true;
  world.add(origami);

  const mesh = new THREE.Mesh(new THREE.SphereGeometry(100), new THREE.MeshNormalMaterial());
  mesh.castShadow = true;
  mesh.position.set(0, 0, 300);
  // world.add(mesh);

  const particleLight = new THREE.Mesh(
    new THREE.SphereBufferGeometry( 4, 8, 8 ),
    new THREE.MeshBasicMaterial( { color: 0xffffff })
  );

  const pointLight = new THREE.PointLight( 0xffffff, 1, 500 );
  particleLight.add( pointLight );

  world.add( particleLight );

  world.add( new THREE.AmbientLight( 0x222222 ) );

  world.render$.subscribe(() => {
    const timer = Date.now() * 0.00025;
    foggyScene.light.position.x = Math.sin( timer * 2 ) * 300;

    particleLight.position.x = Math.sin( timer * 7 ) * 50;
    particleLight.position.y = Math.cos( timer * 5 ) * 70;
    particleLight.position.z = Math.cos( timer * 3 ) * 50 + 200;
  });
}

function createCraneMesh() {
  const origami = new Origami();
  const playbook = new Playbook(origami);
  playbook.set(playbooks.working.crane);
  playbook.play(-1);

  const material = new THREE.MeshLambertMaterial({
    color: 0x2194ce,
    side: THREE.DoubleSide
  });

  const origamiGeomtry = new SimpleOrigamiGeometry(origami);
  const origamiMesh = new THREE.Mesh(origamiGeomtry, material);
  origamiMesh.rotateY(Math.PI);
  origamiMesh.rotateX(Math.PI);
  return origamiMesh;
}


