import * as THREE from 'three';
import { OrigamiCreases } from './origami-creases';

const PADDING = 20;
export class CreaseViewer {
  private size: number;
  private objectSize: number;
  private scene: THREE.Scene;
  private camera;
  private creases: OrigamiCreases;

  private rendererWidth;
  private rendererHeight;
  constructor(size = 400) {
    this.size = size;
    this.objectSize = 400; //largest side of the object to display

    this.createScene();
    this.createCamera();
    this.createCreaseObject();

    this.handleMouseClick = this.handleMouseClick.bind(this);
    document.addEventListener('dblclick', this.handleMouseClick);
  }

  handleMouseClick({clientX, clientY}){
    let x = clientX - this.rendererWidth + this.size + PADDING;
    let y = clientY - this.rendererHeight + this.size + PADDING;

    let ratio = this.objectSize/this.size;
    this.creases.selectPolygonWithPoint(new THREE.Vector2(x * ratio, y * ratio));
  }

  getObject() {
    return this.creases;
  }

  createCreaseObject(){
    this.creases = new OrigamiCreases();
    this.scene.add(this.creases);
  }

  setSape(shape){
    this.creases.shape = shape;
  }

  createScene(){
    let scene = new THREE.Scene();
    scene.add( new THREE.AxisHelper( 50 ) );

    this.scene = scene;
  }

  createCamera(){
    this.camera = new THREE.OrthographicCamera(0, this.objectSize, 0, this.objectSize, 0, 1000 );
  }

  getLocalPoint(x, y){
    let screenCoords = new THREE.Vector3(x, y, this.camera.near)
    let plane = new THREE.Plane(new THREE.Vector3(0,0,1), 0);

    let raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(screenCoords, this.camera);

    let result = raycaster.ray.intersectPlane(plane)
    return result;
  }

  render(renderer){
    let rendererSize = renderer.getSize();
    this.rendererWidth = rendererSize.width;
    this.rendererHeight = rendererSize.height;

    let size = this.size;

    renderer.setScissorTest( true );
    renderer.setViewport(rendererSize.width - size - PADDING, PADDING, size, size);
    renderer.setScissor(rendererSize.width - size - PADDING, PADDING, size, size);
    renderer.render( this.scene, this.camera );
    renderer.setScissorTest( false );
  }
}
