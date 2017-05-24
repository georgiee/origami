import * as THREE from 'three';
import * as chroma from 'chroma-js';
import utils from './utils';
import { distanceSquaredToLineSegment } from './math';

import World from './world';

const DEBUG = false;

export class OrigamiCreases extends THREE.Object3D {
  private currentView: THREE.Object3D;
  private polygonMarker: THREE.Object3D;
  private selectedPolygon: number = -1;
  private highlightedVertices;
  private _shape;

  constructor(){
    super()
    this.init();
  }

  set shape(value) {
    this._shape = value;
  }

  get shape() {
    return this._shape;
  }

  init(){
    this.polygonMarker = utils.createSphere();
  }

  selectPolygonWithPoint(point: THREE.Vector2){
    this.selectedPolygon = this.shape.findPolygon2D(point);

    if(this.selectedPolygon >=0){
      this.add(this.polygonMarker);
      this.polygonMarker.position.set(point.x, point.y, 0);
      this.showPolygons([this.selectedPolygon]);

    }else{
      this.remove(this.polygonMarker);
      point = null;
    }

    this.dispatchEvent({type:'polygon-selected', index: this.selectedPolygon, point })
  }


  isStrictlyNonDegenerate(index){
    return true;
  }

  update(){
    let currentView = this.toMesh();
    if(this.currentView){
      this.remove(this.currentView)
    }

    this.currentView = currentView;
    this.add(currentView)
  }

  showPolygons(indices){
    let polygons = this.shape.getPolygons();
    let vertices = indices.reduce((accu, index) => {

      if(polygons.length > index){
          return accu.concat(polygons[index])
      }else{
        return accu;
      }

    }, []);

    if(this.highlightedVertices){
      this.remove(this.highlightedVertices);
    }

    this.highlightedVertices = this.createHighlightedVertices(vertices);
    this.add(this.highlightedVertices);
  }

  toMesh(){
   let group = new THREE.Group();
   group.add(this.createLines());
   return group;
  }

  createLines(){
    let geometry = this.toGeometryPlane();

    let material = new THREE.LineBasicMaterial( {
     vertexColors: THREE.VertexColors,
     color: 0xffffff
    } );

   var line = new THREE.LineSegments( geometry, material );
   return line;
  }

  createHighlightedVertices(highlightedVertices){
    let pointGeometry = new THREE.Geometry();
    let vertices = this.shape.getVertices2d();
    vertices.forEach((vertex, index) => {

      if(highlightedVertices.indexOf(index) != -1){
        pointGeometry.vertices.push(vertex);
        pointGeometry.colors.push(new THREE.Color(0xffffff));
      }

    })

     let points = new THREE.Points(pointGeometry, new THREE.PointsMaterial({
       sizeAttenuation: false,
       size: 10,
       vertexColors: THREE.VertexColors
     }));

     return points;
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
        let index1 = polygonVertices[i];
        let index2 = polygonVertices[(i + 1)%polygonVertices.length];
        geometry.vertices.push(index1, index2);

        geometry.colors.push(currentColor, currentColor);
      }
      //geometry.translate(0,0, 10 * index);

      combinedGeometry.merge(geometry, new THREE.Matrix4());
      counter++
    })
    return combinedGeometry;
  }
}
