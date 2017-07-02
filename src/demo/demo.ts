import { Origami } from '../origami/origami';

import { Playbook } from './../playbook';
import * as playbooks from './../playbooks/index';
import { AnimatedOrigami } from './animated-origami';

import { OrigamiWorld } from './origami-world';
import * as THREE from 'three';
import * as test01 from './test/01-animate-geoemtry-vector';

export class OrigamiDemo {
  private world: OrigamiWorld;

  constructor() {
    this.world = new OrigamiWorld();
    this.init();
  }

  private init() {
    // this.test1();
    this.test2();
  }

  private test2() {
    test01.run(this.world);
  }

  private test1() {
    const origami = new Origami();
    const playbook = new Playbook(origami);
    playbook.set(playbooks.working.crane);
    playbook.play(2);

    const shape = origami.getShape();
    const animatedOrigami = new AnimatedOrigami(shape);

    animatedOrigami.rotateZ(Math.PI);
    animatedOrigami.position.x = 200;
    animatedOrigami.position.y = 200;
    this.world.add(animatedOrigami);
  }
}