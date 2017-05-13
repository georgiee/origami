import * as THREE from 'three';

export class Polygon {
  private indices: Array<number>;
  private points: Array<THREE.Vector3>;

  constructor(indices, points){
    this.indices = indices;
    this.points = points;
  }

  getPoints() {
    return this.points;
  }
}

export class PolygonList {
  private points: Array<THREE.Vector3> = [];
  private polygons: Array<Array<number>> = [];

  addPoint(point: THREE.Vector3) {
    this.points.push(point);
  }

  add(indices){
    this.polygons.push(indices);
  }

  getPoint(index){
    return this.points[index];
  }

  get(index){
    let indices = this.polygons[index];
    let points = indices.map(index => this.points[index]);
    let polygon = new Polygon(indices, points);

    return polygon;
  }
}
