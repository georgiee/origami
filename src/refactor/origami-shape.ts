import * as THREE from 'three';

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

  getAlignmentPoints(){

    let points = [];

    //all vertices are corners, add them
    let vertices = this.polygons.reduce((accu, polygon) => {
      let vertices = polygon.map(index => this.vertices[index]);
      accu = accu.concat(vertices);
      return accu;
    }, []);

    points.push(...vertices);

    let v = new THREE.Vector3();

    //all midpoints
    this.polygons.forEach( polygon => {
      let vertices = polygon.map(index => this.vertices[index]);
      let length = polygon.length;

      for(let i = 0; i < length; i++){
        let v1 = vertices[i];
        let v2 = vertices[(i + 1)%length];
         //midpoint
        points.push(v.clone().lerpVectors(v1, v2, 1/4));
        points.push(v.clone().lerpVectors(v1, v2, 1/3));
        points.push(v.clone().lerpVectors(v1, v2, 1/2));
        points.push(v.clone().lerpVectors(v1, v2, 2/3));
        points.push(v.clone().lerpVectors(v1, v2, 3/4));
      }
    })

    return points;
  }
}
