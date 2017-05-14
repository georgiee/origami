import * as THREE from 'three';

function getProjectedPosition(x, y, camera){
  let cameraNormal = camera.getWorldDirection();
  let v = new THREE.Vector3(x, y, -1); //on near plane
  v.unproject(camera);

  let v2 = new THREE.Vector3(x, y, 1); //on near plane
  v2.unproject(camera);

  let v3 = new THREE.Vector3().lerpVectors(v, v2, 0.01);

  return v3;
}

function planeBetweenPoints(plane: THREE.Plane, v1, v2){
  let delta1 = plane.distanceToPoint(v1);
  let delta2 = plane.distanceToPoint(v2);

  return Math.sign(delta1) != Math.sign(delta2);
}



function planeBetweenPoints2(plane: THREE.Plane, v1, v2){
  const EPSILON = 0.0001;

  let delta1 = plane.distanceToPoint(v1);
  if(Math.abs(delta1) < EPSILON){
      delta1 = 0;
  }

  let delta2 = plane.distanceToPoint(v2);

  if(Math.abs(delta2) < EPSILON){
      delta2 = 0;
  }

  if(delta1 == 0 || delta2 == 0){
    //at least one vertex plane, skip
    return false;
  }

  return Math.sign(delta1) != Math.sign(delta2);
}

// https://github.com/substack/point-in-polygon
export function polygonContains(point, vs){
  var x = point[0], y = point[1];

  var inside = false;
  for (var i = 0, j = vs.length - 1; i < vs.length; j = i++) {
      var xi = vs[i][0], yi = vs[i][1];
      var xj = vs[j][0], yj = vs[j][1];

      var intersect = ((yi > y) != (yj > y))
          && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
  }

  return inside;
}

// https://github.com/scottglz/distance-to-line-segment/blob/master/index.js
export function distanceSquaredToLineSegment(lx1, ly1, lx2, ly2, px, py) {
 var ldx = lx2 - lx1,
     ldy = ly2 - ly1,
     lineLengthSquared = ldx*ldx + ldy*ldy;
 return distanceSquaredToLineSegment2(lx1, ly1, ldx, ldy, lineLengthSquared, px, py);
}

export function distanceSquaredToLineSegment2(lx1, ly1, ldx, ldy, lineLengthSquared, px, py) {
   var t; // t===0 at line pt 1 and t ===1 at line pt 2
   if (!lineLengthSquared) {
      // 0-length line segment. Any t will return same result
      t = 0;
   }
   else {
      t = ((px - lx1) * ldx + (py - ly1) * ldy) / lineLengthSquared;

      if (t < 0)
         t = 0;
      else if (t > 1)
         t = 1;
   }

   var lx = lx1 + t * ldx,
       ly = ly1 + t * ldy,
       dx = px - lx,
       dy = py - ly;
   return dx*dx + dy*dy;
}
export default { getProjectedPosition, planeBetweenPoints, planeBetweenPoints2 };
