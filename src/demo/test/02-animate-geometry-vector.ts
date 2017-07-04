import * as THREE from 'three';

import { Origami } from '../../origami/origami';
import { OrigamiMesh } from './../../origami/mesh';

import { Playbook } from './../../playbook';
import * as playbooks from './../../playbooks/index';

import * as pop from 'popmotion';

import * as fragmentShader from './../shaders/simple-depth.fs';
import * as vertexShader from './../shaders/simple-depth.vs';

const rotateVectorAround = (vector, pivot, axis, angle) => {
  return vector
    .sub(pivot)
    .applyAxisAngle(axis, angle)
    .add(pivot);
};

export function run(world) {
  // const shadowMap = world.world.renderer.shadowMap;

  // const shadowMaprender = shadowMap.render;
  // shadowMap.render = function(scene, camera ) {
  //   console.log('shadow')
  //   shadowMaprender(scene, camera);
  // };

  const camera = world.camera as THREE.Camera;
  camera.position.z = 2000;
  camera.lookAt(world.scene.position);

  const geometry = getGeometry();

  const sphere = new THREE.Mesh(new THREE.SphereGeometry(50), new THREE.MeshNormalMaterial());
  world.add(sphere);

  // top left to bottom right
  const axis = new THREE.Vector3(0, 400, 0)
    .sub(new THREE.Vector3(400,0,0)).normalize(); // (-1,1,0);

  // center of the square
  const pivot = new THREE.Vector3(200, 200, 0);

  // Start value of the vector we aniamte
  const vStart = geometry.vertices[3].clone();
  // Reference to the vector we are animating
  const vCurrent = geometry.vertices[3];
  // const material = new THREE.MeshPhongMaterial( {
  //   color: 0xffffff, specular: 0xffffff, shininess: 20, morphTargets: true, shading: THREE.FlatShading } );
  const material = new THREE.MeshStandardMaterial({
    side: THREE.DoubleSide
  });

  const mesh = new THREE.Mesh(geometry, material);

  world.add(mesh);

  mesh.castShadow = true;
  mesh.receiveShadow = false;
  sphere.castShadow = true;
  sphere.position.set(0, 150, 0);

  const updateVectorRotation = (vector) => (progress) => {
    const v2 = rotateVectorAround(vector.clone(), pivot, axis, -Math.PI / 2 * progress)
    sphere.position.copy(v2);
    vCurrent.copy(v2);

    requestGeometryUpdate();
  };




  const depthMaterialTemplate = new THREE.MeshDepthMaterial();
  const RGBADepthPacking = 3201;
  (depthMaterialTemplate as any).depthPacking = RGBADepthPacking;
  // (sphere as any).customDepthMaterial = depthMaterialTemplate

  const uniforms = { texture: { type: 't', value: (sphere.material as any).map } };
  const depthMaterial = new THREE.ShaderMaterial( {
    vertexShader: (vertexShader as any),
    fragmentShader: (fragmentShader as any),
    uniforms,
    side: THREE.DoubleSide
  } );

  (mesh as any).customDepthMaterial = depthMaterial;
  // lerpVectors(v1,v1)(1)

  // console.log(lerpVectors(v1, v2)(1));

  pop.tween({
    duration: 4000,
    yoyo: Infinity,
    onUpdate: updateVectorRotation(vStart)
  }).start();


  function requestGeometryUpdate() {
    geometry.computeFaceNormals();
    geometry.computeVertexNormals();
    geometry.normalsNeedUpdate = true;
    geometry.verticesNeedUpdate = true;
  }
}

function getGeometry() {
  const vertices =[
    new THREE.Vector3(400, 0, 0),
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0, 400, 0),
    new THREE.Vector3(400, 400, 0), // top right
    new THREE.Vector3(400, 0, 0),
    new THREE.Vector3(0, 400, 0)
  ];

  const geometry = new THREE.Geometry();
  geometry.vertices = vertices;
  geometry.faces = [new THREE.Face3(0, 2, 1), new THREE.Face3(3, 5, 4)];
  geometry.computeFaceNormals();

  return geometry;
}

