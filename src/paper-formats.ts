import * as THREE from 'three';
import { OrigamiGeometryData, OrigamiModel } from './model';


let square = new OrigamiGeometryData()
square.addVertex(new THREE.Vector3(0,0,0));
square.addVertex(new THREE.Vector3(400,0,0));
square.addVertex(new THREE.Vector3(400,400,0));
square.addVertex(new THREE.Vector3(0, 400, 0));

square.addVertex2d(new THREE.Vector3(0,0,0));
square.addVertex2d(new THREE.Vector3(400,0,0));
square.addVertex2d(new THREE.Vector3(400,400,0));
square.addVertex2d(new THREE.Vector3(0, 400, 0));

square.addPolygon([0,1,2,3]);

let paper = new OrigamiModel(square);


export { paper as squarePaperModel }