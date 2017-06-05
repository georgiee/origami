export class OrigamiGeometryData {
    public vertices: THREE.Vector3[] = [];
    public vertices2d: THREE.Vector3[] = [];
    public polygons: number[][] = [];

    public getVerticesForPolygon(index) {
      return this.polygons[index].map((polygonIndex) => this.vertices[polygonIndex]);
    }
    
    public getVertices2dForPolygon(index) {
      return this.polygons[index].map((vertexIndex) => this.vertices2d[vertexIndex]);
    }
    
    get verticesCount(){
      return this.vertices.length;
    }

    public addVertices(...vertices) {
      this.vertices.push(...vertices);
    }

    // polygon accessors
    public getPolygons() {
        return this.polygons.concat([]);
    }
    
    public getPolygon(index: number) {
        return this.polygons[index];
    }
    
    public setPolygon(index: number, polygon: number[]) {
        this.polygons[index] = polygon;
    }

    public addPolygon(polygon: number[]) {
        this.polygons.push(polygon);
    }

    public removePolygon(index) {
        return this.polygons.splice(index, 1);
    }
    
    public replacePolygon(index, tmp) {
        this.polygons.splice(index, 0, tmp);
    }
    
    // vertex 3d
    public getVertex(index) {
      return this.vertices[index];
    }
    
    public addVertex(v: THREE.Vector3) {
      this.vertices.push(v);
    }
    
    public getVertices() {
      return this.vertices.concat([]);
    }
    
    // vertex 2d
    public getVertex2d(index) {
      return this.vertices2d[index];
    }

    public addVertex2d(v: THREE.Vector3) {
      this.vertices2d.push(v);
    }

    public getVertices2d() {
      return this.vertices2d.concat([]);
    }

}
