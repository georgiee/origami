import * as THREE from 'three';
import OrigamiShape from './origami-shape';
import * as chroma from 'chroma-js';

class OrigamiMesh extends THREE.Object3D {
  private materials;
  private group;

  constructor(private shape: OrigamiShape){
    super();
    this.init();
  }

    init(){
      this.group = new THREE.Group();
      this.add(this.group);
      
      this.materials =[
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
    }

    update(){
      this.group.remove(...this.group.children);

      //creates a combined mesh of front, back and wireframe display
      let geometry = this.toGeometry();
      let mesh = THREE.SceneUtils.createMultiMaterialObject(geometry, this.materials)

      let pointGeometry = new THREE.Geometry();
      pointGeometry.vertices.push(...this.shape.getVertices());

      let points = new THREE.Points(pointGeometry, new THREE.PointsMaterial({
        sizeAttenuation: false,
        size: 10,
        color: 0xffff00
      }));


      this.group.add(mesh);
      this.group.add(points);
    }


    toGeometry(){
      let combinedGeometry = new THREE.Geometry();

      this.shape.getPolygons().forEach((polygon, index) => {
        let geometry = new THREE.Geometry();
        let vertices = this.shape.getVertices();

        let polygonVertices = polygon.map(index => {
          return vertices[index].clone()
        });


        let triangles = THREE.ShapeUtils.triangulate(polygonVertices, true);
        let faces = triangles.map(triangle => new THREE.Face3(triangle[0], triangle[1], triangle[2]));

        geometry.vertices.push(...polygonVertices);
        geometry.faces.push(...faces);

        geometry.computeFaceNormals();
        combinedGeometry.merge(geometry, new THREE.Matrix4());

      });

      return combinedGeometry;
    }

}

export default OrigamiMesh;