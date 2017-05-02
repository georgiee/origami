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

export default { getProjectedPosition, planeBetweenPoints, planeBetweenPoints2 };
