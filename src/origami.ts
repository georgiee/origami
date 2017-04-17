import * as THREE from 'three';


class Face {
  public vertices = [];

  toGeometry(){
    let v0
    let geometry = new THREE.Geometry();
    geometry.vertices.push(...this.vertices);
    geometry.faces.push( new THREE.Face3( 0, 1, 2 ) );
    geometry.faces.push( new THREE.Face3( 0, 2, 3 ) );

    geometry.computeFaceNormals();
    geometry.computeVertexNormals();

    return geometry;
  }
}

class Node {
  step: Number;
  left: Node;
  right: Node;
  constructor(public id, public data){
  }
}

class Tree {
  private nodes:Array<any> = [];
  private root:Node;

  constructor(){
  }

  getLeafs(current = null, nodes = []){
    if(current == null){
      current = this.root
    }

    if(current.left == null && current.right == null){
      return [current];
    }else {
      let left = this.getLeafs(current.left);
      nodes.push(...left);

      let right = this.getLeafs(current.right);
      nodes.push(...right);
    }

    return nodes;
  }

  insert(node){
    if(this.root == null) {
      this.root = node;
    } else{
      let current = this.root;
      let parent;

      while(true){
        parent = current;
        current = parent.left;

        if(current == null){
          parent.left = node;
          break;
        }
      }
      console.log(this)
    }
  }
}

export default class Origami extends THREE.Object3D {
  private faces:Array<any> = []
  private tree: Tree;

  constructor(){
    super();
    this.init();
  }

  init(){
    //this.sample();
    this.test2();
  }

  test2(){
    this.createFaces();
    this.createTreeFace();
    this.createMesh();
  }

  splitFaceHorizontal(face){
    let vertices = face.vertices;
    let v0 = vertices[0];
    let v1 = vertices[1];
    let v2 = vertices[2];
    let v3 = vertices[3];

    let tmp = new THREE.Vector3();
    let v01 = tmp.lerpVectors(v0, v1, 0.5).clone();
    let v23 = tmp.lerpVectors(v2, v3, 0.5).clone();

    let face1 = new Face();
    face1.vertices.push(v0,v01,v23,v3);
    let face2 = new Face();
    face2.vertices.push(v01,v1,v2, v23);

    return {face1, face2};
  }

  splitFaceVertical(face){
    let vertices = face.vertices;
    let v0 = vertices[0];
    let v1 = vertices[1];
    let v2 = vertices[2];
    let v3 = vertices[3];

    let tmp = new THREE.Vector3();
    let v03 = tmp.lerpVectors(v0, v3, 0.5).clone();
    let v12 = tmp.lerpVectors(v1, v2, 0.5).clone();

    let face1 = new Face();
    face1.vertices.push(v0,v1,v12,v03);

    let face2 = new Face();
    face2.vertices.push(v2,v3,v03,v12);

    return {face1, face2};
  }

  createTreeFace(){
    let tree = new Tree();
    this.tree = tree;

    let baseFace = this.createBaseFace();
    let node = new Node('root', baseFace);
    tree.insert(node);

    //split 1
    this.split(node);

    //split 2
    //this.split(node.left);
    //this.split(node.right);

    /*
    //split 3
    this.split(node.left.left);
    this.split(node.left.right);

    //split 4
    this.split(node.right.left);
    this.split(node.right.right);
    */
    console.log(tree)
  }

  split(node, horizontal = true){
    let face = node.data;

    //let {face1, face2} = this.splitFaceHorizontal(face);
    let {face1, face2} = this.splitFaceVertical(face);

    let node1 = new Node(node.id+'1', face1);
    let node2 = new Node(node.id+'2', face2);

    node.left = node1;
    node.right = node2;
  }

  createBaseFace(){
    var v0 = new THREE.Vector3(0,0,0);
    var v1 = new THREE.Vector3(50,0,0);
    var v2 = new THREE.Vector3(50,50,0);
    var v3 = new THREE.Vector3(0,50,0);

    let face = new Face();
    face.vertices.push(v0,v1,v2,v3);

    return face;
  }

  createFaces(){
    var v0 = new THREE.Vector3(0,0,0);
    var v1 = new THREE.Vector3(50,0,0);
    var v2 = new THREE.Vector3(50,50,0);
    var v3 = new THREE.Vector3(0,50,0);

    let tmp = new THREE.Vector3();
    let v01 = tmp.lerpVectors(v0, v1, 0.5).clone();
    let v23 = tmp.lerpVectors(v2, v3, 0.5).clone();

    let face = new Face();
    face.vertices.push(v0,v1,v2,v3);

    let face1 = new Face();
    face1.vertices.push(v0,v01,v23,v3);
    let face2 = new Face();
    face2.vertices.push(v01,v1,v2, v23);

    this.faces.push(face1, face2);
  }

  createMesh(){
    let faces = this.tree.getLeafs();
    faces = faces.map(node => node.data);

    let tmpGeometry = new THREE.Geometry();

    faces.forEach( face => {
      tmpGeometry.merge(face.toGeometry(), new THREE.Matrix4())
    })

    let material = new THREE.MeshBasicMaterial( { wireframe: true } );
    let mesh  = new THREE.Mesh( tmpGeometry, material);
    this.add(mesh);
  }

  sample(){
    let geometry = new THREE.PlaneGeometry( 100, 100, 1);
    let material = new THREE.MeshBasicMaterial( { wireframe: true } );
    let mesh  = new THREE.Mesh( geometry, material);

    this.add(mesh);
  }
}
