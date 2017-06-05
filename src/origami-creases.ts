import * as THREE from 'three';
import * as chroma from 'chroma-js';
import utils from './utils';
import { distanceSquaredToLineSegment } from './math';
import * as math from './math';

import World from './world';
import { OrigamiShape } from './origami-shape';

export class OrigamiCreases extends THREE.Object3D {
  public shape: OrigamiShape;
  private currentView: THREE.Object3D;
  private polygonMarker: THREE.Object3D;
  private selectedPolygon: number = -1;
  private highlightedVertices;
  private edgePreview: THREE.Group = new THREE.Group();

  constructor() {
    super();
    this.init();
  }

  public preview(plane) {
    const lines = this.getLine2d(plane);
    const geometry = this.linesToGeometry(lines);

    const material = new THREE.LineBasicMaterial({color: 0xff0000});
    const lineMesh = new THREE.LineSegments( geometry, material );

    if (this.edgePreview.children.length > 0) {
      this.edgePreview.remove(this.edgePreview.children[0]);
    }

    this.edgePreview.add(lineMesh);
  }

  public selectPolygonWithPoint(point: THREE.Vector2) {
    this.selectedPolygon = this.shape.model.findPolygon2D(point);
    console.info('selectedPolygon', this.selectedPolygon);

    if (this.selectedPolygon >= 0) {
      this.add(this.polygonMarker);
      this.polygonMarker.position.set(point.x, point.y, 0);
      this.showPolygons([this.selectedPolygon]);

    } else {
      this.remove(this.polygonMarker);
      point = null;
    }
    
    this.dispatchEvent({type: 'polygon-selected', index: this.selectedPolygon, point });
  }

  public update() {
    const currentView = this.toMesh();
    if (this.currentView) {
      this.remove(this.currentView);
    }

    this.currentView = currentView;
    this.add(currentView);
  }

  public showPolygons(indices) {

    const polygons = this.shape.model.getPolygons();
    const vertices = indices.reduce((accu, index) => {

      if (polygons.length > index) {
          return accu.concat(polygons[index]);
      }else {
        return accu;
      }

    }, []);

    if (this.highlightedVertices) {
      this.remove(this.highlightedVertices);
    }

    this.highlightedVertices = this.createHighlightedVertices(vertices);
    this.add(this.highlightedVertices);
  }
  
  private init() {
    this.polygonMarker = utils.createSphere();
  }
  private getLine2d(plane) {
    const polygonInstances = this.shape.model
      .getPolygonWrapped()
      .filter((polygon) => {
        return (polygon.isNonDegenerate() === false || polygon.size < 3) === false;
      });

    const vertices = this.shape.model.data.getVertices();
    const vertices2d = this.shape.model.data.getVertices2d();

    const intersectedVector2d = new THREE.Vector3();
    const lines = [];

    polygonInstances.forEach((polygon) => {

        let end = null;
        let start = null;

        const points = polygon.getPoints();
        const points2d = polygon.getPoints2d();

        const size = polygon.size;

        for (let index = 0; index < size; index++) {
          const followingIndex = (index + 1) % size;

          const vertexA = points[index];
          const vertexA2d = points2d[index];
          const vertexB = points[followingIndex];
          const vertexB2d = points2d[followingIndex];

          if ( math.pointOnPlane(plane, vertexA) ) {
            end = start;
            start = vertexA2d;
          } else {
            if (math.planeBetweenPoints2(plane, vertexA , vertexB) &&
              math.pointOnPlane(plane, vertexB) === false) {

                const line = new THREE.Line3(vertexA, vertexB);

                const meet = plane.intersectLine(line);
                const weight1 = meet.clone().sub(vertexB).length();
                const weight2 = meet.clone().sub(vertexA).length();

                intersectedVector2d.setX((vertexA2d.x * weight1 + vertexB2d.x * weight2) / (weight1 + weight2));
                intersectedVector2d.setY((vertexA2d.y * weight1 + vertexB2d.y * weight2) / (weight1 + weight2));

                end = start;
                start = intersectedVector2d.clone();
            }

          }
        }

        if (start && end) {
          lines.push([start.clone(), end.clone()]);
        }
    });

    return lines;
  }
  private toMesh() {
   const group = new THREE.Group();
   group.add(this.createLines());
   group.add(this.edgePreview);

   return group;
  }

  private createLines() {
    const geometry = this.toGeometryPlane();

    const material = new THREE.LineBasicMaterial( {
     vertexColors: THREE.VertexColors,
     color: 0xffffff
    } );

    const line = new THREE.LineSegments( geometry, material );
    return line;
  }

  private createHighlightedVertices(highlightedVertices) {
    const pointGeometry = new THREE.Geometry();
    const vertices = this.shape.model.data.getVertices2d();
    vertices.forEach((vertex, index) => {

      if (highlightedVertices.indexOf(index) !== -1) {
        pointGeometry.vertices.push(vertex);
        pointGeometry.colors.push(new THREE.Color(0xffffff));
      }

    });

    const points = new THREE.Points(pointGeometry, new THREE.PointsMaterial({
       sizeAttenuation: false,
       size: 10,
       vertexColors: THREE.VertexColors
     }));

    return points;
  }

  private linesToGeometry(lines) {
    const geometry = new THREE.Geometry();

    lines.forEach((line) => {
      geometry.vertices.push(line[0], line[1]);
    });
    return geometry;
  }

  private toGeometryPlane() {
    const combinedGeometry = new THREE.Geometry();
    const palette = chroma.scale(['yellow', 'orangered']).mode('lch');

    const polygonInstances = this.shape.model
      .getPolygonWrapped()
      .filter((polygon) => {
        return (polygon.isNonDegenerate() === false || polygon.size < 3) === false;
      });

    polygonInstances.forEach((polygon, index) => {
      const currentColor = new THREE.Color(palette(index / polygonInstances.length).hex());
      const geometry = new THREE.Geometry();
      const vertices2d = polygon.getPoints2d();

      for (let i = 0; i < vertices2d.length; i++) {
        const index1 = vertices2d[i];
        const index2 = vertices2d[(i + 1) % vertices2d.length];
        geometry.vertices.push(index1, index2);
        geometry.colors.push(currentColor, currentColor);
      }

      combinedGeometry.merge(geometry, new THREE.Matrix4());
    });

    return combinedGeometry;
  }
}
