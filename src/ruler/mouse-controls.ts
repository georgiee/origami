import * as THREE from 'three';
import * as Rx from 'rxjs';

const mouseUp$ = Rx.Observable.fromEvent(document, 'mouseup');
const mouseDown$ = Rx.Observable.fromEvent(document, 'mousedown');
const mouseMove$ = Rx.Observable
  .fromEvent(document, 'mousemove')

const mouseDragRuler = mouseDown$
  .flatMap(function(){
    return mouseMove$.map((event: any) => {
      return { x: event.clientX, y: event.clientY};
    })
  })
  .auditTime(100)
  .takeUntil(mouseUp$);


export default class MouseControls extends THREE.EventDispatcher {
  private drag;
  constructor(){
    super();

    this.handleMouseDown = this.handleMouseDown.bind(this);
    this.handleMouseUp = this.handleMouseUp.bind(this);
  }

  enable(){
    document.addEventListener('mousedown', this.handleMouseDown);
    document.addEventListener('mouseup', this.handleMouseUp);

    this.drag = mouseDragRuler.subscribe(res => {
      this.dispatchEvent({type:'move', x: res.x, y: res.y})

    })
  }

  disable(){
    document.removeEventListener('mousedown', this.handleMouseDown);
    document.removeEventListener('mouseup', this.handleMouseUp);

    if(this.drag){
      this.drag.unsubscribe();
    }
  }

  handleMouseDown(event){
    console.log('down')
    let { clientX, clientY } = event;
    this.dispatchEvent({type:'start', x: clientX, y: clientY})
  }

  handleMouseUp(event){
    let { clientX, clientY } = event;
    this.dispatchEvent({type:'complete', x: clientX, y: clientY})
  }
}
