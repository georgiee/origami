import { polygonContains } from './math';
import { Polygon } from './polygon';
import * as THREE from 'three';
import * as _ from 'lodash';
import { OrigamiGeometryData } from './origami-geometry-data';
import { CutResult } from './cut-result';

// const SNAP_INTERVALS = [1/2,1/3,1/4,2/3,3/4];
const SNAP_INTERVALS = [1 / 2];

export class OrigamiModel {
    public data: OrigamiGeometryData;

    constructor(data = null) {
      this.data = data || new OrigamiGeometryData();
    }

    public diagnostics() {
        console.log('Vertices Count', this.data.vertices.length);
        console.log('Polygon Count', this.data.polygons.length);

        console.group('Vertices 2D:');
        this.data.vertices2d.map((vertex: THREE.Vector3, index) => {
          console.log(index + ':', vertex.x, vertex.y, vertex.z);
        });
        console.groupEnd();

        console.group('Vertices:');
        this.data.vertices.map((vertex: THREE.Vector3, index) => {
          console.log(index + ':', vertex.x, vertex.y, vertex.z);
        });
        console.groupEnd();

        console.group('Polygons:');
        this.data.polygons.map((polygon: number[]) => {
          console.log(polygon);
        });
        console.groupEnd();
    }

    public processCutResult(index, result) {
      const countBefore = this.data.verticesCount;

      result = new CutResult(result);
      result.updateReferences(countBefore);

      // 1. add all new vertices and update references
      // to point to the correct global vertex index
      this.data.addVertices(...result.newVertices);

      result.cutpolygonNodes.forEach((node) => {
        this.amendVertices2d(node.v1, node.v2, node.result);
      });

      this.data.setPolygon(index, result.newpoly1);
      this.data.addPolygon(result.newpoly2);

      return result.cutpolygonNodes;
    }

    public reset(polygons = [], vertices = [], vertices2d = []) {
      this.data.polygons = polygons;
      this.data.vertices = vertices;
      this.data.vertices2d = vertices2d;
    }

    public replaceAllPolygons(polygons) {
        this.data.polygons = polygons;
    }

    public clone() {
      const polygons = this.data.polygons.concat([]);
      const vertices = this.data.vertices.map((v) => v.clone());
      const vertices2d = this.data.vertices2d.map((v) => v.clone());

      const model = new OrigamiModel();
      model.reset(polygons, vertices, vertices2d);

      return model;
    }

    public mergeUnaffectedPolygons(selection, cutpolygonPairs, lastCutPolygons) {
      let counter = 0;

      cutpolygonPairs.forEach((pair, index) => {
        // if not part of the selection make this polygon like the
        // one before, the other part will be removed in the next loop.
        if (!(selection.indexOf(pair[0]) !== -1 || selection.indexOf(pair[1]) !== -1)) {
          this.data.setPolygon(pair[0], lastCutPolygons[index]);
        }
      });

      cutpolygonPairs.forEach((pair, index) => {
        if (!(selection.indexOf(pair[0]) !== -1 || selection.indexOf(pair[1]) !== -1)) {
          this.data.setPolygon(pair[1], []);
          counter++;
        }
      });
      console.info('merge previous', cutpolygonPairs.length, 'cleared: ', counter, this.data.getPolygons().length);
    }

  public shrink() {
    const countBefore = this.data.getPolygons().length;
    this.replaceAllPolygons(this.data.getPolygons().filter((polygon) => polygon.length > 0));
    console.log('shrink', countBefore, '->', this.data.getPolygons().length);
  }

  public shrinkWithIndex(index) {
    const countBefore = this.data.getPolygons().length;

    const tmp = this.data.getPolygon(index);
    this.data.removePolygon(index);
    const length = this.data.getPolygons().length;
    for (let i = 0; i < this.data.getPolygons().length; i++) {
      if (this.data.getPolygon(i).length < 1) {
        this.data.removePolygon(i);
        i--;
      }
    }
    while (index > this.data.getPolygons().length) {
      this.data.addPolygon([]);
     }

    this.data.replacePolygon(index, tmp);

    console.log('shrinkWithIndex', countBefore, '->', this.data.getPolygons().length);
  }

    public getPolygonVertices(index) {
      return this.data.getVerticesForPolygon(index);
    }

    public getPolygonVertices2d(index) {
      return this.data.getVertices2dForPolygon(index);
    }

