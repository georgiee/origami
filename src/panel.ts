import * as dat from 'dat.gui/build/dat.gui';
const guiData = {};

let attached = false;
let gui;
let origami;
let currentPlane;


function crease(){
  origami.crease(currentPlane);
}

function fold(){
  origami.fold(currentPlane, properties.angle);
}

function reflect(){
  origami.reflect(currentPlane);
}

function center(){
  origami.center();
}

let methods = { crease, fold, reflect, center };

let properties = {
  angle: 0
}
export function create(){
  let gui = attach();
}

export function initOrigami(instance){
  origami = instance
  let ruler = origami.getRuler();

  ruler.addEventListener('completed', (event:any) => {
    currentPlane = event.plane;
  });

  gui.add(properties, 'angle', 0, 360, 15).name('Angle');

  gui.add(methods, 'crease').name('Crease');
  gui.add(methods, 'reflect').name('Reflect');
  gui.add(methods, 'fold').name('Fold');
  gui.add(methods, 'center').name('Center');
}

function attach(){
  if(attached) return gui;

  gui = new dat.GUI({ autoPlace: true });
  //document.body.appendChild(gui.domElement);
  attached = true;

  return gui;
}


export {gui};
