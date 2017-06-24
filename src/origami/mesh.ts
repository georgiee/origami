import * as THREE from 'three';
import { OrigamiShape } from './shape';
import * as chroma from 'chroma-js';
import { Polygon } from './core/polygon';

export class OrigamiMesh extends THREE.Object3D {
  private materials;
  private group;
  private currentGeometry;

  constructor(private shape: OrigamiShape) {
    super();
    this.init();
  }

  public update() {
    this.group.remove(...this.group.children);

    // creates a combined mesh of front, back and wireframe display
    const geometry = this.toGeometry();
    // const mesh = THREE.SceneUtils.createMultiMaterialObject(geometry, this.materials);
    const mesh = new THREE.Mesh(geometry, new THREE.MeshNormalMaterial({
      side: THREE.DoubleSide
    }));

    const pointGeometry = new THREE.Geometry();
    const lines = new THREE.LineSegments(this.toLineGeometry(), new THREE.LineBasicMaterial());

    this.group.add(mesh);
    this.group.add(lines);

    this.currentGeometry = geometry;
  }

  public getWorldCenter() {
    const geometry = this.currentGeometry;

    const middle = new THREE.Vector3();
    geometry.computeBoundingBox();
    middle.x = (geometry.boundingBox.max.x + geometry.boundingBox.min.x) / 2;
    middle.y = (geometry.boundingBox.max.y + geometry.boundingBox.min.y) / 2;
    middle.z = (geometry.boundingBox.max.z + geometry.boundingBox.min.z) / 2;

    return middle;
  }

  private init() {
    this.group = new THREE.Group();
    this.add(this.group);

    this.materials = [
        new THREE.MeshBasicMaterial({
        color: chroma('aquamarine').luminance(0.5).hex(),
        side: THREE.FrontSide,
        transparent: true,
        opacity: 0.8
      }),
      new THREE.MeshBasicMaterial({
        color: chroma('hotpink').luminance(0.5).hex(),
        side: THREE.BackSide,
        transparent: true,
        opacity: 0.8
      })
    ];
  }

  private toLineGeometry() {
    const combinedGeometry = new THREE.Geometry();
    let counter = 1;

    const polygonInstances = this.shape.model
      .getPolygonWrapped()
      .filter((polygon) => {
        return (polygon.isNonDegenerate() === false || polygon.size < 3) === false;
      });

    polygonInstances.forEach((polygon: Polygon) => {
      const geometry = new THREE.Geometry();
      const vertices = polygon.getPoints();

      for (let i = 0; i < vertices.length; i++) {
        geometry.vertices.push(vertices[i], vertices[(i + 1) % vertices.length]);
      }

      combinedGeometry.merge(geometry, new THREE.Matrix4());
      counter++;
    });

    return combinedGeometry;
  }

  private toGeometry() {
    const combinedGeometry = new THREE.Geometry();

    const polygonInstances = this.shape.model
      .getPolygonWrapped()
      .filter((polygon) => {
        return (polygon.isNonDegenerate() === false || polygon.size < 3) === false;
      });

    polygonInstances.forEach((polygon: Polygon) => {

      if (polygon.isStrictlyNonDegenerate() === false) {
        return; // next
      }

      const geometry = new THREE.Geometry();
      const vertices = polygon.getPoints();
      const triangles = polygon.triangulate();

      const faces = triangles.map((triangle) => new THREE.Face3(triangle[0], triangle[1], triangle[2]));

      geometry.vertices.push(...vertices);
      geometry.faces.push(...faces);
      geometry.computeFaceNormals();

      combinedGeometry.merge(geometry, new THREE.Matrix4());
    });

    return combinedGeometry;
  }

}