    public findPolygon2D(point) {
      const polygons = this.data.getPolygons();
      const vertices2d = this.data.getVertices2d();

      const polys = polygons
        .map((list) => list.map((index) => [vertices2d[index].x, vertices2d[index].y]));

      for (let i = 0; i < polys.length; i++) {
        const contains = polygonContains([point.x, point.y], polys[i]);
        if (contains) {
          return i;
        }
      }
      return -1;
    }

    public getPointOnOrigami(point) {
      const polygonIndex = this.findPolygon2D(point);

      if (polygonIndex < 0) {
        return null;
      }

      const polygons = this.data.getPolygons();
      const vertices = this.data.getVertices();
      const vertices2d = this.data.getVertices2d();

      const vertexIndices = polygons[polygonIndex];

      const orig = vertices[vertexIndices[0]];
      const orig2d = vertices2d[vertexIndices[0]];

      for (let i = 0; i < vertexIndices.length; i++) {
        for (let j = 0; j < vertexIndices.length; j++) {
          const point1Index = vertexIndices[i];
          const point1 = vertices[vertexIndices[i]];
          const point12d = vertices2d[vertexIndices[i]];

          const point2Index = vertexIndices[j];
          const point2 = vertices[vertexIndices[j]];
          const point22d = vertices2d[vertexIndices[j]];

          const base1 = point1.clone().sub(orig);
          const base2 = point2.clone().sub(orig);

          if (base1.clone().cross(base2).lengthSq() > 0) {
              base1.normalize();
              base2.normalize();

              const base12d = point12d.clone().sub(orig2d).normalize();
              const base22d = point22d.clone().sub(orig2d).normalize();

              const det = base12d.x * base22d.y - base12d.y * base22d.x;
              const coord1 = point.clone().sub(orig2d).dot(new THREE.Vector3(base22d.y / det, -base22d.x / det, 0));
              const coord2 = point.clone().sub(orig2d).dot(new THREE.Vector3(-base12d.y / det, base12d.x / det, 0));
              const result = orig.clone();
              result.add(base1.setLength(coord1).add(base2.setLength(coord2)));
              return result;
          }
        }
      }
    }

    public getAlignmentPoints() {

      const points = [];

      // all vertices are corners, add them
      const vertices = this.data.getPolygons().reduce((accu, polygon) => {
        const list: any = polygon.map((index) => this.data.getVertex(index));
        accu = accu.concat(list);
        return accu;
      }, []);

      points.push(...vertices);

      const v = new THREE.Vector3();

      // all midpoints
      this.data.getPolygons().forEach( (polygon) => {
        const verticesList = polygon.map((index) => this.data.getVertex(index));
        const length = polygon.length;

        for (let i = 0; i < length; i++) {
          const v1 = verticesList[i];
          const v2 = verticesList[(i + 1) % length];
          // midpoint
          SNAP_INTERVALS.forEach((ratio) => {
            points.push(v.clone().lerpVectors(v1, v2, ratio));
          });
        }
      });

      return points;
    }

    public isNonDegenerate(polygonIndex) {
      const polygon = new Polygon(this.data.getVerticesForPolygon(polygonIndex));
      return polygon.isNonDegenerate();
    }

    public getPolygons() {
      const polygons = this.data.getPolygons();
      return polygons;
    }

    // Return all raw polygons wrapped in a Polygon class to access polygon scoped methods
    public getPolygonWrapped(): Polygon[] {
      const polygons = this.getPolygons();

      return polygons.map((indices, polygonIndex) => {
        const polygon = new Polygon();
        polygon.points = this.data.getVerticesForPolygon(polygonIndex);
        polygon.points2d = this.data.getVertices2dForPolygon(polygonIndex);
        polygon.indices = indices;

        return polygon;
      });
    }

    private amendVertices2d(v1Index, v2Index, meetIndex) {
      const meet = this.data.getVertex(meetIndex);

      const v1 = this.data.getVertex(v1Index);
      const v2 = this.data.getVertex(v2Index);
      const weight1 = meet.clone().sub(v2).length();
      const weight2 = meet.clone().sub(v1).length();

      const vertex2D1  = this.data.getVertex2d(v1Index);
      const vertex2D2  = this.data.getVertex2d(v2Index);

      const vector2d = new THREE.Vector3(
        (vertex2D1.x * weight1 + vertex2D2.x * weight2) / (weight1 + weight2),
        (vertex2D1.y * weight1 + vertex2D2.y * weight2) / (weight1 + weight2),
        0
      );

      this.data.addVertex2d(vector2d);
    }
}
