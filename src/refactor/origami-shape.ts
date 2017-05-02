import * as THREE from 'three';
import math from '../math';

export default class OrigamiShape {
  private polygons = [];
  private vertices = [];
  private vertices2d = [];
  private cutpolygonNodes = [];

  getVertices(){
    return this.vertices;
  }

  getPolygons(){
    return this.polygons;
  }

  addVertex(v: THREE.Vector3){
    this.vertices.forEach(v1 => {
      let distance = v1.distanceToManhattan(v);
      if(distance < 0.0001){
        console.log(distance, v1, 'seems equal to', v);
      }
    })
    this.vertices.push(v);
  }

  addVertex2D(v: THREE.Vector3){
    this.vertices2d.push(v);
  }

  addPolygon(polygon){
    this.polygons.push(polygon);
  }

  cut(plane: THREE.Plane){
    console.log('this.verticesSize before', this.verticesSize);
    this.polygons.forEach((polygon, index) => {
      this.cutPolygon(index, plane);
    })
    console.log('this.verticesSize after', this.verticesSize);
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

  cutPolygon(index, plane){
    console.info('cutPolygon------>', index)

    if(this.canCut(index, plane) === false){
      console.log('cant cut polygon #', index);
      return false;
    }

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

      //if it's on the cutting plane it belongs to both new polygons

      if(Math.abs(distance) < 0.001){
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

        let divided = math.planeBetweenPoints2(plane,vertex,vertex2);

        if(divided){
          //was this pair cutted before? reuse
          console.log('check intersections form before', this.cutpolygonNodes);
          console.log(polygonIndices[i], polygonIndices[j]);
          let freshcut = true;

          for(let node of this.cutpolygonNodes){
            console.log('check node', node)
            if(node[0] == polygonIndices[i] && node[1] == polygonIndices[j]){
              newpoly1.push(node[2]);
              newpoly2.push(node[2]);
              freshcut = false;
              break;
            }else if(node[0] == polygonIndices[j] && node[1] == polygonIndices[i]){
              newpoly1.push(node[2]);
              newpoly2.push(node[2]);
              freshcut = false;
              break;
            }
          }


          let direction = vertex.clone().sub(vertex2);
          let line = new THREE.Line3(vertex, vertex2);

          if(freshcut && plane.intersectsLine(line)){
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

  get verticesSize(){
    return this.vertices.length;
  }


  canCut(index, plane){
    if(this.isNonDegenerate(index)){
      let inner = false;
      let outer = false;
      let vertices = this.polygonToVertices(this.polygons[index]);
      let normal = plane.normal;
      let coplanarPoint = plane.coplanarPoint();

      for(let i = 0; i < vertices.length; i++){
        let vertex = vertices[i];
        let normalLength = Math.sqrt(Math.max(1, normal.lengthSq()));
        //TODO: Same as distanceToPlane?
        if(vertex.dot(normal)/normalLength > coplanarPoint.dot(normal)/normalLength + 0.00000001){
          inner = true;
        }else if(vertex.dot(normal)/normalLength < coplanarPoint.dot(normal)/normalLength - 0.00000001){
          outer = true;
        }

        if (inner && outer) {
            return true;
        }

      };
    }

    return false;
  }

  getAlignmentPoints(){

    let points = [];

    //all vertices are corners, add them
    let vertices = this.polygons.reduce((accu, polygon) => {
      let vertices = polygon.map(index => this.vertices[index]);
      accu = accu.concat(vertices);
      return accu;
    }, []);

    points.push(...vertices);

    let v = new THREE.Vector3();

    //all midpoints
    this.polygons.forEach( polygon => {
      let vertices = polygon.map(index => this.vertices[index]);
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
}
