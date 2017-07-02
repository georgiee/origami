import { OrigamiShape } from './../origami/shape';
import { OrigamiMesh } from './../origami/mesh';
import * as THREE from 'three';
import { Polygon } from '../origami/core/polygon';
import * as chroma from 'chroma-js';

const colorMap = chroma.scale(['yellow', 'red', 'black']);
const colorMap2 = chroma.scale([ 0x3689BB, 0xFD527C, 0xBFF250, 0xE6F285, 0x6FA52B ]);

// https://color.adobe.com/Origami-Swan-color-theme-645981/
const colorMap3 = chroma.scale([ 0xBF2178, 0x46328C, 0xB2C1D8, 0x2957A2, 0x764BA4 ]);

export class AnimatedOrigami extends THREE.Object3D {
  constructor(
    private shape: OrigamiShape
  ) {
    super();
    this.init();
  }
  private init() {
    this.addSolidMesh();
    this.addLines()
  }

  private addLines() {
    const origamiMesh = new OrigamiMesh(this.shape);
    const geometry = origamiMesh.getLineGeometry();
    const lines = new THREE.LineSegments(geometry, new THREE.LineBasicMaterial());
    this.add(lines);
  }

  private addSolidMesh() {
    const combinedGeometry = new THREE.Geometry();

    const polygonInstances = this.shape.model
      .getPolygonWrapped()
      .filter((polygon) => {
        return polygon.isStrictlyNonDegenerate();
      });

    polygonInstances.forEach((polygon: Polygon, index) => {
      const geometry = new THREE.Geometry();
      const vertices = polygon.getPoints();
      const triangles = polygon.triangulate();
      const ratio = index / polygonInstances.length;

      const faces = triangles.map((triangle) => {
        const face = new THREE.Face3(triangle[0], triangle[1], triangle[2]);
        face.color = new THREE.Color(colorMap(ratio).hex());
        return face;
      });

      geometry.vertices.push(...vertices);
      geometry.faces.push(...faces);
      geometry.computeFaceNormals();

      combinedGeometry.merge(geometry, new THREE.Matrix4());

    });

    const material = new THREE.MeshPhongMaterial( {
      color: 0xffffff,
      specular: 0xffffff,
      shininess: 20,
      vertexColors: THREE.FaceColors,
      shading: THREE.FlatShading
      // polygonOffset: true,
      // As soon as I know how to identify front & back this can be
      // assigned to one of the sides to prevent z-fighting
      // polygonOffsetFactor: -1
    } );

    const mesh = new THREE.Mesh(combinedGeometry, material);
    const normals = new THREE.FaceNormalsHelper( mesh, 50, 0x00ff00, 1 );

    this.add(mesh);
    this.add(normals);
  }
}