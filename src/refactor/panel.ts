import * as dat from 'dat.gui/build/dat.gui';
const guiData = {};

let attached = false;
let gui;
let origami;



function crease(){
  origami.crease();
}

function fold(){
  origami.fold(properties.angle);
}

function reflect(){
  origami.reflect();
}

let methods = { crease, fold, reflect };

let properties = {
  angle: 0
}
export function create(){
  let gui = attach();
}

export function initOrigami(instance){
  origami = instance
  gui.add(properties, 'angle', 0, 360, 15).name('Angle');

  gui.add(methods, 'crease').name('Crease');
  gui.add(methods, 'reflect').name('Reflect');
  gui.add(methods, 'fold').name('Fold');
}

function attach(){
  if(attached) return gui;

  gui = new dat.GUI({ autoPlace: true });
  //document.body.appendChild(gui.domElement);
  attached = true;

  return gui;
}


export {gui};
