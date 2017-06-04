import * as THREE from 'three';
import math from './math';
import { polygonContains } from './math';
import * as _ from 'lodash';
import utils from './utils';
import World from './world';
import { OrigamiModel } from './model'

import { Polygon } from './polygon-math/polygon';


const LEGACY = true;

const VERTEX_POSITION = {
  COPLANAR: 0,
  FRONT: 1,
  BACK: 2
}


export default class OrigamiShape {
  private highlightedVertices = [];
  private cutpolygonNodes = [];
  private cutpolygonNodes2 = [];
  private _cutpolygonPairs = [];
  private lastCutPolygons = [];

  model: OrigamiModel;

  constructor() {
    this.model = new OrigamiModel();
  }
  
  resetCutHistory() {
    this.cutpolygonNodes2 = [];
    this.cutpolygonNodes = []
  }

  set cutpolygonPairs(value) {
    this._cutpolygonPairs = value;
  }

  get cutpolygonPairs() {
    return this._cutpolygonPairs;
  }

  getVertex(index) {
    return this.model.getVertex(index);
    //return this.vertices[index];
  }
  
  getVertex2d(index) {
    return this.model.getVertex2d(index);
    //return this.vertices2d[index];
  }

  addVertex(v: THREE.Vector3){
    //this.vertices.push(v);
    this.model.addVertex(v);
  }

  addVertex2D(v: THREE.Vector3){
    //this.vertices2d.push(v);
    this.model.addVertex2d(v);
  }

  getVertices(){
    return this.model.getVertices();
    //return this.vertices;
  }

  getVertices2d(){
    return this.model.getVertices2d();
    //return this.vertices2d;
  }

  replaceAllPolygons(polygons) {
    //this.polygons = polygons;
    this.model.replaceAllPolygons(polygons);
  }
  
  replacePolygon(index, tmp){
    // this.polygons.splice(index,0, tmp);
    this.model.replacePolygon(index, tmp);
  }
  
  getPolygon(index) {
    return this.model.getPolygon(index);
    //return this.polygons[index];
  }
  
  removePolygon(index){
    return this.model.removePolygon(index);
    //return this.polygons.splice(index, 1);
  }

  setPolygon(index: number, polygon: Array<number>) {
    //this.polygons[index] = polygon;
    this.model.setPolygon(index, polygon);
  }
  getPolygons(){
    return this.model.getPolygons();
  }

  cut(plane: THREE.Plane){
    let polygons = this.getPolygons();

    polygons.forEach((polygon, index) => {      
      this.cutPolygon(index, plane);
    })
  }

  isNonDegenerate(index){
    let polygon = new Polygon(this.model.getPolygonVertices(index));
    return polygon.isNonDegenerate();
  }

  cutPolygon(index, plane){
    let polygon = new Polygon(this.model.getPolygonVertices(index), this.model.getPolygon(index));
    
    if(polygon.canCut(plane) === false){
      //console.warn('cant cut polygon #', index);
      return false;
    }

    let cutResult = polygon.cut(plane, this.cutpolygonNodes2);

    this.cutpolygonPairs.push([index, this.getPolygons().length]);
    this.lastCutPolygons.push(this.getPolygon(index));
    
    cutResult = this.model.processCutResult(index, cutResult);
    this.cutpolygonNodes2 = this.cutpolygonNodes2.concat(cutResult.cutpolygonNodes);
  }
  
  // Reflect
  reflect(plane){

    this.model.shrink();

    // this.cutpolygonNodes = [];
    this.resetCutHistory();
    this.cutpolygonPairs = [];
    this.lastCutPolygons = [];

    this.cut(plane);

    this.getVertices().forEach(vertex => {
      if(this.vertexPosition(vertex, plane) == VERTEX_POSITION.FRONT){
        let vertexReflected = this.reflectVertex(vertex, plane);
        vertex.copy(vertexReflected);
      }
    })

  }

  reflectIndex(plane, polygonIndex){
    
    this.highlightedVertices = []
    //this.fold(plane, 0);

    const selection = this.polygonSelect(plane, polygonIndex);

    selection.forEach(selection => {
      let polygon = this.getPolygon(selection);
      polygon.forEach(index => {
        this.highlightPoint(index, 0xff00ff);
      })
    })

    this.getVertices().forEach((vertex, index) => {
      selection.every(selection => {
        let polygon = this.getPolygon(selection);
        if(polygon.indexOf(index) !== -1){
          let vertexReflected = this.reflectVertex(vertex, plane);
          vertex.copy(vertexReflected);
          return false; //break the loop
        }

        return true;
      })
    })

    this.mergeUnaffectedPolygons(selection)
    this.model.shrinkWithIndex(polygonIndex);
  }

  crease(plane){
    this.fold(plane, 0)
  }

