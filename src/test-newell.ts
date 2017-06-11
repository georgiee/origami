import * as THREE from 'three';
import { Polygon } from './polygon';
import utils from './utils';

// Here I test an algorith to rotate plane polygon onto the XY Plane so
// I can properly triangulate- which won't handle the z component
// testSet1 show a rectangle that can't be triangulated normally.
const testSet1 = [
  new THREE.Vector3(0, 0, 0),
  new THREE.Vector3(0, 0 , 100),
  new THREE.Vector3(0, 100, 100),
  new THREE.Vector3(0, 100, 0)
];

const testSet2 = [
  new THREE.Vector3(),
  new THREE.Vector3(0, 300, 500),
  // new THREE.Vector3(100, 100, 0),
  new THREE.Vector3(300, 0, 500)
];

function test(polygon, scene, simple = false) {
  const geom = new THREE.Geometry();
  let triangles;

  triangles = polygon.triangulate();
  const faces = triangles.map((triangle) => new THREE.Face3(triangle[0], triangle[1], triangle[2]));

  console.log('triangles', triangles);

  geom.vertices.push(...polygon.points);
  geom.faces.push(...faces);
  geom.computeFaceNormals();

  const object = new THREE.Mesh( geom, new THREE.MeshNormalMaterial({side: THREE.DoubleSide}) );

  const arrow =  new THREE.ArrowHelper( polygon.getNormal(), new THREE.Vector3(), 100, 0xffff00);
  arrow.position.copy(polygon.points[1]);
  scene.add(object);
  scene.add(arrow);
}

export function testNewell(world) {
  // test(testSet2, this.world);

  const polygon1 = new Polygon(testSet1);
  test(polygon1, world);

  // const polygon2 = new Polygon(alignWithXYPlane(testSet1));
  const polygon2 = new Polygon(testAlignVertices(testSet1, world));
  test(polygon2, world);

}

function addPlane(normal, scene) {
  const plane = new THREE.Plane(normal);
  const planeMesh = utils.getPlaneMesh(plane, 500);
  scene.add(planeMesh);
}

// This is the magic. Rotate any polygon on the XY Plane so we can do a proper triangulation
// https://gamedev.stackexchange.com/questions/48095/rotating-3d-plane-to-xy-plane
// but it is  actually cross(normal, axisZ) to get the rotation axis.
function testAlignVertices(list, world) {
  const polygon = new Polygon(list);
  const polygonNormal = polygon.getNormal();
  console.log('polygonNormal', polygonNormal)
  const axisZ = new THREE.Vector3(0, 0, 1);
  addPlane(axisZ, world);

  const rotationAxis = new THREE.Vector3().crossVectors(polygonNormal, axisZ).normalize();
  const arrow =  new THREE.ArrowHelper(rotationAxis, new THREE.Vector3(), 400, 0xffff00);
  world.add(arrow);

  const theta = Math.acos(axisZ.dot(polygonNormal));
  if (theta === 0) {
    // nothing to do
    return list;
  }

  console.log('theta', theta, theta * 180 / Math.PI);

  const quaternion = new THREE.Quaternion();
  quaternion.setFromAxisAngle(rotationAxis, theta);

  addPlane(polygonNormal.clone().applyQuaternion(quaternion), world);

  // addPlane(polygonNormal, world);
  // should be the z axis)
  console.log(polygonNormal.clone().applyQuaternion(quaternion));

  list = list.map( (vector: THREE.Vector3) => {
    // return vector.clone().applyAxisAngle(rotationAxis, theta)
    return vector.clone().applyQuaternion(quaternion);
  });

  // anomalies:
  // normal equal to z-axi

  // const arrow =  new THREE.ArrowHelper( rotation, new THREE.Vector3(), 100, 0xffff00);
  // world.add(arrow);

  return list;
}

function alignWithXYPlane(vertices) {
  const axisZ = new THREE.Vector3(0, 0, 1);

  const polygon = new Polygon(vertices);
  const polygonNormal = polygon.getNormal();

  const rotationAxis = new THREE.Vector3().crossVectors(polygonNormal, axisZ).normalize();
  const theta = Math.acos(axisZ.dot(polygonNormal));

  if (theta === 0) {
    // nothing to do, already on XY Plane
    return vertices;
  }

  const quaternion = new THREE.Quaternion().setFromAxisAngle(rotationAxis, theta);

  return vertices.map( (vector: THREE.Vector3) => {
    // return vector.clone().applyAxisAngle(rotationAxis, theta)
    return vector.clone().applyQuaternion(quaternion);
  });
}
