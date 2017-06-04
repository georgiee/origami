import * as THREE from 'three';
import * as _ from 'lodash';

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

export class OrigamiModel {
    vertices: Array<THREE.Vector3> = [];
    vertices2d: Array<THREE.Vector3> = [];
    polygons: Array<Array<number>> = [];
    
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

    get verticesCount(){
      return this.vertices.length;
    }
    
    getPolygonVertices(index) {
      return this.polygons[index].map(index => this.vertices[index]);
    }
    
    getPolygonVertices2d(index) {
      return this.polygons[index].map(index => this.vertices2d[index]);
    }
    
    amendVertices2d(v1Index, v2Index, meetIndex) {
      let meet = this.getVertex(meetIndex);

      let v1 = this.getVertex(v1Index);
      let v2 = this.getVertex(v2Index);
      let weight1 = meet.clone().sub(v2).length();
      let weight2 = meet.clone().sub(v1).length();

      let vertex2D_1  = this.getVertex2d(v1Index);
      let vertex2D_2  = this.getVertex2d(v2Index);

      let vector2d = new THREE.Vector3(
        (vertex2D_1.x * weight1 + vertex2D_2.x * weight2)/(weight1 + weight2),
        (vertex2D_1.y * weight1 + vertex2D_2.y * weight2)/(weight1 + weight2),
        0
      )
      this.addVertex2d(vector2d);
    }
    
    processCutResult(index, result){
      const countBefore = this.verticesCount;
      
      result = new CutResult(result);
      result.updateReferences(countBefore)
      
      //1. add all new vertices and update references to point to the correct global vertex index
      this.vertices.push(...result.newVertices);
      
      result.cutpolygonNodes.forEach(node => {
        this.amendVertices2d(node.v1, node.v2, node.result);
      })
      
      this.setPolygon(index, result.newpoly1)
      this.addPolygon(result.newpoly2);

      return result;
    }
    
    reset(polygons = [], vertices = [], vertices2d = []){
      this.polygons = polygons;
      this.vertices = vertices;
      this.vertices2d = vertices2d;
    }
    
    getVertex(index){
      return this.vertices[index];
    }
    
    getVertex2d(index){
      return this.vertices2d[index];
    }
    
    addVertex(v: THREE.Vector3){
      this.vertices.push(v);
    }
    
    addVertex2d(v: THREE.Vector3){
      this.vertices2d.push(v);
    }

    getVertices() {
      return this.vertices.concat([]);
    }
    
    getVertices2d() {
      return this.vertices2d.concat([]);
    }

    // polygons
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
    replaceAllPolygons(polygons) {
        this.polygons = polygons;
    }
    clone(){
      let polygons = this.polygons.concat([]);
      let vertices = this.vertices.map(v => v.clone());
      let vertices2d = this.vertices2d.map(v => v.clone());

      let model = new OrigamiModel();
      model.reset(polygons, vertices, vertices2d);
      
      return model;
    }

    mergeUnaffectedPolygons(selection, cutpolygonPairs, lastCutPolygons){
      let counter = 0;

      cutpolygonPairs.forEach((pair, index) => {
        //if not part of the selection make this polygon like the one before, the other part will be removed in the next loop.
        if(!(selection.indexOf(pair[0]) !== -1 || selection.indexOf(pair[1]) !== -1)){
          this.setPolygon(pair[0], lastCutPolygons[index])
        }
      })


      cutpolygonPairs.forEach((pair, index) => {
        if(!(selection.indexOf(pair[0]) !== -1 || selection.indexOf(pair[1]) !== -1)) {
          this.setPolygon(pair[1], [])
          counter++;
        }
      })
      console.info('merge previous', cutpolygonPairs.length, 'cleared: ', counter, this.getPolygons().length);
    }



  shrink(){
    let countBefore = this.getPolygons().length;
    this.replaceAllPolygons(this.getPolygons().filter(polygon => polygon.length > 0));
    console.log('shrink', countBefore, '->', this.getPolygons().length);
  }

  shrinkWithIndex(index){
    let countBefore = this.getPolygons().length;

    const tmp = this.getPolygon(index);
    this.removePolygon(index);
    const length = this.getPolygons().length;
    for (let i = 0; i < this.getPolygons().length; i++) {
      if(this.getPolygon(i).length < 1){
        this.removePolygon(i);
        i--;
      }
    }
    while (index > this.getPolygons().length) {
      this.addPolygon([]);
     }
    
    this.replacePolygon(index, tmp)

    console.log('shrinkWithIndex', countBefore, '->', this.getPolygons().length);
  }

}