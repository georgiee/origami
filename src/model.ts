import { polygonContains } from './math';
import { Polygon } from './polygon';
import * as THREE from 'three';
import * as _ from 'lodash';

//const SNAP_INTERVALS = [1/2,1/3,1/4,2/3,3/4];
const SNAP_INTERVALS = [1/2];
class CutResult {
  newpoly1;
  newpoly2;
  cutpolygonNodes;
  newVertices;

  constructor({newpoly1 = [], newpoly2 = [], cutpolygonNodes = [], newVertices = []}) {
    this.newpoly1 = newpoly1;
    this.newpoly2 = newpoly2;
    this.cutpolygonNodes = cutpolygonNodes;
    this.newVertices = newVertices;
  }
  
  expandIndex(baseSize){
    return object => {
      if(object.added !== undefined) {
        return object.added + baseSize; //expand
      } else {
        return object;
      }
    }
  }
  
  // get through all lists and search for special format the references local indices, expand them to global
  updateReferences(baseSize) {
    this.newpoly1 = this.newpoly1.map(this.expandIndex(baseSize));
    this.newpoly2 = this.newpoly2.map(this.expandIndex(baseSize));
    this.cutpolygonNodes = this.cutpolygonNodes.map(node =>
      Object.assign(node, {result: node.result.added + baseSize}
    ))
  }
}

export class OrigamiGeometryData {
    vertices: Array<THREE.Vector3> = [];
    vertices2d: Array<THREE.Vector3> = [];
    polygons: Array<Array<number>> = [];

    getVerticesForPolygon(index) {
      return this.polygons[index].map(index => this.vertices[index]);
    }
    
    getVertices2dForPolygon(index) {
      return this.polygons[index].map(index => this.vertices2d[index]);
    }
    
    get verticesCount(){
      return this.vertices.length;
    }

    addVertices(...vertices) {
      this.vertices.push(...vertices);
    }

    // polygon accessors
    getPolygons() {
        return this.polygons.concat([]);
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
    
    //vertex 3d
    getVertex(index){
      return this.vertices[index];
    }
    
    addVertex(v: THREE.Vector3){
      this.vertices.push(v);
    }
    
    getVertices() {
      return this.vertices.concat([]);
    }
    
    
    //vertex 2d
    getVertex2d(index){
      return this.vertices2d[index];
    }

    addVertex2d(v: THREE.Vector3){
      this.vertices2d.push(v);
    }

    getVertices2d() {
      return this.vertices2d.concat([]);
    }

}

export class OrigamiModel {
    data: OrigamiGeometryData
    
    constructor(data = null){
      this.data = data || new OrigamiGeometryData();
    }
    
    compare(otherModel){
      //console.log('vertices:', this.vertices.length + ' / ' + otherModel.vertices.length);
      // console.log('vertices2d:', this.vertices2d.length + ' / ' + otherModel.vertices2d.length);
      // console.log('polygons:', this.polygons.length + ' / ' + otherModel.polygons.length);

      let diff = _.reduce(<any>this, function(result, value, key) {
          return _.isEqual(value, otherModel[key]) ?
              result : result.concat(key);
      }, []);
      
      if(diff.length > 0){
        console.error('diff:', diff)
        console.log(this, otherModel);
        //debugger;
      }

      // console.log('me',this.vertices2d.concat([]))
      // console.log('other',otherModel.vertices2d.concat([]))
    }

    amendVertices2d(v1Index, v2Index, meetIndex) {
      let meet = this.data.getVertex(meetIndex);

      let v1 = this.data.getVertex(v1Index);
      let v2 = this.data.getVertex(v2Index);
      let weight1 = meet.clone().sub(v2).length();
      let weight2 = meet.clone().sub(v1).length();

      let vertex2D_1  = this.data.getVertex2d(v1Index);
      let vertex2D_2  = this.data.getVertex2d(v2Index);

      let vector2d = new THREE.Vector3(
        (vertex2D_1.x * weight1 + vertex2D_2.x * weight2)/(weight1 + weight2),
        (vertex2D_1.y * weight1 + vertex2D_2.y * weight2)/(weight1 + weight2),
        0
      )
      
      this.data.addVertex2d(vector2d);
    }
    
    processCutResult(index, result){
      const countBefore = this.data.verticesCount;
      
      result = new CutResult(result);
      result.updateReferences(countBefore)
      
      //1. add all new vertices and update references to point to the correct global vertex index
      this.data.addVertices(...result.newVertices);
      
      result.cutpolygonNodes.forEach(node => {
        this.amendVertices2d(node.v1, node.v2, node.result);
      })
      
      this.data.setPolygon(index, result.newpoly1)
      this.data.addPolygon(result.newpoly2);

      return result.cutpolygonNodes;
    }
    
