import { Origami } from '../origami/origami';

import { Playbook } from './../playbook';
import * as playbooks from './../playbooks/index';
import { AnimatedOrigami } from './animated-origami';

import { OrigamiWorld } from './origami-world';
import * as THREE from 'three';

export class OrigamiDemo {
  private world: OrigamiWorld;

  constructor() {
    this.world = new OrigamiWorld();
    this.init();
  }

  private init() {
    this.test();
  }


  private test() {

    const origami = new Origami();
    const playbook = new Playbook(origami);
    playbook.set(playbooks.working.crane);
    playbook.play(-1);

    const shape = origami.getShape();
    const animatedOrigami = new AnimatedOrigami(shape);

    animatedOrigami.rotateZ(Math.PI);
    animatedOrigami.position.x = 200;
    animatedOrigami.position.y = 200;
    this.world.add(animatedOrigami);
  }
}