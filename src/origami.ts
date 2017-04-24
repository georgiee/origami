import * as THREE from 'three';

export default class Origami {
  private polygons = [];
  private vertices = [];

  addVertex(v: THREE.Vector3){
    this.vertices.push(v);
  }

  addPolygon(polygon){
    this.polygons.push(polygon);
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
      geometry.translate(0,0,counter * 10);

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
