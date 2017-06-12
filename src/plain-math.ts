import * as THREE from 'three';

export function line_plane_intersection(lpoint, ldir, ppoint, pnormal) {
  const D = ppoint[0] * pnormal[0] + ppoint[1] * pnormal[1] + ppoint[2] * pnormal[2];
  const X = lpoint[0];
  const Y = lpoint[1];
  const Z = lpoint[2];
  const U = ldir[0];
  const V = ldir[1];
  const W = ldir[2];
  const A = pnormal[0];
  const B = pnormal[1];
  const C = pnormal[2];
  const t = -(A * X + B * Y + C * Z - D) / (A * U + B * V + C * W);
  return [ X + t * U, Y + t * V, Z + t * W];
}

export function linePlaneIntersection(point, dir, plane) {
  const lpoint = point.toArray();
  const ldir = dir.toArray();

  const rawPlaneData = (plane as any).__raw;
  const pnormal = plane.normal.toArray();
  const ppoint = plane.coplanarPoint().toArray();

  return line_plane_intersection(lpoint, ldir, ppoint, pnormal);
}

export function reflection(vertex, plane: THREE.Plane) {
  const rawPlaneData = (plane as any).__raw;

  const pnormal = plane.normal.toArray();
  const ppoint = plane.coplanarPoint().toArray();

  const basepoint = line_plane_intersection(vertex.toArray(), pnormal, ppoint, pnormal);
  const basepoint2 = line_plane_intersection(
    vertex.toArray(),
    rawPlaneData.normal.toArray(),
    rawPlaneData.coplanar.toArray(),
    rawPlaneData.normal.toArray()
  );

  const base = new THREE.Vector3().fromArray(basepoint2);
  const direction = new THREE.Vector3().subVectors(base, vertex);

  return base.add(direction);
}
