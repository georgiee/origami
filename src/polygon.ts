import * as math from './math';
import * as THREE from 'three';

export class Polygon {
  points;
  points2d;
  indices;
  
  constructor(points = [], indices = []) {
      this.points = points.concat([]);
      this.indices = indices.concat([]);
  }
  
  getPoints() {
    return this.points;
  }
  
  getPoints2d() {
    return this.points2d;
  }

  isNonDegenerate(){
    const size = this.size;
    
    if(size > 1){
        for(let i = 0; i < size; i++){
            if(this.points[0].distanceTo(this.points[i]) > 0){
              return true;
            }
        }
    }

    return false;
  }
  
  getPreviousCuts(cuts,i, j){
    let polygonIndices = this.indices;

    const equal = (node, index1, index2) => {
      return (node.v1 == index1 && node.v2 == index2) || (node.v1 == index2 && node.v2 == index1)
    }

    for(let node of cuts){
      if( equal(node, polygonIndices[i], polygonIndices[j])){
        return node.result;
      }
    }
    
    return null;
  }
  
  cut(plane, previousCuts = []){
    const size = this.size;
    let indices = this.indices

    let ppoint = plane.coplanarPoint();
    let pnormal = plane.normal;

    let newpoly1 = [];
    let newpoly2 = [];
    let newVertices = [];
    let cutpolygonNodes = [];

    for (let i = 0; i < size; i++) {
      let j = (i + 1) % size; //following vertex

      let vertex = this.points[i];
      let vertex2 = this.points[j];

      let distance = plane.distanceToPoint(vertex);

      //if it's on the cutting plane it belongs to both new polygons
      if(Math.abs(distance) < 0.001){
        newpoly1.push(indices[i]);
        newpoly2.push(indices[i]);
      } else {
        let sideA = vertex.dot(pnormal);
        let sideB = ppoint.dot(pnormal);

        if(sideA > sideB){
          newpoly1.push(indices[i]);
        }else{
          newpoly2.push(indices[i]);
        }

        let divided = math.planeBetweenPoints2(plane,vertex,vertex2);

        if(divided){
          let previousCut = this.getPreviousCuts(previousCuts, i, j);

          if(previousCut !== null){

            newpoly1.push(previousCut);
            newpoly2.push(previousCut);

          } else {

            let direction = vertex.clone().sub(vertex2);
            let line = new THREE.Line3(vertex, vertex2);

            if(plane.intersectsLine(line)){
              let meet = plane.intersectLine(line);
              newVertices.push(meet);

              newpoly1.push({added: newVertices.length - 1 });
              newpoly2.push({added: newVertices.length - 1 });
              cutpolygonNodes.push({v1: indices[i], v2: indices[j], result: {added: newVertices.length - 1 }});
            }

          }
        }
      }
    }

    return {
      newpoly1,
      newpoly2,
      newVertices,
      cutpolygonNodes
    }

  }
  
  canCut(plane) {
    if(this.isNonDegenerate() === false) {
      return false;
    }
    
    let inner = false;
    let outer = false;
    let normal = plane.normal;
    let coplanarPoint = plane.coplanarPoint();

    for(let i = 0; i < this.size; i++){
      let point = this.points[i];
      let normalLength = Math.sqrt(Math.max(1, normal.lengthSq()));
      //TODO: Same as distanceToPlane?
      if(point.dot(normal)/normalLength > coplanarPoint.dot(normal)/normalLength + 0.00000001){
        inner = true;
      }else if(point.dot(normal)/normalLength < coplanarPoint.dot(normal)/normalLength - 0.00000001){
        outer = true;
      }

      if (inner && outer) {
          return true;
      }

    };

    return false;
  }

  get size() {
      return this.points.length;
  }
}