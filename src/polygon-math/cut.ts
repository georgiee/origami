import { canCut } from './can-cut';

export function cut(index, plane){
    //console.info('cutPolygon------>', index)

    if(this.canCut(index, plane) === false){
      //console.warn('cant cut polygon #', index);
      return false;
    }

    let polygonIndices = this.getPolygon(index);
    let polygonVertices = this.polygonToVertices(polygonIndices);

    let ppoint = plane.coplanarPoint();
    let pnormal = plane.normal;

    let newpoly1 = [];
    let newpoly2 = [];

    for (let i = 0; i < polygonVertices.length; i++) {
      let j = (i + 1) % polygonVertices.length; //following vertex

      let vertex = polygonVertices[i];
      let vertex2 = polygonVertices[j];

      let distance = plane.distanceToPoint(vertex);

      //if it's on the cutting plane it belongs to both new polygons

      if(Math.abs(distance) < 0.001){
        newpoly1.push(polygonIndices[i]);
        newpoly2.push(polygonIndices[i]);

      }else {
        let sideA = vertex.dot(pnormal);
        let sideB = ppoint.dot(pnormal);

        if(sideA > sideB){
          newpoly1.push(polygonIndices[i]);
        }else{
          newpoly2.push(polygonIndices[i]);
        }

        let divided = math.planeBetweenPoints2(plane,vertex,vertex2);

        if(divided){
          //was this pair cutted before? reuse
          let freshcut = true;

          for(let node of this.cutpolygonNodes){
            if(node[0] == polygonIndices[i] && node[1] == polygonIndices[j]){
              newpoly1.push(node[2]);
              newpoly2.push(node[2]);
              freshcut = false;
              break;
            }else if(node[0] == polygonIndices[j] && node[1] == polygonIndices[i]){
              newpoly1.push(node[2]);
              newpoly2.push(node[2]);
              freshcut = false;
              break;
            }
          }


          let direction = vertex.clone().sub(vertex2);
          let line = new THREE.Line3(vertex, vertex2);

          if(freshcut && plane.intersectsLine(line)){
            let ipoint = vertex.clone();
            let meet = plane.intersectLine(line);
            this.addVertex(meet);

            let weight1 = meet.clone().sub(vertex2).length();
            let weight2 = meet.clone().sub(vertex).length();


            let vertex2D_1  = this.getVertex2d(polygonIndices[i]);
            let vertex2D_2  = this.getVertex2d(polygonIndices[j]);
            let vector2d = new THREE.Vector3(
              (vertex2D_1.x * weight1 + vertex2D_2.x * weight2)/(weight1 + weight2),
              (vertex2D_1.y * weight1 + vertex2D_2.y * weight2)/(weight1 + weight2),
              0
            )
            this.addVertex2D(vector2d);

            newpoly1.push(this.model.verticesCount - 1);
            newpoly2.push(this.model.verticesCount - 1);
            this.cutpolygonNodes.push([polygonIndices[i],polygonIndices[j], this.model.verticesCount - 1 ])
          }

        }
      }
    }

    this.cutpolygonPairs.push([index, this.getPolygons().length]);
    this.lastCutPolygons.push(this.getPolygon(index));
    
    this.model.setPolygon(index, newpoly1)
    this.setPolygon(index, newpoly1);
    this.model.addPolygon(newpoly2);
  }