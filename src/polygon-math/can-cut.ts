export function canCut(index, plane){
    if(this.isNonDegenerate(index)){
      let inner = false;
      let outer = false;
      let vertices = this.polygonToVertices(this.getPolygon(index));
      let normal = plane.normal;
      let coplanarPoint = plane.coplanarPoint();

      for(let i = 0; i < vertices.length; i++){
        let vertex = vertices[i];
        let normalLength = Math.sqrt(Math.max(1, normal.lengthSq()));
        //TODO: Same as distanceToPlane?
        if(vertex.dot(normal)/normalLength > coplanarPoint.dot(normal)/normalLength + 0.00000001){
          inner = true;
        }else if(vertex.dot(normal)/normalLength < coplanarPoint.dot(normal)/normalLength - 0.00000001){
          outer = true;
        }

        if (inner && outer) {
            return true;
        }

      };
    }

    return false;
  }