import * as THREE from 'three';
import utils from './../shared/utils';
import { OrigamiShape } from './shape';
import { OrigamiMesh } from './mesh';
import * as paperFormats from './core/paper-formats';
import { EventEmitter } from 'events';
import { OrigamiCreases } from './creases';

export default class Origami extends THREE.Object3D {
  public events$ = new EventEmitter();
  private creases: OrigamiCreases;

  private shape: OrigamiShape;
  private mesh: OrigamiMesh;
  private debugMarker;
  private selectedPoint2D;

    constructor(initialShape?: OrigamiShape) {
      super();
      this.shape = new OrigamiShape();
      this.creases = new OrigamiCreases(this.shape);

      this.init();
    }

    public getCreases() {
      return this.creases;
    }

    public getShape() {
      return this.shape;
    }

    public reset() {
      // this.shape.reset(paperFormats.dinA4());
      this.shape.reset(paperFormats.square());

      this.update();
    }

    public fold(plane: THREE.Plane, angle, index?) {
      if (this.selectedPoint2D) {
        // this.crease(plane);
        const polygonIndex = this.shape.model.findPolygon2D(this.selectedPoint2D);
        this.foldIndex(plane, angle, polygonIndex);
      }else if (index !== null && index !== undefined) {
        // this.crease(plane);
        this.foldIndex(plane, angle, index);
      }else {
        this.shape.fold(plane, angle);
      }
      this.update();
    }

    public foldIndex(plane: THREE.Plane, angle, index) {
      this.shape.foldIndex(plane, angle, index);
    }

    public reflect(plane: THREE.Plane, index?) {
      // debugger;
      if (this.selectedPoint2D) {
        // this.crease(plane);
        const polygonIndex = this.shape.model.findPolygon2D(this.selectedPoint2D);
        this.reflectIndex(plane, polygonIndex);
      }else if (index !== null && index !== undefined) {
       // this.crease(plane);
        this.reflectIndex(plane, index);
      }else {
        this.shape.reflect(plane);
      }

      this.update();
    }

    public reflectIndex(plane: THREE.Plane, index) {
      this.shape.reflectIndex(plane, index);
    }

    public crease(plane: THREE.Plane) {
      this.shape.crease(plane);
      this.update();
    }

    public showPoint2D(point) {
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
    private update() {
      this.mesh.update();
      this.events$.emit('update');
    }

    private init() {
      this.mesh = new OrigamiMesh(this.shape);
      this.add(this.mesh);
      this.reset();
    }

}
