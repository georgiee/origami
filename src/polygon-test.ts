import * as THREE from 'three';
import * as dat from 'dat.gui/build/dat.gui';
import utils from './utils';
import IntersectionPlane from './intersection-plane';

let container = new THREE.Object3D();
let guiData:any = {}

const math = {
  plane_between_points(plane:THREE.Plane, v1, v2){
    let delta1 = plane.distanceToPoint(v1);
    let delta2 = plane.distanceToPoint(v2);

    return Math.sign(delta1) != Math.sign(delta2);
  }
}

class Origami {
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
      if(this.isNonDegenerate(index) === false){
        return;
      }

      let geometry = new THREE.Geometry();
      console.log(this.vertices)

      let polygonVertices = polygon.map(index => {
        console.log('vertices index', index, this.vertices[index]);
        return this.vertices[index].clone()
      });
      console.log('test those', polygon, polygonVertices);

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
      console.log('distance', distance);

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

        let divided = math.plane_between_points(plane,vertex,vertex2);


        if(divided){
          let direction = vertex.clone().sub(vertex2);
          let line = new THREE.Line3(vertex, vertex2);

          console.log('plane.intersectsLine(line)', plane.intersectsLine(line), line);

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

    console.info('<--------cutPolygon end', newpoly1, newpoly2)
    this.polygons[index] = newpoly1;
    this.addPolygon(newpoly2);
  }

  cut(plane){
    this.polygons.forEach((polygon, index) => {
      this.cutPolygon(index, plane);
    })

  }
}

function create(world){
  const gui = new dat.GUI();
  let camera = world.camera;

  let origami = new Origami();
  origami.addVertex(new THREE.Vector3(0,0,0));
  origami.addVertex(new THREE.Vector3(50,0,0));
  origami.addVertex(new THREE.Vector3(50,50,0));
  origami.addVertex(new THREE.Vector3(0,50,0));

  let polygon = [0,1,2,3];
  origami.addPolygon(polygon);
  //container.add(origami.toMesh());


  let cutter = new IntersectionPlane();
  cutter.setStart(25/100, -1);
  cutter.setEnd(25/100, 1);
  cutter.calculate(camera)
  //container.add(cutter);

  origami.cut(cutter.plane);
  let mesh = origami.toMesh();
  mesh.position.z = -20;
  //container.add(mesh);



  let cutter2 = new IntersectionPlane();
  cutter2.setStart(-1,25/100);
  cutter2.setEnd(1, 25/100);
  cutter2.calculate(camera)
  //container.add(cutter2);

  origami.cut(cutter2.plane);
  //container.add(origami.toMesh());



  let cutter3 = new IntersectionPlane();
  cutter3.setStart(0,50/100);
  cutter3.setEnd(50/100, 0);
  cutter3.calculate(camera)
  //container.add(cutter3);

  origami.cut(cutter3.plane);
  //container.add(origami.toMesh());




  let cutter4 = new IntersectionPlane();
  cutter4.setStart(0,0);
  cutter4.setEnd(50/100, 50/100);
  cutter4.calculate(camera)
  container.add(cutter4);

  origami.cut(cutter4.plane);
  container.add(origami.toMesh());

  return container;
}

export default { create }
