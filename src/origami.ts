import * as THREE from 'three';
import utils from './utils';
import {difference, intersection, some} from 'lodash';
import * as chroma from 'chroma-js';

const VERTEX_POSITION = {
  COPLANAR: 0,
  FRONT: 1,
  BACK: 2
}

export default class Origami extends THREE.Object3D {
  private polygons = [];
  private vertices = [];
  private vertices2d = [];

  private cutpolygonNodes = [];
  private cutpolygonPairs = [];
  private lastCutPolygons = [];
  private _mesh;
  private _planeView;

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
          let vAll = [...poly1, ...poly2].map(index => this.indexToVertex(index));
          console.log('vAll', vAll);

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

  prune(){
    //TODO: check if connected, otherwise overlapping vertex would be welded
    let threshold = 0.0001;

    let findNearOnes = (vertex1, index1) => {
      this.vertices.forEach((vertex2, index2) => {
        if(index1 == index2) return;
        if(vertex1.distanceTo(vertex2) < threshold){
          //console.log(vertex1, 'same as ', vertex2, index1, index2);
        }
      })
    }

    this.vertices.forEach((vertex, index) => {
      findNearOnes(vertex, index);
    })
  }

  getSharedVertices(poly1, poly2){
    return poly1
      .filter(index => poly2.indexOf(index) != -1)
  }

  pointIsCoplanar(point, plane){
    let distance = plane.distanceToPoint(point);
    return parseFloat(distance.toFixed(2)) === 0;
  }

  crease(plane){
      this.fold(plane, 0);
  }

  fold(plane: THREE.Plane, angle = 0){
    this.shrink();
    this.cutpolygonNodes = [];

    this.cut(plane);

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
    }else {
      console.warn("can't fold, would tear");
    }
  }
  addVertex2D(v:THREE.Vector3){
    this.vertices2d.push(v);
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
    this.shrink();
    this.cutpolygonNodes = [];
    this.cut(plane);

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

      geometry.computeFaceNormals();
      //geometry.translate(0,0,counter * 10);

      combinedGeometry.merge(geometry, new THREE.Matrix4());
      counter++
    })

    return combinedGeometry;
  }


    toGeometryPlane(){
      let combinedGeometry = new THREE.Geometry();
      let counter = 1;

      let palette = chroma.scale(['yellow', 'orangered']).mode('lch');

      this.polygons.forEach((polygon, index) => {
        let currentColor = new THREE.Color(palette(index/this.polygons.length).hex());

        if(this.isNonDegenerate(index) === false || polygon.length < 3){
          return;
        }

        let geometry = new THREE.Geometry();

        let polygonVertices = polygon.map(index => {
          return this.vertices2d[index].clone()
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

  shrink(){
    this.polygons = this.polygons.filter(polygon => polygon.length > 0);
  }

  updateMesh(){
    if(this._mesh){
      this.remove(this._mesh);
    }

    this._mesh = this.toMesh();
    this.add(this._mesh);
  }

  updatePlaneView(){
    if(this._planeView){
      this.remove(this._planeView);
    }
    this._planeView = this.toPlaneView()
    this.add(this._planeView);
  }

  toMesh(){
    let geometry = this.toGeometry();

    let materials =[
        new THREE.MeshBasicMaterial({
        color: chroma('aquamarine').luminance(0.5).hex(),
        side: THREE.FrontSide,
        transparent: true,
        opacity: 0.8
      }),
      new THREE.MeshBasicMaterial({
        color: chroma('hotpink').luminance(0.5).hex(),
        side: THREE.BackSide,
        transparent: true,
        opacity: 0.8
      }),
      new THREE.MeshBasicMaterial({
        wireframe: true,
        color: 0xffff00,
        side: THREE.DoubleSide
      })
    ]
    let mesh = THREE.SceneUtils.createMultiMaterialObject(geometry, materials)

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
          //was this pair cutted before? reuse
          for(let node of this.cutpolygonNodes){
            if(node[0] == polygonIndices[i] && node[1] == polygonIndices[j]){
              newpoly1.push(node[2]);
              newpoly2.push(node[2]);
              break;
            }else if(node[0] == polygonIndices[j] && node[1] == polygonIndices[i]){
              newpoly1.push(node[2]);
              newpoly2.push(node[2]);
              break;
            }
          }

          let direction = vertex.clone().sub(vertex2);
          let line = new THREE.Line3(vertex, vertex2);

          if(plane.intersectsLine(line)){
            let ipoint = vertex.clone();
            let meet = plane.intersectLine(line);
            this.addVertex(meet);

            let weight1 = meet.clone().sub(vertex2).length();
            let weight2 = meet.clone().sub(vertex).length();


            let vertex2D_1  = this.vertices2d[polygonIndices[i]];
            let vertex2D_2  = this.vertices2d[polygonIndices[j]];
            let vector2d = new THREE.Vector3(
              (vertex2D_1.x * weight1 + vertex2D_2.x * weight2)/(weight1 + weight2),
              (vertex2D_1.y * weight1 + vertex2D_2.y * weight2)/(weight1 + weight2),
              0
            )
            this.addVertex2D(vector2d);

            newpoly1.push(this.verticesSize - 1);
            newpoly2.push(this.verticesSize - 1);
            this.cutpolygonNodes.push([polygonIndices[i],polygonIndices[j], this.verticesSize - 1 ])
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
    this.cutpolygonNodes = []

  }

  toPlaneView(){
    let geometry = this.toGeometryPlane();

    let material = new THREE.LineBasicMaterial( {
     vertexColors: THREE.VertexColors,
     color: 0xffffff
    } );

   var line = new THREE.LineSegments( geometry, material );
   line.position.x = 60;

   return line;
  }
}