  // fold
  fold(plane: THREE.Plane, angle = 0){
    this.model.shrink();

    //this.cutpolygonNodes = [];
    this.resetCutHistory();
    this.cutpolygonPairs = [];
    this.lastCutPolygons = [];

    this.cut(plane);

    let foldingpoints = this.getVertices().filter(vertex => {
      let distance = plane.distanceToPoint(vertex);
      return parseFloat(distance.toFixed(2)) === 0
    });

    //foldingpoints.forEach(vertex => this.showPoint(vertex, 0x00ff00));
    let referencePoint = foldingpoints[0];
    let maxDistance = 0;
    let farpoint;

    // start self-collision testing
    let collin = false;
    foldingpoints.forEach(vertex => {
      let distance = referencePoint.distanceTo(vertex);
      if(distance > 0){
        collin = true;
        //1. ok found at least two points on the plane to rotate around
      }

      if(distance > maxDistance){
        farpoint = vertex;
        maxDistance = distance;
      }
    });

    for(let i = 1; i<foldingpoints.length;i++){
      let foldingPoint = foldingpoints[i];
      if(foldingPoint == farpoint){
        continue;
      }

      let v1 = referencePoint.clone().sub(foldingPoint);
      let v2 = farpoint.clone().sub(foldingPoint);
      let v3 = referencePoint.clone().sub(farpoint);

      if(v1.dot(v2) > v3.length()){
        collin = false;
        break;
      }
    }

    if(collin){
      //this.showPoint(referencePoint, 0xff0000);

      let axis = referencePoint.clone().sub(farpoint).normalize();
      let foldingpoints = this.getVertices().forEach(vertex => {
        if(this.vertexPosition(vertex, plane) == VERTEX_POSITION.FRONT){
          //this.showPoint(vertex, 0xffff00);

          let v2 = vertex.clone().sub( referencePoint ).applyAxisAngle( axis, angle * Math.PI/180 ).add( referencePoint );
          vertex.copy(v2);

        }
      })
    }else {
      //console.warn("can't fold, would tear");
    }
  }

  foldIndex(plane: THREE.Plane, angle = 0, polygonIndex = -1){
    //this.fold(plane, 0);
    let selection = this.polygonSelect(plane, polygonIndex);

    selection.forEach(selection => {
      let polygon = this.getPolygon(selection);
      polygon.forEach(index => {
        this.highlightPoint(index, 0xff00ff);
      })

    })

    let foldingpoints = this.getVertices().filter((vertex, index) => {
      let distance = plane.distanceToPoint(vertex);
      if(Math.abs(distance) < 0.01){
        for(let i = 0; i < selection.length; i++){
          let polygon = this.getPolygon(selection[i]);
          return polygon.indexOf(index) !== -1;
        }
      }
    });

    let referencePoint = foldingpoints[0];
    let maxDistance = 0;
    let farpoint;

    // start self-collision testing
    let collin = false;
    foldingpoints.forEach((vertex, index) => {

      let distance = referencePoint.distanceTo(vertex);
      if(distance > 0){
        collin = true;
        //1. ok found at least two points on the plane to rotate around
      }

      if(distance > maxDistance){
        farpoint = vertex;
        maxDistance = distance;
      }
    });



    for(let i = 1; i<foldingpoints.length;i++){
      let foldingPoint = foldingpoints[i];

      if(foldingPoint == farpoint){
        continue;
      }




      let v1 = referencePoint.clone().sub(foldingPoint);
      let v2 = farpoint.clone().sub(foldingPoint);
      let v3 = referencePoint.clone().sub(farpoint);

      if(v1.dot(v2) > v3.length()){
        collin = false;
        break;
      }
    }

    if(collin){
      //this.showPoint(referencePoint, 0xff0000);

      let axis = referencePoint.clone().sub(farpoint).normalize();
      this.getVertices().forEach((vertex, index) => {
        //this.showPoint(vertex,0x00ff00);
        //console.log('foldingpoints', index)

        for(let i = 0; i < selection.length; i++){
          let polygon = this.getPolygon(selection[i])
          //console.log('test index', index, polygon.containsIndex(index))
          if(polygon.indexOf(index) !== -1){
            let v2 = vertex.clone().sub( referencePoint ).applyAxisAngle( axis, angle * Math.PI/180 ).add( referencePoint );
            vertex.copy(v2);
            break;
          }
        }

      })
    }


    this.mergeUnaffectedPolygons(selection)
    this.model.shrinkWithIndex(polygonIndex);
  }



  vertexPosition(vertex, plane){
    let distance = plane.distanceToPoint(vertex);
    if(distance == 0 ){
      return VERTEX_POSITION.COPLANAR;
    }else {
      if(distance > 0){
        return VERTEX_POSITION.FRONT;
      }else{
        return VERTEX_POSITION.BACK;;
      }
    }
  }


