import * as THREE from 'three';
import * as chroma from 'chroma-js';

import { Origami } from 'origami/origami';
import { OrigamiShape } from 'origami/shape';
import { OrigamiMesh } from 'origami/mesh';
import { Polygon } from 'origami/core/polygon';

export class SimpleOrigamiGeometry extends THREE.Geometry {
  private shape: OrigamiShape;

  constructor(
    private origami: Origami
  ) {
    super();
    this.init();
  }

  private init() {
    this.shape = this.origami.getShape();

    const polygonInstances = this.shape.model
      .getPolygonWrapped()
      .filter((polygon) => {
        return polygon.isStrictlyNonDegenerate();
      });

    polygonInstances.forEach((polygon: Polygon, index) => {
      const geometry = new THREE.Geometry();
      const vertices = polygon.getPoints();
      const triangles = polygon.triangulate();

      const faces = triangles.map((triangle) => {
        const face = new THREE.Face3(triangle[0], triangle[1], triangle[2]);
        return face;
      });

      geometry.vertices.push(...vertices);
      geometry.faces.push(...faces);
      geometry.computeFaceNormals();

      this.merge(geometry, new THREE.Matrix4());

    });

    this.center();

  }
}
