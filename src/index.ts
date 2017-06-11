import * as Panel from './panel';
import { OrigamiApp } from './origami-app';

function run(){
  Panel.create();
  const origamiApp = new OrigamiApp();
}

window.addEventListener('load', run)
