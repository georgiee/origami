import * as THREE from 'three';
import * as chroma from 'chroma-js';
import utils from './utils';
import { distanceSquaredToLineSegment } from './math';
import * as math from './math';

import World from './world';
import { OrigamiShape } from './origami-shape';

export class OrigamiCreases extends THREE.Object3D {
  private currentView: THREE.Object3D;
  private polygonMarker: THREE.Object3D;
  private selectedPolygon: number = -1;
  private highlightedVertices;
  private _shape: OrigamiShape;
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
    this.selectedPolygon = this.shape.model.findPolygon2D(point);

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
    let polygonInstances = this.shape.model
      .getPolygonWrapped()
      .filter((polygon) => {
        return (polygon.isNonDegenerate() === false || polygon.size < 3) === false;
      });
    

    let vertices = this.shape.model.data.getVertices();
    let vertices2d = this.shape.model.data.getVertices2d();
    
    let intersectedVector2d = new THREE.Vector3();
    let lines = [];

    polygonInstances.forEach((polygon) => {

        let end = null;
        let start = null;

        const points = polygon.getPoints();
        const points2d = polygon.getPoints2d();

        let size = polygon.size;

        for(let index = 0; index < size; index++) {
          let followingIndex = (index + 1) % size;

          let vertexA = points[index];
          let vertexA2d = points2d[index];
          let vertexB = points[followingIndex];
          let vertexB2d = points2d[followingIndex];

          if( math.pointOnPlane(plane, vertexA) ) {
            end = start;
            start = vertexA2d;
          } else {
            if(math.planeBetweenPoints2(plane, vertexA , vertexB) &&
              math.pointOnPlane(plane, vertexB) === false) {
               
                let line = new THREE.Line3(vertexA, vertexB);
                
                let meet = plane.intersectLine(line);
                let weight1 = meet.clone().sub(vertexB).length();
                let weight2 = meet.clone().sub(vertexA).length();
                
                intersectedVector2d.setX((vertexA2d.x * weight1 + vertexB2d.x * weight2)/(weight1 + weight2));
                intersectedVector2d.setY((vertexA2d.y * weight1 + vertexB2d.y * weight2)/(weight1 + weight2))

                end = start;
                start = intersectedVector2d.clone();
            }

          }
        }
        
        if(start && end) {
          lines.push([start.clone(), end.clone()]);
        }
    });
    
    return lines;
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
    
    let polygons = this.shape.model.getPolygons();
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
    let vertices = this.shape.model.data.getVertices2d();
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
    let palette = chroma.scale(['yellow', 'orangered']).mode('lch');

    let polygonInstances = this.shape.model
      .getPolygonWrapped()
      .filter((polygon) => {
        return (polygon.isNonDegenerate() === false || polygon.size < 3) === false;
      });
    
    polygonInstances.forEach((polygon, index) => {
      let currentColor = new THREE.Color(palette(index/polygonInstances.length).hex());
      let geometry = new THREE.Geometry();
      let vertices2d = polygon.getPoints2d();

      for(let i = 0; i< vertices2d.length; i++){
        let index1 = vertices2d[i];
        let index2 = vertices2d[(i + 1) % vertices2d.length];
        geometry.vertices.push(index1, index2);
        geometry.colors.push(currentColor, currentColor);
      }

      combinedGeometry.merge(geometry, new THREE.Matrix4());
    })
    
    return combinedGeometry;
  }
}
