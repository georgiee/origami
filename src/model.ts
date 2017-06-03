import * as THREE from 'three';

export class OrigamiModel {
    vertices: Array<THREE.Vector3> = [];
    vertices2d: Array<THREE.Vector3> = [];
    polygons: Array<Array<number>> = [];
    
    get verticesSize(){
      return this.vertices.length;
    }

    reset(){
      this.polygons = [];
      this.vertices = [];
      this.vertices2d = [];
    }
    
    getVertex(index){
      return this.vertices[index];
    }
    
    getVertex2d(index){
      return this.vertices2d[index];
    }
    
    addVertex(v: THREE.Vector3){
      this.vertices.push(v);
    }
    
    addVertex2d(v: THREE.Vector3){
      this.vertices2d.push(v);
    }

    getVertices() {
      return this.vertices;
    }
    
    getVertices2d() {
      return this.vertices2d;
    }

    // polygons
    getPolygons() {
        return this.polygons;
    }
    
    getPolygon(index: number) {
        return this.polygons[index];
    }
    
    setPolygon(index: number, polygon: Array<number>) {
        this.polygons[index] = polygon;
    }

    addPolygon(polygon: Array<number>) {
        this.polygons.push(polygon);
    }

    removePolygon(index) {
        return this.polygons.splice(index, 1);
    }

    replacePolygon(index, tmp) {
        this.polygons.splice(index, 0, tmp);
    }
    replaceAllPolygons(polygons) {
        this.polygons = polygons;
    }
}