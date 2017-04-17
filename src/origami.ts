import * as THREE from 'three';
import {Tree, Node} from './core/tree';
let math = require('mathjs');

class Origami extends THREE.Object3D {
  constructor(){
    super();
  }
}


function create(){
  let origami = new Origami();



  let v0 = new THREE.Vector3(0,0,0);
  let v1 = new THREE.Vector3(50,0,0);
  let v2 = new THREE.Vector3(50,50,0);
  let v3 = new THREE.Vector3(0,50,0);

  let face = new Face([v0, v1, v2, v3]);
  let crease = new THREE.Line3(new THREE.Vector3(20,50,0), new THREE.Vector3(50,40,0))

  var geometry = new THREE.Geometry();
  geometry.vertices.push(crease.start, crease.end);
  var line = new THREE.LineSegments( geometry );
  origami.add(line);

  let faces = face.split(crease, origami);
  //origami.add(face.toMesh());
  let mesh2 = face.toMesh(true)
  mesh2.position.x = 100;
  origami.add(mesh2);

  origami.add(faces.face1.toMesh());
  origami.add(faces.face2.toMesh());

  //let helper = new THREE.FaceNormalsHelper( faces.face2.toMesh(), 50, 0x00ff00, 10 );
  //origami.add(helper);
  //let helper = new THREE.FaceNormalsHelper( faces.face1.toMesh(), 50, 0x00ff00, 10 );
  //origami.add(helper);

  let material = new THREE.MeshBasicMaterial( {
     opacity: 0.5,
     transparent: true,
     vertexColors: THREE.FaceColors,
     side: THREE.DoubleSide
   } );

  let mesh  = new THREE.Mesh( face.toGeometry(), material);
  //origami.add(mesh);

  return origami;
}

export default {create};


class Face {
  public vertices = [];
  public edges = [];
  public triangles: Array<THREE.Triangle> = [];

  constructor(v){
    this.vertices = [...v];
    this.triangles = [
      new THREE.Triangle(v[0],v[1],v[2]),
      new THREE.Triangle(v[0],v[2],v[3])
    ]

    this.edges = [
      new THREE.Line3(v[0],v[1]),
      new THREE.Line3(v[1],v[2]),
      new THREE.Line3(v[2],v[3]),
      new THREE.Line3(v[3],v[0])
    ]
  }

  findEdge(intersection):THREE.Line3 {
    for(let edge of this.edges){
      let distance = edge.closestPointToPoint(intersection).distanceTo(intersection);
      if(distance == 0){
        return edge
      }
    }
    return null;
  }

  analyze(intersections, raycaster, obj3d){

    let edge1 = this.findEdge(intersections[0]);
    let edge2 = this.findEdge(intersections[1]);

    let crease = new THREE.Line3(intersections[0], intersections[1])
    console.log('inetrsections', edge1, edge2)


		let pMaterial = new THREE.PointsMaterial( { size: 15, vertexColors: THREE.VertexColors} );

    let pGeo = new THREE.Geometry();

    pGeo.colors = [
      new THREE.Color(0xff0000),
      new THREE.Color(0xff0000),
      new THREE.Color(0xff0000),
      new THREE.Color(0x00ff00),
      new THREE.Color(0x00ff00),
      new THREE.Color(0x00ff00),
      new THREE.Color(0x0000ff)
    ]

    pGeo.vertices = [
      edge1.start,
      intersections[0],
      edge1.end,

      edge2.start,
      intersections[1],
      edge2.end,
      this.vertices[0]
    ]


    let points = new THREE.Points( pGeo, pMaterial );
		obj3d.add( points );


    console.log('edge and point', edge1,intersections[0], this.edges.indexOf(edge1))
    //CCW: edge1.end --> intersections[0] --> edge1.start
    //CCW: edge2.end --> intersections[1] --> edge2.start

    console.log('edge and point', edge2,intersections[1], this.edges.indexOf(edge2))
  }

  split(crease: THREE.Line3, obj3d){
    let edgeMesh = this.toEdgeMesh();
    let raycaster = new THREE.Raycaster();
    raycaster.set(crease.start, crease.delta().normalize())

    let result = raycaster.intersectObjects( [edgeMesh] );
    if(result.length != 2){
      throw new Error('Something is wrong with the crease on this face');
    }else {

      let intersections = [result[0].point, result[1].point];
      this.analyze(intersections, raycaster, obj3d)
      console.log('intersections', intersections)

      console.log(this.triangles[0].containsPoint(intersections[0]));
      console.log(this.triangles[1].containsPoint(intersections[0]));

      console.log('bary', this.triangles[0].barycoordFromPoint(intersections[0]));
      console.log('bary', this.triangles[1].barycoordFromPoint(intersections[0]));
      //A: determine through barycentre (sign changing from center of gravity)
      //A: use triangles
      let face1 = new Face([result[0].point, this.vertices[0], this.vertices[1],result[1].point])
      let face2 = new Face([result[0].point, result[1].point, this.vertices[2], this.vertices[3]])
      return {face1, face2};
    }
  }

  toEdgeMesh(){
    let edges = new THREE.LineSegments( this.toEdgeGeometry());
    return edges;
  }

  toMesh(wireframe = false){
    let mesh = new THREE.Mesh(this.toGeometry(), new THREE.MeshBasicMaterial({wireframe}));
    return mesh;
  }

  toEdgeGeometry(){
    let geometry = new THREE.Geometry();

    this.edges.forEach(edge => {
      geometry.vertices.push(edge.start, edge.end);
    });

    return geometry;
  }

  toGeometry(){
    let geometry = new THREE.Geometry();
    geometry.vertices.push(...this.vertices);

    geometry.faces.push(
      new THREE.Face3( 0, 1, 2 ),
      new THREE.Face3( 0, 2, 3 ),
    );

    geometry.computeFaceNormals();
    geometry.computeVertexNormals();

    return geometry;
  }
}

/*


let tree = new Tree();

tree.insert("face0")

tree.splitInsert("face0", "face0-1", "face0-2")
tree.splitInsert("face0-1", "face0-1-1","face0-1-2")
tree.splitInsert("face0-1-1", "face0-1-1-1","face0-1-1-2")
tree.splitInsert("face0-1-1-2", "face0-1-1-2-1","face0-1-1-2-2")
tree.splitInsert("face0-1-2", "face0-1-2-1","face0-1-2-2")

console.log(tree.toArray());

*/
