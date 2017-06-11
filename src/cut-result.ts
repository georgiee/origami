export class CutResult {
  private newpoly1;
  private newpoly2;
  private cutpolygonNodes;
  private newVertices;

  constructor({newpoly1 = [], newpoly2 = [], cutpolygonNodes = [], newVertices = []}) {
    this.newpoly1 = newpoly1;
    this.newpoly2 = newpoly2;
    this.cutpolygonNodes = cutpolygonNodes;
    this.newVertices = newVertices;
  }

  public expandIndex(baseSize) {
    return (object) => {
      if (object.added !== undefined) {
        return object.added + baseSize; // expand
      } else {
        return object;
      }
    };
  }

  // get through all lists and search for special format the references local indices, expand them to global
  public updateReferences(baseSize) {
    this.newpoly1 = this.newpoly1.map(this.expandIndex(baseSize));
    this.newpoly2 = this.newpoly2.map(this.expandIndex(baseSize));
    this.cutpolygonNodes = this.cutpolygonNodes.map( (node) =>
      Object.assign(node, {result: node.result.added + baseSize}
    ));
  }
}
