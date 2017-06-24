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

  let pnormal = plane.normal.toArray();
  let ppoint = plane.coplanarPoint().toArray();

  if (rawPlaneData) {
    pnormal = rawPlaneData.normal.toArray();
    ppoint = rawPlaneData.coplanar.toArray();
  }

  return line_plane_intersection(lpoint, ldir, ppoint, pnormal);
}

export function reflection(vertex, plane: THREE.Plane) {
  // This raw data comes fro mthe playbooks.
  // We need to work with the non normalized data to get the same results
  // As in the source application of the playbooks.
  const rawPlaneData = (plane as any).__raw;

  let pnormal = plane.normal.toArray();
  let ppoint = plane.coplanarPoint().toArray();
  let basepoint = line_plane_intersection(vertex.toArray(), pnormal, ppoint, pnormal);

  if (rawPlaneData) {
    pnormal = rawPlaneData.normal.toArray();
    ppoint = rawPlaneData.coplanar.toArray();
    basepoint = line_plane_intersection(
      vertex.toArray(),
      rawPlaneData.normal.toArray(),
      rawPlaneData.coplanar.toArray(),
      rawPlaneData.normal.toArray()
    );
  }

  const base = new THREE.Vector3().fromArray(basepoint);
  const direction = new THREE.Vector3().subVectors(base, vertex);

  return base.add(direction);
}
