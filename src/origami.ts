import * as THREE from 'three';
import utils from './utils';
import {difference, intersection, some} from 'lodash';

const VERTEX_POSITION = {
  COPLANAR: 0,
  FRONT: 1,
  BACK: 2
}

export default class Origami extends THREE.Object3D {
  private polygons = [];
  private vertices = [];

  markPolygon(index, color = 0xffff00, size = 2){
    console.log('mark markPolygon', index, this.polygons.length)
    this.markVertices(this.polygons[index],color,size)

  }

  markVertices(list, color = 0xff00ff, size = 2){
      list.map(index => this.vertices[index])
      .forEach(vertex => {
        let s = utils.createSphere(color, size)
        s.position.copy(vertex);
        this.add(s)
      })
  }

  indexToVertex(index){
    return this.vertices[index];
  }

  polygonSelect(plane, index){
    //this.markPolygon(index,0x00ff00, 1)
    let count = this.polygons.length;
    this.test();

    let selection = [index];
    for(let i = 0; i < 1;i++ ){
      let elem = selection[i];
      let poly1 = this.polygons[elem];

      //test with all polygons
      for(let ii = 0; ii < count; ii++){
          if(selection.indexOf(ii) != -1) {
            continue;
          }

          let poly2 = this.polygons[ii];
          //this.markPolygon(ii)

          let vertices = intersection(poly1, poly2);
          this.markVertices(vertices);
          //3,4 are same?!

          let connected = vertices
            .map(index => this.indexToVertex(index))
            .some(vertex => this.pointIsCoplanar(vertex, plane) === false)

          if(connected){
            selection.push(ii);
          }

      }
    }
    selection.forEach(index => {this.markPolygon(index)});
    return selection;
  }
  test(){
    let index = 0;
    let count = this.polygons.length;
    let poly1 = this.polygons[index];

    for(let ii = 0; ii < count; ii++){
        let poly2 = this.polygons[ii];
        let shared = this.getSharedVertices(poly1, poly2);
        if(shared.length > 0){
          console.log('result', shared, ii)

        }
      }


  }

  getSharedVertices(poly1, poly2){
    return poly1
      .filter(index => poly2.indexOf(index) != -1)
  }

  pointIsCoplanar(point, plane){
    let distance = plane.distanceToPoint(point);
    return parseFloat(distance.toFixed(2)) === 0;
  }

  rotationFold(plane: THREE.Plane, angle = 0){
    let foldingpoints = this.vertices.filter(vertex => {
      let distance = plane.distanceToPoint(vertex);
      return parseFloat(distance.toFixed(2)) === 0
    });

    foldingpoints.forEach(vertex => {
      let s = utils.createSphere(0x00ffff)
      s.position.copy(vertex);
      //this.add(s)
    })

    let referencePoint = foldingpoints[0];
    let maxDistance = 0;
    let farpoint;

    let collin = false;
    foldingpoints.forEach(vertex => {
      let distance = referencePoint.distanceTo(vertex);
      if(distance > 0){
        collin = true;
      }
      if(distance > maxDistance){
        farpoint = vertex;
        maxDistance = distance;
      }
    })

    foldingpoints.forEach(vertex => {
      if(vertex == farpoint) return;

      let v1 = referencePoint.clone().sub(vertex);
      let v2 = farpoint.clone().sub(vertex);
      let v3 = referencePoint.clone().sub(farpoint);

      if(v1.dot(v2) > v3.length()){
        collin = false;
      }
    })

    if(collin){
      let axis = referencePoint.clone().sub(farpoint).normalize();

      let foldingpoints = this.vertices.forEach(vertex => {
        if(this.vertexPosition(vertex, plane) == VERTEX_POSITION.FRONT){
          //var axis = new THREE.Vector3( 0, 1, 0 );
          vertex.sub( referencePoint ).applyAxisAngle( axis, angle * Math.PI/180 ).add( referencePoint );
        }
      })
    }
  }

  addVertex(v: THREE.Vector3){
    //if(Math.abs(v.y -21.47238002427889) < 0.01){
    //}
    this.vertices.push(v);
  }

