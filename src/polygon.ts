import * as math from './math';
import * as THREE from 'three';
import * as plainMath from './plain-math';

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

  public isNonDegenerate() {
    const size = this.size;

    if (size > 1) {
        for (let i = 0; i < size; i++) {
            if (this.points[0].distanceTo(this.points[i]) > 0) {
              return true;
            }
        }
    }

    return false;
  }

  public getPreviousCuts(cuts, i, j) {
    const polygonIndices = this.indices;

    const equal = (node, index1, index2) => {
      return (node.v1 === index1 && node.v2 === index2) || (node.v1 === index2 && node.v2 === index1);
    };

    for (const node of cuts){
      if ( equal(node, polygonIndices[i], polygonIndices[j])) {
        return node.result;
      }
    }

    return null;
  }

  public cut(plane, previousCuts = []) {
    const size = this.size;
    const indices = this.indices;

    const ppoint = plane.coplanarPoint();
    const pnormal = plane.normal;

    const newpoly1 = [];
    const newpoly2 = [];
    const newVertices = [];
    const cutpolygonNodes = [];

    for (let i = 0; i < size; i++) {
      const j = (i + 1) % size; // following vertex

      const vertex = this.points[i];
      const vertex2 = this.points[j];

      const distance = plane.distanceToPoint(vertex);

      // console.groupCollapsed('test polygon index: ' + i);

      // if it's on the cutting plane it belongs to both new polygons
      if (Math.abs(distance) < 1) {
        newpoly1.push(indices[i]);
        newpoly2.push(indices[i]);
      } else {
        const sideA = vertex.dot(pnormal);
        const sideB = ppoint.dot(pnormal);

        if (sideA > sideB) {
          newpoly1.push(indices[i]);
        }else {
          newpoly2.push(indices[i]);
        }

        const divided = math.planeBetweenPoints3(plane, vertex, vertex2);
        const pointOnPlane = math.pointOnPlane(plane, vertex2);
        const combinedTest = divided && pointOnPlane === false;

        // console.log('divided?', i, '<---' + combinedTest + ' ---->', j);
        // console.log(vertex, vertex2);

        if (combinedTest) {
          const previousCut = this.getPreviousCuts(previousCuts, i, j);

          if (previousCut !== null) {

            newpoly1.push(previousCut);
            newpoly2.push(previousCut);

          } else {

            const direction = vertex.clone().sub(vertex2);
            const line = new THREE.Line3(vertex, vertex2);

            // console.log('plnae+line', plane, line.clone())
            if (plane.intersectsLine(line)) {
              const meet = plane.intersectLine(line);
              const meet2 = plainMath.linePlaneIntersection(line.start, direction, plane);
              console.log('meet', meet, 'meet2', meet2);

              newVertices.push(meet);

              newpoly1.push({added: newVertices.length - 1 });
              newpoly2.push({added: newVertices.length - 1 });
              cutpolygonNodes.push({v1: indices[i], v2: indices[j], result: {added: newVertices.length - 1 }});
            }

          }
        }
      }

      // console.groupEnd();
    }

    return {
      newpoly1,
      newpoly2,
      newVertices,
      cutpolygonNodes
    };
  }

  public canCut(plane) {
    if (this.isNonDegenerate() === false) {
      return false;
    }

    let inner = false;
    let outer = false;
    const normal = plane.normal;
    const coplanarPoint = plane.coplanarPoint();

    for (let i = 0; i < this.size; i++) {
      const point = this.points[i];
      const normalLength = Math.sqrt(Math.max(1, normal.lengthSq()));

      // TODO: Same as distanceToPlane?
      if (point.dot(normal) / normalLength > coplanarPoint.dot(normal) / normalLength + 0.00000001) {
        inner = true;
      }else if (point.dot(normal) / normalLength < coplanarPoint.dot(normal) / normalLength - 0.00000001) {
        outer = true;
      }

      if (inner && outer) {
          return true;
      }

    }

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
