import * as THREE from 'three';
import { OrigamiModel } from './model';
import { OrigamiGeometryData } from './geometry-data';

export function square() {
  const square = new OrigamiGeometryData();

  square.addVertex(new THREE.Vector3(0, 0, 0));
  square.addVertex(new THREE.Vector3(400, 0, 0));
  square.addVertex(new THREE.Vector3(400, 400, 0));
  square.addVertex(new THREE.Vector3(0, 400, 0));

  square.addVertex2d(new THREE.Vector3(0, 0, 0));
  square.addVertex2d(new THREE.Vector3(400, 0, 0));
  square.addVertex2d(new THREE.Vector3(400, 400, 0));
  square.addVertex2d(new THREE.Vector3(0, 400, 0));

  square.addPolygon([0, 1, 2, 3]);

  return new OrigamiModel(square);
}

export function dinA4() {

  const square = new OrigamiGeometryData();

  square.addVertex(new THREE.Vector3(0, 0, 0));
  square.addVertex(new THREE.Vector3(424.3, 0, 0));
  square.addVertex(new THREE.Vector3(424.3, 300, 0));
  square.addVertex(new THREE.Vector3(0, 300, 0));

  square.addVertex2d(new THREE.Vector3(0, 0, 0));
  square.addVertex2d(new THREE.Vector3(424.3, 0, 0));
  square.addVertex2d(new THREE.Vector3(424.3, 300, 0));
  square.addVertex2d(new THREE.Vector3(0, 300, 0));

  square.addPolygon([0, 1, 2, 3]);

  return new OrigamiModel(square);
}
