export default class OrigamiShape {
  private polygons = [];
  private vertices = [];
  private vertices2d = [];

  constructor(){
    //OrigamiRenderer
  }

  getVertices(){
    return this.vertices;
  }
  
  getPolygons(){
    return this.polygons;
  }

  addVertex(v: THREE.Vector3){
    this.vertices.push(v);
  }

  addVertex2D(v: THREE.Vector3){
    this.vertices2d.push(v);
  }

  addPolygon(polygon){
    this.polygons.push(polygon);
  }
}
