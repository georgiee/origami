import * as THREE from 'three';
import { OrigamiShape } from './../../origami/shape';

import { throttle } from 'lodash';
import utils from './../../shared/utils';
import World from './../../shared/world';

const THRESHOLD = 0.05;
const THRESHOLD_CLEAR = 0.1;

export class Snapper extends THREE.Object3D {
  private mouseScreenCoords = new THREE.Vector3();
  private point: THREE.Points;
  private lastSnappedPoint: THREE.Vector3;
  private lastSnappedPointIndex = -1;

  constructor(private shape: OrigamiShape ) {
    super();

    this.handleMouseMove = throttle(this.handleMouseMove.bind(this), 100);

    const geometry = new THREE.Geometry();
    geometry.vertices.push(new THREE.Vector3(0, 0, 0));

    const material = new THREE.PointsMaterial({
      sizeAttenuation: false,
      size: 10, color: 0xffb6c1});
    this.point = new THREE.Points( geometry, material );
    this.add( this.point );

    this.hide();
  }

  public start() {
    document.addEventListener('mousemove', this.handleMouseMove);
  }

  public show() {
    this.point.visible = true;
  }

  public hide() {
    this.point.visible = false;
  }

  public hasSnaped() {
    return this.lastSnappedPoint !== null;
  }

  public getSnappedPosition() {
    return this.lastSnappedPoint;
  }

  public findNearestFromMouse(clientX, clientY) {
    const world = World.getInstance();
    const {x, y} = utils.mouseToDeviceCoordinates(clientX, clientY, world.domElement);

    this.findNearestVertex(x, y);
  }

  private handleMouseMove({clientX, clientY}) {
    this.findNearestFromMouse(clientX, clientY);

    if (this.hasSnaped()) {
      this.show();
    } else {
      this.hide();
    }
  }

  private findNearestVertex(screenX, screenY) {
    const world = World.getInstance();
    const vertices = this.shape.model.getAlignmentPoints();
    const screenCoords = new THREE.Vector3(screenX, screenY, 0);
    const matched = false;

    this.lastSnappedPoint = null;

    for (const vertex of vertices){
      const projection = vertex.clone().project(world.camera);
      projection.z = 0;

      const distance = projection.distanceTo(screenCoords);

      if (distance < THRESHOLD) {
        this.updatePosition(vertex);
        this.lastSnappedPoint = vertex.clone();
        this.lastSnappedPointIndex = this.shape.model.data
          .getVertices().indexOf(vertex);

        break;
      }
    }
  }

  private updatePosition(point) {
    const geometry: any = this.point.geometry;
    const v = geometry.vertices[geometry.vertices.length - 1];
    v.copy(point);

    geometry.verticesNeedUpdate = true;
  }

}
