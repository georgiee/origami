import * as THREE from 'three';

export default class RulerHelper extends THREE.Object3D {
  private startMarker: THREE.Mesh;
  private endMarker: THREE.Mesh;
  private lineMesh: THREE.Line;

  constructor(){
    super();
    this.build();
  }

  build(){
    var material = new THREE.LineBasicMaterial( {
      linewidth: 10,
      color: 0xffffff
    });

    let geometry = new THREE.Geometry();
    geometry.vertices.push(new THREE.Vector3(), new THREE.Vector3());
    let lineMesh = new THREE.LineSegments( geometry, material );
    this.lineMesh = lineMesh;

    let startMarker = this.createMarker();
    this.startMarker = startMarker;

    let endMarker = this.createMarker();
    this.endMarker = endMarker;
  }

  reset(){
    this.remove(this.lineMesh);
  }

  show(){
    this.add(this.lineMesh);
    console.log('show line mesh')
  }

  createMarker(size = 5, color = 0xffffff){
    let s = new THREE.Mesh(new THREE.SphereGeometry(size, 10, 10), new THREE.MeshBasicMaterial({wireframe:true, color}));
    //this.add(s);
    return s;
  }

  update(p1: THREE.Vector3, p2: THREE.Vector3, plane?: THREE.Plane){
    if(p1 && p2){
      let geometry: any = this.lineMesh.geometry;
      geometry.vertices[ 0 ].copy(p1);
      geometry.vertices[ 1 ].copy(p2);

      if(plane){
        let normal = plane.normal;
        var newPos = new THREE.Vector3();
        newPos.addVectors ( p1, normal.multiplyScalar( 100 ) );
        geometry.vertices[ 2 ].copy(p1);
        geometry.vertices[ 3 ].copy(newPos);
      }

      geometry.verticesNeedUpdate = true;
    }

    let vector;

    if(p1){
      this.startMarker.position.copy(p1);
    }

    if(p2){
      this.endMarker.position.copy(p2);
    }
  }
}