    reset(polygons = [], vertices = [], vertices2d = []){
      this.data.polygons = polygons;
      this.data.vertices = vertices;
      this.data.vertices2d = vertices2d;
    }
    
    
    
    replaceAllPolygons(polygons) {
        this.data.polygons = polygons;
    }
    clone(){
      let polygons = this.data.polygons.concat([]);
      let vertices = this.data.vertices.map(v => v.clone());
      let vertices2d = this.data.vertices2d.map(v => v.clone());

      let model = new OrigamiModel();
      model.reset(polygons, vertices, vertices2d);
      
      return model;
    }

    mergeUnaffectedPolygons(selection, cutpolygonPairs, lastCutPolygons){
      let counter = 0;

      cutpolygonPairs.forEach((pair, index) => {
        //if not part of the selection make this polygon like the one before, the other part will be removed in the next loop.
        if(!(selection.indexOf(pair[0]) !== -1 || selection.indexOf(pair[1]) !== -1)){
          this.data.setPolygon(pair[0], lastCutPolygons[index])
        }
      })


      cutpolygonPairs.forEach((pair, index) => {
        if(!(selection.indexOf(pair[0]) !== -1 || selection.indexOf(pair[1]) !== -1)) {
          this.data.setPolygon(pair[1], [])
          counter++;
        }
      })
      console.info('merge previous', cutpolygonPairs.length, 'cleared: ', counter, this.data.getPolygons().length);
    }



  shrink(){
    let countBefore = this.data.getPolygons().length;
    this.replaceAllPolygons(this.data.getPolygons().filter(polygon => polygon.length > 0));
    console.log('shrink', countBefore, '->', this.data.getPolygons().length);
  }

  shrinkWithIndex(index){
    let countBefore = this.data.getPolygons().length;

    const tmp = this.data.getPolygon(index);
    this.data.removePolygon(index);
    const length = this.data.getPolygons().length;
    for (let i = 0; i < this.data.getPolygons().length; i++) {
      if(this.data.getPolygon(i).length < 1){
        this.data.removePolygon(i);
        i--;
      }
    }
    while (index > this.data.getPolygons().length) {
      this.data.addPolygon([]);
     }
    
    this.data.replacePolygon(index, tmp)

    console.log('shrinkWithIndex', countBefore, '->', this.data.getPolygons().length);
  }


    
    getPolygonVertices(index) {
      return this.data.getVerticesForPolygon(index);
    }
    
    getPolygonVertices2d(index) {
      return this.data.getVertices2dForPolygon(index);
    }
    

    findPolygon2D(point){
      let polygons = this.data.getPolygons();
      let vertices2d = this.data.getVertices2d();

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

    getPointOnOrigami(point){
      let polygonIndex = this.findPolygon2D(point);
      if(polygonIndex < 0) return null;

      let polygons = this.data.getPolygons();
      let vertices = this.data.getVertices();
      let vertices2d = this.data.getVertices2d();

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
      let vertices = this.data.getPolygons().reduce((accu, polygon) => {
        let vertices:any = polygon.map(index => this.data.getVertex(index));
        accu = accu.concat(vertices);
        return accu;
      }, []);

      points.push(...vertices);

      let v = new THREE.Vector3();

      //all midpoints
      this.data.getPolygons().forEach( polygon => {
        let vertices = polygon.map(index => this.data.getVertex(index));
        let length = polygon.length;

        for(let i = 0; i < length; i++){
          let v1 = vertices[i];
          let v2 = vertices[(i + 1)%length];
          //midpoint
          SNAP_INTERVALS.forEach(ratio => {
            points.push(v.clone().lerpVectors(v1, v2, ratio));
          })
        }
      })

      return points;
    }

    isNonDegenerate(polygonIndex) {
      let polygon = new Polygon(this.data.getVerticesForPolygon(polygonIndex));
      return polygon.isNonDegenerate();
    }

    getPolygons() {
      let polygons = this.data.getPolygons();
      return polygons;
    }
    
    // Return all raw polygons wrapped in a Polygon class to access polygon scoped methods
    getPolygonWrapped(): Array<Polygon> {
      let polygons = this.getPolygons();
      
      return polygons.map((indices, polygonIndex) => {
        let polygon = new Polygon();
        polygon.points = this.data.getVerticesForPolygon(polygonIndex);
        polygon.points2d = this.data.getVertices2dForPolygon(polygonIndex);
        polygon.indices = indices;

        return polygon;
      })
    }
}