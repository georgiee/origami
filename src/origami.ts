import * as THREE from 'three';
import utils from './utils';
import { OrigamiShape } from './origami-shape';
import OrigamiMesh from './origami-mesh';
import {OrigamiCreases} from './origami-creases';
import Ruler from './ruler/ruler';
import {World, getInstance as getWorld } from './world';
import {Snapper} from './ruler/snapper';
import * as Panel from './panel';
import { squarePaperModel } from './paper-formats';

export default class Origami extends THREE.Object3D {
  private shape: OrigamiShape;
  private mesh: OrigamiMesh;
  private creasing: OrigamiCreases;
  private ruler: Ruler;
  private currentPlane: THREE.Plane;
  private debugMarker;
  private selectedPoint2D;
    constructor(private world: World, initialShape?: OrigamiShape) {
      super();
      this.shape = new OrigamiShape();
      this.init();
    }
    
    public getRuler() {
      return this.ruler;
    }

    public highlightPolygon(index) {
      this.creasing.showPolygons([index]);
    }

    public stats() {
        console.info('Polygon Count: ', this.shape.model.getPolygons().length);
        console.info('Vertices Count: ', this.shape.getVertices().length);
    }

    public reset() {
      this.shape.reset(squarePaperModel.clone());
      this.ruler.reset();

      this.update();
    }
    public resetCamera() {
      const world = getWorld();
      world.resetCamera();
    }

    public center() {
      const world = getWorld();
      world.center(this.mesh.getWorldCenter());
    }

    public fold(plane: THREE.Plane, angle, index?) {
      if (this.selectedPoint2D) {
        // this.crease(plane || this.currentPlane);
        const polygonIndex = this.shape.model.findPolygon2D(this.selectedPoint2D);
        this.foldIndex(plane || this.currentPlane, angle, polygonIndex);
      }else if (index) {
        // this.crease(plane || this.currentPlane);
        this.foldIndex(plane || this.currentPlane, angle, index);
      }else {
        this.shape.fold(plane || this.currentPlane, angle);
      }
      this.update();
    }

    public foldIndex(plane: THREE.Plane, angle, index) {
      this.shape.foldIndex(plane || this.currentPlane, angle, index);
    }

    public reflect(plane: THREE.Plane, index?) {
      // debugger;
      if (this.selectedPoint2D) {
        // this.crease(plane || this.currentPlane);
        const polygonIndex = this.shape.model.findPolygon2D(this.selectedPoint2D);
        this.reflectIndex(plane || this.currentPlane, polygonIndex);
      }else if (index !== null) {
       // this.crease(plane || this.currentPlane);
        this.reflectIndex(plane || this.currentPlane, index);
      }else {
        this.shape.reflect(plane || this.currentPlane);
      }
      
      this.update();
    }

    public reflectIndex(plane: THREE.Plane, index) {
      this.shape.reflectIndex(plane || this.currentPlane, index);
    }

    public crease(plane: THREE.Plane) {
      this.shape.crease(plane || this.currentPlane);
      this.update();
    }

    private update() {
      this.mesh.update();
      this.creasing.update();
    }

    private initRuler() {
      const snapper = new Snapper(this.shape);
      this.add(snapper);

      snapper.start();

      this.ruler = new Ruler(this.world, snapper);
      this.ruler.addEventListener('enabled', () => {
        this.world.controls.enabled = false;
      });

      this.ruler.addEventListener('disabled', () => {
        this.world.controls.enabled = true;
      });

      this.ruler.addEventListener('completed', (event: any) => {
        this.currentPlane = event.plane;
      });

      this.ruler.addEventListener('update', (event: any) => {
        this.creasing.preview(event.plane);
      });
    }

    private handlePolygonSelected({point}) {
      this.selectedPoint2D = point;
      let polygonIndex = -1;

      if (point) {
        polygonIndex = this.shape.model.findPolygon2D(this.selectedPoint2D);
      }

      if (polygonIndex < 0) {
        this.remove(this.debugMarker);
      }else {
        if (!this.debugMarker) {
          this.debugMarker = utils.createSphere();
        }
        this.add(this.debugMarker);

        const result = this.shape.model.getPointOnOrigami(point);
        this.debugMarker.position.copy(result);
      }

    }

    get camera(){
      return this.world.camera;
    }

    private init() {
      this.initRuler();

      this.mesh = new OrigamiMesh(this.shape);

      this.creasing = this.world.creaseViewer.getObject();
      this.creasing.shape = this.shape;

      this.creasing.addEventListener('polygon-selected', this.handlePolygonSelected.bind(this));

      this.add(this.mesh);
      this.add(this.ruler);

      this.reset();
    }

}
