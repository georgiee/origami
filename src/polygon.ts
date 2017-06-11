import * as math from './math';
import * as THREE from 'three';

function* range(begin, end, interval = 1) {
    for (let i = begin; i < end; i += interval) {
        yield i;
    }
}

export class Polygon {
  public points;
  public points2d;
  public indices;

  constructor(points = [], indices = null) {
    if (indices === null) {
      indices = Array.from(range(0, points.length, 1));
    }

    this.points = points.concat([]);
    this.indices = indices.concat([]);
  }

  // https://www.khronos.org/opengl/wiki/Calculating_a_Surface_Normal
  public getNormal() {
    const normal = new THREE.Vector3();
    const length = this.points.length;

    for (let i = 0; i < length; i++ ) {
      const current = this.points[i];
      const next = this.points[( i + 1) % length];

      normal.x = normal.x + (current.y - next.y) * (current.z + next.z);
      normal.y = normal.y + (current.z - next.z) * (current.x + next.x);
      normal.z = normal.z + (current.x - next.x) * (current.y + next.y);
    }

    return normal.normalize();
  }

  public getPoints() {
    return this.points;
  }

  public getPoints2d() {
    return this.points2d;
  }

  public isStrictlyNonDegenerate(): boolean {
    if (this.size < 3) {
      return false;
    }

    // nope, this is for contour only, ignores z and gets wrong area for us
    // const area = THREE.ShapeUtils.area(this.points);

    const points = this.points;
    const l = this.size;
    const basePoint = this.points[0];

    for (let i = 0; i < l; i++) {
      const pointA = points[i];
      for (let j = 0; j < l; j++) {
        const pointB = points[j];
        // Maybe check this out?
        // https://stackoverflow.com/questions/12642256/python-find-area-of-polygon-from-xyz-coordinates
        // and http://thebuildingcoder.typepad.com/blog/2008/12/3d-polygon-areas.html
        // The area of a 3d polygon is half of the dot product of the unit vector
        // and the total of all the cross products,

        // This is from the original source
        const directionA = pointA.clone().sub(basePoint);
        const directionB = pointB.clone().sub(basePoint);
        const area = new THREE.Vector3().crossVectors(directionA, directionB).length();
        // console.log('lengthCross ---> ', lengthCross, this.indices[i], this.indices[j]);
        if (area > 0) { // not perpendicular.
          return true;
        }
      }
    }

    return false;
  }

  public isNonDegenerate(){
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

  public getPreviousCuts(cuts,i, j){
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

  public cut(plane, previousCuts = []){
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

  public canCut(plane) {
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

  public get size() {
      return this.points.length;
  }

  public triangulate(classicMode = false) {
    if (classicMode ) {
      return THREE.ShapeUtils.triangulate(this.points, true);
    }

    // 1. create a XY plane aligned version of this poylgon
    const alignedVertices = this.alignWithXYPlane(this.points);
    // 2. then triangulate. We only need the indices. So we don't
    // event need to rotate anything back.
    const indices = THREE.ShapeUtils.triangulate(alignedVertices, true);

    return indices;
  }

  // Rotate any polygon on the XY Plane so we can do a proper triangulation later on
  // https://gamedev.stackexchange.com/questions/48095/rotating-3d-plane-to-xy-plane
  // but it is  actually cross(normal, axisZ) to get the rotation axis.
  private alignWithXYPlane(vertices) {
    const axisZ = new THREE.Vector3(0, 0, 1);

    const polygon = new Polygon(vertices);
    const polygonNormal = polygon.getNormal();

    const rotationAxis = new THREE.Vector3().crossVectors(polygonNormal, axisZ).normalize();
    const theta = Math.acos(axisZ.dot(polygonNormal));
    const quaternion = new THREE.Quaternion().setFromAxisAngle(rotationAxis, theta);

    return vertices.map( (vector: THREE.Vector3) => {
      // return vector.clone().applyAxisAngle(rotationAxis, theta)
      return vector.clone().applyQuaternion(quaternion);
    });
  }
}