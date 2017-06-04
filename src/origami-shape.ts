import * as THREE from 'three';
import math from './math';
import * as _ from 'lodash';
import utils from './utils';
import World from './world';
import { OrigamiModel } from './model'

import { Polygon } from './polygon';


const LEGACY = true;

const VERTEX_POSITION = {
  COPLANAR: 0,
  FRONT: 1,
  BACK: 2
}

export class OrigamiShape {
  private cutpolygonNodes = [];
  private cutpolygonPairs = [];
  private lastCutPolygons = [];

  model: OrigamiModel;

  constructor() {
    this.model = new OrigamiModel();
  }
  
  resetCutHistory() {
    this.cutpolygonNodes = [];
    this.cutpolygonPairs = [];
    this.lastCutPolygons = [];
  }

  getVertex(index) {
    return this.model.data.getVertex(index);
    //return this.vertices[index];
  }

  getVertices(){
    return this.model.data.getVertices();
    //return this.vertices;
  }

  getPolygon(index) {
    return this.model.data.getPolygon(index);
    //return this.polygons[index];
  }

  cut(plane: THREE.Plane){
    let polygons = this.model.getPolygons();

    polygons.forEach((polygon, index) => {      
      this.cutPolygon(index, plane);
    })
  }

  cutPolygon(index, plane){
    let polygon = new Polygon(this.model.getPolygonVertices(index), this.model.data.getPolygon(index));
    
    if(polygon.canCut(plane) === false){
      
      //console.warn('cant cut polygon #', index);
      return false;

    } else {

      this.cutpolygonPairs.push([index, this.model.getPolygons().length]);
      this.lastCutPolygons.push(this.getPolygon(index));
      
      let cutResult = polygon.cut(plane, this.cutpolygonNodes);
      
      // this will update our overall model with new indices, vertices and polygons
      let newCutPolygonNodes = this.model.processCutResult(index, cutResult);
      this.cutpolygonNodes = this.cutpolygonNodes.concat(newCutPolygonNodes);
    }
  }
  
  // Reflect
  reflect(plane){
    this.model.shrink();
    this.resetCutHistory();

    this.cut(plane);

    this.getVertices().forEach(vertex => {
      if(this.vertexPosition(vertex, plane) == VERTEX_POSITION.FRONT){
        let vertexReflected = this.reflectVertex(vertex, plane);
        vertex.copy(vertexReflected);
      }
    })

  }

  reflectIndex(plane, polygonIndex){
    const selection = this.polygonSelect(plane, polygonIndex);

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

    this.resetCutHistory();
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

  reflectVertex(vertex, plane){
    let projected = plane.projectPoint(vertex);
    let v2 = new THREE.Vector3().subVectors(projected, vertex);
    let newPos = projected.clone().add(v2)
    return newPos;
  }

  polygonSelect(plane, index){
    const selection = [index];

    for( let j = 0; j < selection.length; j++){
        let selectedPolygon = this.getPolygon(selection[j]);
        if(selectedPolygon === undefined){
          debugger;
        }
        for(let i = 0; i < this.model.getPolygons().length; i++){
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

  mergeUnaffectedPolygons(selection){
    this.model.mergeUnaffectedPolygons(selection, this.cutpolygonPairs, this.lastCutPolygons);

    this.cutpolygonPairs = [];
    this.lastCutPolygons = [];
  }

  reset(model) {
    this.model = model;
    this.resetCutHistory();
    this.cutpolygonPairs = [];
    this.lastCutPolygons = [];
  }
}
