import * as THREE from 'three';
import World from './world';
import OrigamiMesh from './origami-mesh';
import Origami from './origami';
import * as Panel from './panel';
import { Playbook } from './playbook';
import * as playbooks from './playbooks/index';
import { testNewell } from './test-newell';

export class OrigamiApp {
  private world;
  private origami;

  constructor() {
    console.log('OrigamiApp');
    Panel.create();

    this.world = World.getInstance();

    this.build();
    this.test();
    Panel.initOrigami(this.origami);

    // testNewell(this.world);
    // console.log(THREE.ShapeUtils.triangulate([v1, v2, v3] as any, false));
  }

  public test() {
    const playbook = new Playbook(this.origami);
    playbook.set(playbooks.testing.rose);

    playbook.play(-1);

    // plane.setFromNormalAndCoplanarPoint(new THREE.Vector3(200.0,0.0,0.0), new THREE.Vector3(200.0,0.0,0.0));
    // this.origami.reflect(new THREE.Plane(new THREE.Vector3(1,0.0,0.0), 0));

    // let plane = new THREE.Plane(new THREE.Vector3(0.9097532379535408, 0.4151494261504506, 0), -251.30286847123514)
    // let plane = new THREE.Plane(new THREE.Vector3(1, 1, 0).normalize(), -200)
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0).normalize(), -200);
    // this.origami.ruler.show(plane);
    // this.origami.creasing.preview(plane);
    // this.origami.crease(plane);
    // plane = new THREE.Plane(new THREE.Vector3(0.8944271909999161, -0.44721359549995804, 0), 11.180339736142775)
    // this.origami.reflect(plane, 2);
    // this.origami.fold(plane, 90);

    // let ruler = this.origami.getRuler()
    // ruler.show(plane);
    // this.origami.foldIndex(plane, -90, 3);
  }

  private build() {
    const origami = new Origami(this.world);
    this.origami = origami;
    this.world.add(origami);

    const ruler = origami.getRuler();
    window.addEventListener('keyup', (event) => {
      if (event.key === 't') {
        ruler.enable();
      }
    });
    // 3d view
    // creases view
    // ruler
    // debug panel
    // automation
  }
}
