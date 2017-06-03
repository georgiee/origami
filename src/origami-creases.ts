import * as THREE from 'three';
import * as chroma from 'chroma-js';
import utils from './utils';
import { distanceSquaredToLineSegment } from './math';
import * as math from './math';

import World from './world';

const DEBUG = false;

export class OrigamiCreases extends THREE.Object3D {
  private currentView: THREE.Object3D;
  private polygonMarker: THREE.Object3D;
  private selectedPolygon: number = -1;
  private highlightedVertices;
  private _shape;
  private _edgePreview: THREE.Group = new THREE.Group();
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
  
  preview(plane){
    let lines = this.getLine2d(plane);
    let geometry = this.linesToGeometry(lines);
    
    let material = new THREE.LineBasicMaterial({color: 0xff0000});
    let lineMesh = new THREE.LineSegments( geometry, material );

    if (this._edgePreview.children.length > 0){
      this._edgePreview.remove(this._edgePreview.children[0]);
    }

    this._edgePreview.add(lineMesh);
  }
  
  getLine2d(plane){
    let polygons = this.shape.getPolygons();
    let vertices = this.shape.getVertices();
    let vertices2d = this.shape.getVertices2d();
    
    let intersectedVector2d = new THREE.Vector3();
    let lines = [];

    polygons.forEach((polygon, polygonIndex) => {
      if(this.shape.isNonDegenerate(polygonIndex)) {

        let end = null;
        let start = null;
        polygon.forEach((vertexIndex, index) => {
          
          let currentIndex = polygon[index];
          let followIndex = polygon[(index + 1)%polygon.length];
          
          let vertex = vertices[currentIndex];
          let vertex2 = vertices[followIndex];
          
          if( math.pointOnPlane(plane, vertex) ) {
            
            end = start;
            start = vertices2d[currentIndex];

          } else {
            
            if(math.planeBetweenPoints2(plane,vertex,vertex2) && math.pointOnPlane(plane, vertex2) === false) {
                let line = new THREE.Line3(vertex, vertex2);
                
                let meet = plane.intersectLine(line);
                let weight1 = meet.clone().sub(vertex2).length();
                let weight2 = meet.clone().sub(vertex).length();
                
                let vertex2D_1  = vertices2d[currentIndex];
                let vertex2D_2  = vertices2d[followIndex];

                intersectedVector2d.setX((vertex2D_1.x * weight1 + vertex2D_2.x * weight2)/(weight1 + weight2));
                intersectedVector2d.setY((vertex2D_1.y * weight1 + vertex2D_2.y * weight2)/(weight1 + weight2))

                end = start;
                start = intersectedVector2d.clone();
            }

          }

        })

        if(start && end) {
          lines.push([start.clone(), end.clone()]);
        }

      }
    })

    return lines;
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
   group.add(this._edgePreview);

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
  
  linesToGeometry(lines) {
    let geometry = new THREE.Geometry();

    lines.forEach(line => {
      geometry.vertices.push(line[0], line[1]);
    })
    return geometry;
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