  getPointOnOrigami(point){
    let polygonIndex = this.findPolygon2D(point);
    if(polygonIndex < 0) return null;

    let polygons = this.getPolygons();
    let vertices = this.getVertices();
    let vertices2d = this.getVertices2d();

    let vertexIndices = polygons[polygonIndex];

    let orig = vertices[vertexIndices[0]];
    let orig_2d = vertices2d[vertexIndices[0]];

    for(let i = 0; i < vertexIndices.length;i++){
      for(let j = 0;j < vertexIndices.length;j++){
        let point1Index = vertexIndices[i];
        let point1 = vertices[vertexIndices[i]];
        let point1_2d = vertices2d[vertexIndices[i]];

        let point2Index = vertexIndices[j];
        let point2 = vertices[vertexIndices[j]];
        let point2_2d = vertices2d[vertexIndices[j]];

        let base1 = point1.clone().sub(orig)
        let base2 = point2.clone().sub(orig)

        if(base1.clone().cross(base2).lengthSq() > 0){
            base1.normalize();
            base2.normalize();

            let base1_2d = point1_2d.clone().sub(orig_2d).normalize();
            let base2_2d = point2_2d.clone().sub(orig_2d).normalize();

            let det = base1_2d.x * base2_2d.y - base1_2d.y * base2_2d.x;
            let coord1 = point.clone().sub(orig_2d).dot(new THREE.Vector3(base2_2d.y/det, -base2_2d.x/det, 0));
            let coord2 = point.clone().sub(orig_2d).dot(new THREE.Vector3(-base1_2d.y/det, base1_2d.x/det, 0));
            let result = orig.clone()
            result.add(base1.setLength(coord1).add(base2.setLength(coord2)));
            return result;
        }
      }
    }
  }

  getAlignmentPoints(){

    let points = [];

    //all vertices are corners, add them
    let vertices = this.getPolygons().reduce((accu, polygon) => {
      let vertices:any = polygon.map(index => this.getVertex(index));
      accu = accu.concat(vertices);
      return accu;
    }, []);

    points.push(...vertices);

    let v = new THREE.Vector3();

    //all midpoints
    this.getPolygons().forEach( polygon => {
      let vertices = polygon.map(index => this.getVertex(index));
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

  findPolygon2D(point){
    let polygons = this.getPolygons();
    let vertices2d = this.getVertices2d();

    let polys = polygons
      .map(list => list.map(index => [vertices2d[index].x, vertices2d[index].y]));

    for(let i = 0; i< polys.length; i++){
      let contains = polygonContains([point.x, point.y], polys[i]);
      if(contains){
        return i;
      }
    }
    return -1;
  }


  mergeUnaffectedPolygons(selection){
    this.model.mergeUnaffectedPolygons(selection, this.cutpolygonPairs, this.lastCutPolygons);

    this.cutpolygonPairs = [];
    this.lastCutPolygons = [];
  }



  reset(model) {
    this.model = model;
    this.highlightedVertices = [];
    //this.cutpolygonNodes = [];
    this.resetCutHistory();
    this.cutpolygonPairs = [];
    this.lastCutPolygons = [];
  }


  showPoint(point, color = 0x00ffff){
    let s = utils.createSphere(color)
    s.position.copy(point);

    World.getInstance().add(s)
  }

  getHighlight(index){
    return this.highlightedVertices[index];
  }

  highlightPoint(index, color = 0x00ffff){
    this.highlightedVertices[index] = new THREE.Color(color);
  }

  reflectVertex(vertex, plane){
    let projected = plane.projectPoint(vertex);
    let v2 = new THREE.Vector3().subVectors(projected, vertex);
    let newPos = projected.clone().add(v2)
    return newPos;
  }

  polygonSelect(plane, index){
    if(index === 27){
      console.error(index, ' vs', this.getPolygons().length);
    }
    const selection = [index];

    for( let j = 0; j < selection.length; j++){
        let selectedPolygon = this.getPolygon(selection[j]);
        if(selectedPolygon === undefined){
          debugger;
        }
        for(let i = 0; i < this.getPolygons().length; i++){
          if(selection.indexOf(i) === -1){
            let polygon = this.getPolygon(i);

            //check the new polygon. At least
            // 1.one point must be on the cutting plane
            // 2. one point must be part of the original selected  polygon
            for(let ii=0; ii < polygon.length; ii++ ){
              if(selectedPolygon.indexOf(polygon[ii]) !== -1){
                let vertex = this.getVertex(polygon[ii]);
                let distance = plane.distanceToPoint(vertex);

                if(Math.abs(distance) > 0.0001){
                  selection.push(i);
                  break;
                }
              }
            }
          }
        }
    }

    return selection;
  }
}
