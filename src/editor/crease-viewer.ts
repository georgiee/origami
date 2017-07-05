import * as THREE from 'three';
import { OrigamiCreases } from './../origami/creases';

const PADDING = 20;
export class CreaseViewer {
  public creases: OrigamiCreases;
  private size: number;
  private objectSize: number;
  private scene: THREE.Scene;
  private camera;
  private rendererWidth;
  private rendererHeight;

  constructor(size = 400, creases) {
    this.creases = creases;
    this.size = size;
    this.objectSize = 400; // largest side of the object to display

    this.createScene();
    this.createCamera();

    this.scene.add(this.creases);

    this.handleMouseClick = this.handleMouseClick.bind(this);
    document.addEventListener('dblclick', this.handleMouseClick);
  }

  public render(renderer) {
    const rendererSize = renderer.getSize();
    this.rendererWidth = rendererSize.width;
    this.rendererHeight = rendererSize.height;

    const size = this.size;

    renderer.setScissorTest( true );
    renderer.setViewport(rendererSize.width - size - PADDING, rendererSize.height - size - PADDING, size, size);
    renderer.setScissor(rendererSize.width - size - PADDING, rendererSize.height - size - PADDING, size, size);
    renderer.render( this.scene, this.camera );
    renderer.setScissorTest( false );
  }

  private handleMouseClick({clientX, clientY}) {
    const x = clientX - this.rendererWidth + this.size + PADDING;
    const y = clientY - this.rendererHeight + this.size + PADDING;

    const ratio = this.objectSize / this.size;
    this.creases.selectPolygonWithPoint(new THREE.Vector2(x * ratio, y * ratio));
  }

  private createScene() {
    const scene = new THREE.Scene();
    scene.add( new THREE.AxisHelper( 50 ) );

    this.scene = scene;
  }

  private createCamera() {
    this.camera = new THREE.OrthographicCamera(0, this.objectSize, 0, this.objectSize, 0, 1000 );
  }

  private getLocalPoint(x, y) {
    const screenCoords = new THREE.Vector3(x, y, this.camera.near);
    const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(screenCoords, this.camera);

    const result = raycaster.ray.intersectPlane(plane);
    return result;
  }
}
