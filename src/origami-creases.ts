import * as THREE from 'three';
import * as chroma from 'chroma-js';
import utils from './utils';
import { distanceSquaredToLineSegment } from './math';

import World from './world';

const DEBUG = false;

export class OrigamiCreases extends THREE.Object3D {
  private currentView: THREE.Object3D;
  private polygonMarker: THREE.Object3D;
  private selectedPolygon: number = -1;
  private highlightedVertices;

  constructor(private shape){
    super()
    this.handleMouseClick = this.handleMouseClick.bind(this);
    this.init();
  }
  init(){
    this.polygonMarker = utils.createSphere();
    this.enableSelectPolygon();
  }

  enableSelectPolygon(){
    document.addEventListener('dblclick', this.handleMouseClick);
  }

  disableSelectPolygon(){
    //document.removeEventListener('click', <any>this.handleMouseClick);
  }

  handleMouseClick({clientX, clientY}){
    let point = this.getLocalPoint(clientX, clientY);

    this.selectedPolygon = this.shape.findPolygon2D(point);
    console.log('this.selectedPolygon', this.selectedPolygon);

    if(this.selectedPolygon >=0){
      this.add(this.polygonMarker);
      this.polygonMarker.position.copy(point);
    }else{
      this.remove(this.polygonMarker);
      point = null;
    }

    this.dispatchEvent({type:'polygon-selected', index: this.selectedPolygon, point })
  }

  isStrictlyNonDegenerate(index){
    return true;
  }

  getLocalPoint(clientX, clientY){
    let world = World.getInstance();
    let {x, y} = utils.mouseToDeviceCoordinates(clientX, clientY, world.domElement);

    let screenCoords = new THREE.Vector3(x, y, world.camera.near)
    let plane = new THREE.Plane(new THREE.Vector3(0,0,1), 0);

    let raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(screenCoords, world.camera);
    //debugger;
    //console.log(raycaster.ray.direction.negate())
    let result = raycaster.ray.intersectPlane(plane)
    //debugger;
    this.worldToLocal(result);
    return result;
  }

  update(){
    let currentView = this.toMesh();
    if(this.currentView){
      this.remove(this.currentView)
    }

    this.currentView = currentView;
    this.add(currentView)

    //this.showPolygons([21, 37]);
  }

  showPolygons(indices){
    console.log('showPolygons', indices)
    let polygons = this.shape.getPolygons();
    let vertices = indices.reduce((accu, index) => {

      if(polygons.length > index){
          return accu.concat(polygons[index])
      }else{
        return accu;
      }

    }, []);

    if(this.highlightedVertices){
      this.remove(this.highlightedVertices);
    }

    this.highlightedVertices = this.createHighlightedVertices(vertices);
    this.add(this.highlightedVertices);
  }

  toMesh(){
   let group = new THREE.Group();
   group.add(this.createLines());
   return group;
  }

  createLines(){
    let geometry = this.toGeometryPlane();

    let material = new THREE.LineBasicMaterial( {
     vertexColors: THREE.VertexColors,
     color: 0xffffff
    } );

   var line = new THREE.LineSegments( geometry, material );
   return line;
  }

  createHighlightedVertices(highlightedVertices){
    let pointGeometry = new THREE.Geometry();
    let vertices = this.shape.getVertices2d();
    vertices.forEach((vertex, index) => {

      if(highlightedVertices.indexOf(index) != -1){
        pointGeometry.vertices.push(vertex);
        pointGeometry.colors.push(new THREE.Color(0xffffff));
      }

    })

     let points = new THREE.Points(pointGeometry, new THREE.PointsMaterial({
       sizeAttenuation: false,
       size: 10,
       vertexColors: THREE.VertexColors
     }));

     return points;
  }

  toGeometryPlane(){
    let combinedGeometry = new THREE.Geometry();
    let counter = 1;

    let palette = chroma.scale(['yellow', 'orangered']).mode('lch');

    let polygons = this.shape.getPolygons();
    let vertices2d = this.shape.getVertices2d();

    polygons.forEach((polygon, index) => {
      let currentColor = new THREE.Color(palette(index/polygons.length).hex());

      if(this.shape.isNonDegenerate(index) === false || polygon.length < 3){
        return;
      }

      let geometry = new THREE.Geometry();

      let polygonVertices = polygon.map(index => {
        return vertices2d[index].clone()
      });


      for(let i = 0; i< polygonVertices.length;i++){
        let index1 = polygonVertices[i];
        let index2 = polygonVertices[(i + 1)%polygonVertices.length];
        geometry.vertices.push(index1, index2);

        geometry.colors.push(currentColor, currentColor);
      }
      //geometry.translate(0,0, 10 * index);

      combinedGeometry.merge(geometry, new THREE.Matrix4());
      counter++
    })
    return combinedGeometry;
  }
}
