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
function resetCamera(){
  origami.resetCamera();
}
function reset() {
  origami.reset();
}

let methods = { crease, fold, reflect, center, resetCamera, reset };

let properties = {
  angle: 0,
  progress: 0
}

const controller = <any>{

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


}

function updateDisplay(){
  for (var i = 0; i < Object.keys(gui.__folders).length; i++) {
      var key = Object.keys(gui.__folders)[i];
      for (var j = 0; j < gui.__folders[key].__controllers.length; j++ )
      {
          gui.__folders[key].__controllers[j].updateDisplay();
      }
  }
}

function init(){
  gui = new dat.GUI({ autoPlace: false });

  const origamiFolder = gui.addFolder('Origami');
  origamiFolder.closed = true;
  origamiFolder.add(properties, 'angle', -180, 180, 15).name('Angle');
  origamiFolder.add(methods, 'crease').name('Crease');
  origamiFolder.add(methods, 'reflect').name('Reflect');
  origamiFolder.add(methods, 'fold').name('Fold');
  origamiFolder.add(methods, 'center').name('Center');
  origamiFolder.add(methods, 'resetCamera').name('Reset Camera');
  origamiFolder.add(methods, 'reset').name('Reset');
}

init();

function attach(){
  if(attached) return gui;
  document.body.appendChild(gui.domElement);
  gui.domElement.styles = {right:0, top:0, position: 'absolute'}
  attached = true;

  return gui;
}


export {gui, controller, updateDisplay};
