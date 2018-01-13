/**
 * Created by amandaghassaei on 3/27/17.
 */


function initStaticSolver(){

    var nodes;
    var edges;
    var faces;
    var creases;
    var positions;

    var Q, C, Ctrans, F, F_rxn;
    var Ctrans_Q, Ctrans_Q_C;
    var numFreeEdges, numVerticesFree, numVerticesFixed, numFreeCreases;
    var indicesMapping, fixedIndicesMapping, freeEdgesMapping, freeCreasesMapping;

    function syncNodesAndEdges(){
        nodes = globals.model.getNodes();
        edges = globals.model.getEdges();
        faces = globals.model.getFaces();
        creases = globals.model.getCreases();

        positions = globals.model.getPositionsArray();

        setUpParams();
    }

    function solve(){
        updateMatrices();
        solveStep();
    }
    function reset(){
    }

    function pinv(A) { //for linearly ind rows
      var AT = numeric.transpose(A);
      return numeric.dot(AT, numeric.inv(numeric.dot(AT,A)));
    }

    function solveStep(){
        console.log("static solve");
        // if (fixedIndicesMapping.length == 0){//no boundary conditions
        //     var X = initEmptyArray(numVerticesFree*3);
        //     render(X);
        //     console.warn("no boundary conditions");
        //     return;
        // }

        var _F = F.slice();
        for (var i=0;i<_F.length;i++) {
            _F[i] += F_rxn[i];
        }
        var X = numeric.solve(Ctrans_Q_C, _F);
        // var sum = new THREE.Vector3();
        // for (var i=0;i<_F.length;i+=3){
        //     sum.x += _F[i];
        //     sum.y += _F[i+1];
        //     sum.z += _F[i+2];
        // }
        // console.log(sum);

        render(X);
    }

    function render(X){

        for (var i=0;i<numVerticesFree;i++){
            var index = indicesMapping[i];
            var nodePosition = new THREE.Vector3(X[3*i], X[3*i+1], X[3*i+2]);
            var nexPos = nodes[index].renderDelta(nodePosition);
            positions[3*index] = nexPos.x;
            positions[3*index+1] = nexPos.y;
            positions[3*index+2] = nexPos.z;
        }
        for (var i=0;i<numVerticesFixed;i++){//todo necessary?
            var index = fixedIndicesMapping[i];
            var nodePosition = new THREE.Vector3(0, 0, 0);
            var nexPos = nodes[index].render(nodePosition);
            positions[3*index] = nexPos.x;
            positions[3*index+1] = nexPos.y;
            positions[3*index+2] = nexPos.z;
        }
        for (var i=0;i<edges.length;i++){
            edges[i].render();
        }
    }

    function initEmptyArray(dim1, dim2, dim3){
        if (dim2 === undefined) dim2 = 0;
        if (dim3 === undefined) dim3 = 0;
        var array = [];
        for (var i=0;i<dim1;i++){
            if (dim2 == 0) array.push(0);
            else array.push([]);
            for (var j=0;j<dim2;j++){
                if (dim3 == 0) array[i].push(0);
                else array[i].push([]);
                for (var k=0;k<dim3;k++){
                    array[i][j].push(0);
                }
            }
        }
        return array;
    }

    function updateMatrices(){
        calcCsAndRxns();
        Ctrans = numeric.transpose(C);
        // console.log(Q);
        Ctrans_Q = numeric.dot(Ctrans, Q);
        Ctrans_Q_C = numeric.dot(Ctrans_Q, C);
    }

    function setUpParams(){

        indicesMapping = [];
        fixedIndicesMapping = [];
        freeEdgesMapping = [];
        freeCreasesMapping = [];

        for (var i=0;i<nodes.length;i++){
            if (nodes[i].fixed) fixedIndicesMapping.push(nodes[i].getIndex());//todo need this?
            else indicesMapping.push(nodes[i].getIndex());//todo push(i)
        }
        for (var i=0;i<edges.length;i++){
            if (edges[i].isFixed()) continue;
            freeEdgesMapping.push(i);
        }
        for (var i=0;i<creases.length;i++){
            freeCreasesMapping.push(i);
        }

        numVerticesFree = indicesMapping.length;
        numVerticesFixed = fixedIndicesMapping.length;
        numFreeEdges = freeEdgesMapping.length;
        numFreeCreases = freeCreasesMapping.length;


        //C = (edges + creases) x 3nodes
        //Q = (edges + creases) x (edges + creases)
        //Ctrans = 3nodes x (edges + creases)
        //disp = 1 x 3nodes

        Q = initEmptyArray(numFreeEdges+numFreeCreases, numFreeEdges+numFreeCreases);
        C = initEmptyArray(numFreeEdges+numFreeCreases, 3*numVerticesFree);
        calcQ();

        F = initEmptyArray(numVerticesFree*3);

        for (var i=0;i<numVerticesFree;i++){
            F[3*i] = 0;
            F[3*i+1] = 0;
            F[3*i+2] = 0;
        }

        updateMatrices();
    }

    function calcCsAndRxns(){
        F_rxn = initEmptyArray(numVerticesFree*3);
        for (var j=0;j<numFreeEdges;j++){
            var edge = edges[freeEdgesMapping[j]];
            var _nodes = edge.nodes;
            var edgeVector0 = edge.getVector(_nodes[0]);

            var length = edge.getOriginalLength();
            var diff = edgeVector0.length() - length;
            var rxnForceScale = globals.axialStiffness*diff/length;

            edgeVector0.normalize();
            if (!_nodes[0].fixed) {
                var i = indicesMapping.indexOf(_nodes[0].getIndex());
                C[j][3*i] = edgeVector0.x;
                C[j][3*i+1] = edgeVector0.y;
                C[j][3*i+2] = edgeVector0.z;
                F_rxn[3*i] -= edgeVector0.x*rxnForceScale;
                F_rxn[3*i+1] -= edgeVector0.y*rxnForceScale;
                F_rxn[3*i+2] -= edgeVector0.z*rxnForceScale;
            }
            if (!_nodes[1].fixed) {
                var i = indicesMapping.indexOf(_nodes[1].getIndex());
                C[j][3*i] = -edgeVector0.x;
                C[j][3*i+1] = -edgeVector0.y;
                C[j][3*i+2] = -edgeVector0.z;
                F_rxn[3*i] += edgeVector0.x*rxnForceScale;
                F_rxn[3*i+1] += edgeVector0.y*rxnForceScale;
                F_rxn[3*i+2] += edgeVector0.z*rxnForceScale;
            }
        }

        var geometry = globals.model.getGeometry();
        var indices = geometry.index.array;
        var normals = [];

        //compute all normals
        var cb = new THREE.Vector3(), ab = new THREE.Vector3();
        for (var j=0;j<indices.length;j+=3){
            var index = 3*indices[j];
            var vA = new THREE.Vector3(positions[index], positions[index+1], positions[index+2]);
            index = 3*indices[j+1];
            var vB = new THREE.Vector3(positions[index], positions[index+1], positions[index+2]);
            index = 3*indices[j+2];
            var vC = new THREE.Vector3(positions[index], positions[index+1], positions[index+2]);
            cb.subVectors( vC, vB );
            ab.subVectors( vA, vB );
            cb.cross( ab );

            cb.normalize();
            normals.push(cb.clone());
        }


        // for (var j=0;j<numFreeCreases;j++){
        //     var crease = creases[freeCreasesMapping[j]];
        //     var normal1 = normals[crease.face1Index];
        //     var normal2 = normals[crease.face2Index];
        //     var dotNormals = normal1.dot(normal2);
        //     if (dotNormals < -1.0) dotNormals = -1.0;
        //     else if (dotNormals > 1.0) dotNormals = 1.0;
        //
        //     var creaseVector = crease.getVector().normalize();
        //     //https://math.stackexchange.com/questions/47059/how-do-i-calculate-a-dihedral-angle-given-cartesian-coordinates
        //     var theta = Math.atan2((normal1.clone().cross(creaseVector)).dot(normal2), dotNormals);
        //
        //     var diff = theta - globals.creasePercent*crease.targetTheta;
        //     var rxnForceScale = crease.getK()*diff;
        //
        //     var partial1, partial2;
        //
        //     if (!crease.node1.fixed){
        //         var i = indicesMapping.indexOf(crease.node1.getIndex());
        //         var dist = crease.getLengthToNode1();
        //         var partial1 = normal1.clone().divideScalar(dist);
        //         C[j+numFreeEdges][3*i] = partial1.x;
        //         C[j+numFreeEdges][3*i+1] = partial1.y;
        //         C[j+numFreeEdges][3*i+2] = partial1.z;
        //         F_rxn[3*i] -= partial1.x*rxnForceScale;
        //         F_rxn[3*i+1] -= partial1.y*rxnForceScale;
        //         F_rxn[3*i+2] -= partial1.z*rxnForceScale;
        //     }
        //     if (!crease.node2.fixed){
        //         var i = indicesMapping.indexOf(crease.node2.getIndex());
        //         var dist = crease.getLengthToNode2();
        //         var partial2 = normal2.clone().divideScalar(dist);
        //         C[j+numFreeEdges][3*i] = partial2.x;
        //         C[j+numFreeEdges][3*i+1] = partial2.y;
        //         C[j+numFreeEdges][3*i+2] = partial2.z;
        //         F_rxn[3*i] -= partial2.x*rxnForceScale;
        //         F_rxn[3*i+1] -= partial2.y*rxnForceScale;
        //         F_rxn[3*i+2] -= partial2.z*rxnForceScale;
        //     }
        //     var creaseNodes = crease.edge.nodes;
        //     for (var k=0;k<creaseNodes.length;k++){
        //         var node = creaseNodes[k];
        //         if (node.fixed) continue;
        //         var i = indicesMapping.indexOf(node.getIndex());
        //
        //         C[j+numFreeEdges][3*i] = -(partial1.x+partial2.x)/2;
        //         C[j+numFreeEdges][3*i+1] = -(partial1.y+partial2.y)/2;
        //         C[j+numFreeEdges][3*i+2] = -(partial1.z+partial2.z)/2;
        //         F_rxn[3*i] += (partial1.x+partial2.x)/2*rxnForceScale;
        //         F_rxn[3*i+1] += (partial1.y+partial2.y)/2*rxnForceScale;
        //         F_rxn[3*i+2] += (partial1.z+partial2.z)/2*rxnForceScale;
        //     }
        // }
    }

    function calcQ() {
        for (var i = 0; i < numFreeEdges; i++) {
            Q[i][i] = edges[freeEdgesMapping[i]].getK();
        }
        for (var i = 0; i < numFreeCreases; i++) {
            var crease = creases[freeCreasesMapping[i]];
            Q[numFreeEdges+i][numFreeEdges+i] = crease.getK();
        }
    }


    return {
        syncNodesAndEdges: syncNodesAndEdges,
        solve:solve,
        reset:reset
    }
}