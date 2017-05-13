import * as THREE from 'three';

export default class MouseControls extends THREE.EventDispatcher {
  constructor(){
    super();
    this.handleMouseDown = this.handleMouseDown.bind(this);
    this.handleMouseUp = this.handleMouseUp.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);
  }

  enable(){
    document.addEventListener('mousedown', this.handleMouseDown);
    document.addEventListener('mouseup', this.handleMouseUp);
  }

  disable(){
    document.removeEventListener('mousedown', this.handleMouseDown);
    document.removeEventListener('mouseup', this.handleMouseUp);
    document.removeEventListener('mousemove', this.handleMouseMove);
  }

  handleMouseDown(event){
    document.addEventListener('mousemove', this.handleMouseMove);
    let { clientX, clientY } = event;
    this.dispatchEvent({type:'start', x: clientX, y: clientY})
  }

  handleMouseUp(event){
    document.removeEventListener('mousemove', this.handleMouseMove);
    let { clientX, clientY } = event;
    this.dispatchEvent({type:'complete', x: clientX, y: clientY})
  }

  handleMouseMove(event){
    let { clientX, clientY } = event;
    this.dispatchEvent({type:'move', x: clientX, y: clientY})
  }
}
