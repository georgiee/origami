function createPlaneWithNormal(){
  var normal = new THREE.Vector3(1,1,0);
  var centroid = new THREE.Vector3(0,50,0);
  var plane = new THREE.Plane();
  plane.setFromNormalAndCoplanarPoint(normal, centroid).normalize();

  // Create a basic rectangle geometry
  var planeGeometry = new THREE.PlaneGeometry(100, 100);

  // Align the geometry to the plane
  var coplanarPoint = plane.coplanarPoint();
  var focalPoint = new THREE.Vector3().copy(coplanarPoint).add(plane.normal);
  planeGeometry.lookAt(focalPoint);
  planeGeometry.translate(coplanarPoint.x, coplanarPoint.y, coplanarPoint.z);

  // Create mesh with the geometry
  var planeMaterial = new THREE.MeshLambertMaterial({color: 0xffff00, side: THREE.DoubleSide});
  var dispPlane = new THREE.Mesh(planeGeometry, planeMaterial);

  let obj = new THREE.Object3D()
  obj.add(dispPlane)

  var arrow = new THREE.ArrowHelper(
							plane.normal,
							coplanarPoint,
							100,0xFF3333);

  obj.add(arrow);

  return obj;
}

export default { createPlaneWithNormal }
