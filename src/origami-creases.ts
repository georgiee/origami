import * as THREE from 'three';
import * as chroma from 'chroma-js';

export class OrigamiCreases extends THREE.Object3D {
  private currentView: THREE.Object3D;
  constructor(private shape){
    super()
  }

  update(){
    let currentView = this.toMesh();
    if(this.currentView){
      this.remove(this.currentView)
    }

    this.currentView = currentView;
    this.add(currentView)
  }

  toMesh(){
    let geometry = this.toGeometryPlane();

    let material = new THREE.LineBasicMaterial( {
     vertexColors: THREE.VertexColors,
     color: 0xffffff
    } );

   var line = new THREE.LineSegments( geometry, material );

   return line;
  }

  toGeometryPlane(){
    let combinedGeometry = new THREE.Geometry();
    let counter = 1;

    let palette = chroma.scale(['yellow', 'orangered']).mode('lch');

    let polygons = this.shape.getPolygons();
    let vertices2d = this.shape.getVertices2d();

    polygons.forEach((polygon, index) => {
      let currentColor = new THREE.Color(palette(index/polygons.length).hex());

      if(this.shape.isNonDegenerate(index) === false || polygon.length < 3){
        return;
      }

      let geometry = new THREE.Geometry();

      let polygonVertices = polygon.map(index => {
        return vertices2d[index].clone()
      });


      for(let i = 0; i< polygonVertices.length;i++){
        geometry.vertices.push(polygonVertices[i], polygonVertices[(i + 1)%polygonVertices.length]);
        geometry.colors.push(currentColor, currentColor);
      }
      //geometry.translate(0,0, 10 * index);

      combinedGeometry.merge(geometry, new THREE.Matrix4());
      counter++
    })
    return combinedGeometry;
  }
}
