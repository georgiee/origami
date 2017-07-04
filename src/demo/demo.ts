import { Origami } from '../origami/origami';

import { Playbook } from './../playbook';
import * as playbooks from './../playbooks/index';
import { AnimatedOrigami } from './animated-origami';

import { OrigamiWorld } from './origami-world';
import * as THREE from 'three';
import * as test01 from './test/01-origami-in-world';
import * as test02 from './test/02-animate-geometry-vector';
import * as test03 from './test/03-shadows-basics';
import * as test04 from './test/04-shadows-dynamic-mesh';
import * as test05 from './test/05-shadows-animated-mesh';

export class OrigamiDemo {
  private world: OrigamiWorld;

  constructor() {
    // this.world = new OrigamiWorld();
    this.init();
  }

  private init() {
    // test01.run(this.world);
    // test02.run(this.world);
    // test03.run();
    // test04.run();
    test05.run();
  }
}