  addPolygon(polygon){
    this.polygons.push(polygon);
  }

  reflect(plane){
    this.vertices.forEach(vertex => {
      if(this.vertexPosition(vertex, plane) == VERTEX_POSITION.FRONT){
        let vertexReflected = this.reflectVertex(vertex, plane);
        vertex.copy(vertexReflected);
      }
    })
  }

  reflectVertex(vertex, plane){
    let projected = plane.projectPoint(vertex);
    let v2 = new THREE.Vector3().subVectors(projected, vertex);
    let newPos = projected.clone().add(v2)
    return newPos;
  }

  toGeometry(){
    let combinedGeometry = new THREE.Geometry();
    let counter = 1;

    this.polygons.forEach((polygon, index) => {
      if(this.isNonDegenerate(index) === false || polygon.length < 3){
        return;
      }

      let geometry = new THREE.Geometry();

      let polygonVertices = polygon.map(index => {
        return this.vertices[index].clone()
      });

      let triangles = THREE.ShapeUtils.triangulate(polygonVertices, true);
      let faces = triangles.map(triangle => new THREE.Face3(triangle[0], triangle[1], triangle[2]));

      geometry.vertices.push(...polygonVertices);
      geometry.faces.push(...faces);
      //geometry.translate(0,0,counter * 10);

      combinedGeometry.merge(geometry, new THREE.Matrix4());
      counter++
    })

    return combinedGeometry;
  }

  toMesh(){
    let geometry = this.toGeometry();
    let mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({wireframe: true}));

    return mesh;
  }

  get verticesSize(){
    return this.vertices.length;
  }

  polygonToVertices(polygon){
    let vertices:Array<THREE.Vector3> = polygon.map(index => this.vertices[index]);
    return vertices;
  }

  isNonDegenerate(index){
    let size = this.polygons[index].length;
    let vertices = this.polygonToVertices(this.polygons[index]);

    if(size > 1){
      for(let i = 0; i < size; i++){
        if(vertices[0].distanceTo(vertices[i]) > 0){
          return true;
        }
      }
    }

    return false;
  }

  canCut(index, plane){
    return this.isNonDegenerate(index);
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

  cutPolygon(index, plane){
    if(this.canCut(index, plane) === false){
        return false;
    }

    console.info('cutPolygon------>')
    let polygonIndices = this.polygons[index];
    let polygonVertices = this.polygonToVertices(polygonIndices);

    let ppoint = plane.coplanarPoint();
    let pnormal = plane.normal;

    let newpoly1 = [];
    let newpoly2 = [];

    for (let i = 0; i < polygonVertices.length; i++) {
      let j = (i + 1) % polygonVertices.length; //following vertex

      let vertex = polygonVertices[i];
      let vertex2 = polygonVertices[j];

      let distance = plane.distanceToPoint(vertex);

      if(distance === 0){
        newpoly1.push(polygonIndices[i]);
        newpoly2.push(polygonIndices[i]);
      }else {
        let sideA = vertex.dot(pnormal);
        let sideB = ppoint.dot(pnormal);

        if(sideA > sideB){
          newpoly1.push(polygonIndices[i]);
        }else{
          newpoly2.push(polygonIndices[i]);
        }

        let divided = this.planeBetweenPoints(plane,vertex,vertex2);

        if(divided){
          let direction = vertex.clone().sub(vertex2);
          let line = new THREE.Line3(vertex, vertex2);

          if(plane.intersectsLine(line)){
            let ipoint = vertex.clone();
            let meet = plane.intersectLine(line);
            this.addVertex(meet);

            newpoly1.push(this.verticesSize - 1);
            newpoly2.push(this.verticesSize - 1);
          }

        }
      }
    }

    this.polygons[index] = newpoly1;
    this.addPolygon(newpoly2);
  }

  planeBetweenPoints(plane:THREE.Plane, v1, v2){
    let delta1 = plane.distanceToPoint(v1);
    let delta2 = plane.distanceToPoint(v2);

    return Math.sign(delta1) != Math.sign(delta2);
  }

  cut(plane){
    this.polygons.forEach((polygon, index) => {
      this.cutPolygon(index, plane);
    })

  }
}
