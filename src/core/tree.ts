
export class Node {
  private _left: Node = null;
  private _right: Node = null;
  public id;
  public split = -1;

  constructor(public data: any){}

  get left(){
    return this._left;
  }

  set left(value){
    this._left = value;
  }

  get right(){
    return this._right;
  }

  set right(value){
    this._right = value;
  }
}


export class Tree {
  private _root:Node = null;
  private size = 0;
  private splits = 0;

  constructor(){}

  splitInsert(data, newDataLeft, newDataRight){
    let node =  this.find(data);
    node.left = this.createNode(newDataLeft);
    node.left.id = 'f' + this.splits + ':1';
    node.left.split = this.splits;

    node.right = this.createNode(newDataRight);
    node.right.id = 'f' + this.splits + ':2';
    node.right.split = this.splits;

    this.splits += 1;
  }

  insert(data: any){
    let index = 0;

    if (this._root === null) {
        // Empty tree
        this._root = this.createNode(data);
        this._root.id = 'root';
        return index;
    }
  }

  *traversal() {
    function* nodeWalker(node) {
      if (node.left !== null) {
        yield * nodeWalker(node.left);
      }

      yield node;

      if (node.right !== null) {
        yield * nodeWalker(node.right);
      }
    }

    yield * nodeWalker(this._root);
  }

  find(data){
    for (let node of this.traversal()) {
      if(node.data == data){
        return node;
      }
    }

    return null;
  }

  createNode(data){
    let node = new Node(data);
    this.size+=1;

    return node;
  }

  toArray(){
    return Array.from(this.traversal());
  }
}
