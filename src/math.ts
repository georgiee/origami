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
export default { getProjectedPosition, planeBetweenPoints };
