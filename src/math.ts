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

export default { getProjectedPosition };
