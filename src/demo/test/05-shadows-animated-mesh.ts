import * as THREE from 'three';

import { World } from 'demo/core/world';
import { FoggyGroundScene } from 'demo/scenes/foggy-ground';
import { BackdropScene } from 'demo/scenes/backdrop';

export function run() {
  console.log('Starting Test 04');

  const backropScene = new BackdropScene();
  const world = new World(backropScene);
  world.showShadowmap(backropScene.light);

  world.run();

  const sphere = new THREE.Mesh(new THREE.SphereGeometry(50), new THREE.MeshNormalMaterial());
  sphere.castShadow = true;
  world.add(sphere);

  const geometry = getGeometry();
  geometry.center();

  const material = new THREE.MeshStandardMaterial({
    side: THREE.DoubleSide
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  mesh.position.z = 300;
  // mesh.rotateY(Math.PI + 30/180*Math.PI)
  world.add(mesh);

  let theta = 0;
  const rad = Math.PI / 180;

  const axis = geometry.vertices[1].clone()
    .sub(geometry.vertices[3]);

  const axisNormalized = axis.normalize();

  const pivot = axis.setLength(axis.length() * 0.5);
  const vCurrent = geometry.vertices[2];
  const vStart = geometry.vertices[2].clone();

  const updateVectorRotation = (vector) => (progress) => {
    const rotatedVector = rotateVectorAround(vector.clone(), pivot, axisNormalized, Math.PI / 2 * progress);
    vCurrent.copy(rotatedVector);

    sphere.position.copy(vCurrent);
    mesh.localToWorld(sphere.position);
  };

  world.render$.subscribe(() => {
    theta += 1 / 60;
    const progress = Math.sin(theta);
    mesh.rotation.y = progress;
    updateVectorRotation(vStart)(progress);
    updateGeometry(geometry);
  });

}

function updateGeometry(geometry) {
  geometry.computeFaceNormals();
  geometry.computeVertexNormals();
  geometry.normalsNeedUpdate = true;
  geometry.verticesNeedUpdate = true;
}

function getGeometry(): THREE.Geometry {
  const vertices = [
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0, 400, 0),
    new THREE.Vector3(400, 400, 0), // top right
    new THREE.Vector3(400, 0, 0)
  ];

  const geometry = new THREE.Geometry();
  geometry.vertices = vertices;
  geometry.faces = [
    new THREE.Face3(0, 3, 1),
    new THREE.Face3(3, 2, 1)
  ];
  geometry.computeFaceNormals();

  return geometry;
}

function rotateVectorAround(vector, pivot, axis, angle) {
  return vector
    .sub(pivot)
    .applyAxisAngle(axis, angle)
    .add(pivot);
}
