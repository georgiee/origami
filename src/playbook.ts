import * as THREE from 'three';
import Origami from './origami';
import { gui, updateDisplay } from './panel';
import * as Rx from 'rxjs/Rx';
export class Playbook {

  constructor(private origami: Origami){
    this.initPanel();
  }

  private panelFolder;
  private instructions;
  private currentIndex = 0;
  private panelData;

  run(instructions, progress = 1){
    this.instructions = instructions;
    this.updatePanel();

    this.play();
  }

  play(count = 0){
    if(count === this.currentIndex) return;

    this.currentIndex = count;
    this.panelData.index = count;
    this.origami.reset();
    this.instructions.slice(0, this.currentIndex).forEach((data, index) => this.runCommand(data, index))

    updateDisplay();
  }

  getPlane({pnormal, ppoint}){
    let normal = new THREE.Vector3().fromArray(pnormal).normalize();
    let coplanar = new THREE.Vector3().fromArray(ppoint);
    let plane = new THREE.Plane().setFromNormalAndCoplanarPoint(normal, coplanar);

    return plane;
  }
  next(){
    this.play(this.currentIndex + 1);
  }

  previous(){
    this.play(this.currentIndex - 1);
  }

  updatePanel(){
    this.panelData = {
      index: 0
    }

    let progressController = this.panelFolder.add(this.panelData, 'index', 0, this.instructions.length - 1).listen();
    this.panelFolder.add(this, 'next');
    this.panelFolder.add(this, 'previous');

    var source = Rx.Observable.create(function (observer) {
      progressController.onChange(value => observer.next(value));
    });

    var subscription = source.debounceTime(250).subscribe(
      step => this.play(step)
    );

  }

  initPanel(){
    this.panelFolder = gui.addFolder('Playbook');
    this.panelFolder.closed = false;
  }

  runCommand(data, index){
    console.log(`run ${index + 1}/${this.instructions.length} - ${data.command} ${data.polygonIndex ? data.polygonIndex : ''}`);

    let ruler = this.origami.getRuler()
    let plane = this.getPlane(data);
    ruler.show(plane);

    switch(data.command){
      case "FOLD_REFLECTION": this.foldReflection(plane);break;
      case "FOLD_REFLECTION_P": this.foldReflection(plane, data.polygonIndex);break;
      case "FOLD_ROTATION_P": this.foldRotation(plane, data.phi, data.polygonIndex);break;
      case "FOLD_CREASE": this.crease(plane);break;
    }
  }
  foldRotation(plane, angle, index?){
    this.origami.fold(plane, angle, index )
    if(index){
      this.origami.highlightPolygon(index);
    }
  }

  foldReflection(plane, index = null){
    this.origami.reflect(plane, index);
    if(index){
      this.origami.highlightPolygon(index);
    }
  }
  
  crease(plane){
    this.origami.crease(plane);
  }
}
