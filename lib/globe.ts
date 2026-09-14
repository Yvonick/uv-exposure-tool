export type GeoPoint = { latitude: number; longitude: number };
export type Vector = { x: number; y: number; z: number };
const rad = Math.PI / 180;

export function project(point: GeoPoint, center: GeoPoint): Vector {
  const phi = point.latitude * rad, phi0 = center.latitude * rad;
  const delta = (point.longitude - center.longitude) * rad;
  return { x: Math.cos(phi) * Math.sin(delta),
    y: Math.cos(phi0) * Math.sin(phi) - Math.sin(phi0) * Math.cos(phi) * Math.cos(delta),
    z: Math.sin(phi0) * Math.sin(phi) + Math.cos(phi0) * Math.cos(phi) * Math.cos(delta) };
}

export function unproject(x: number, y: number, center: GeoPoint): GeoPoint | null {
  if (x * x + y * y > 1) return null;
  const z = Math.sqrt(Math.max(0, 1 - x * x - y * y)), phi0 = center.latitude * rad;
  const latitude = Math.asin(Math.max(-1, Math.min(1, y * Math.cos(phi0) + z * Math.sin(phi0)))) / rad;
  // Longitude is undefined at a pole; retain the view's meridian instead of amplifying tiny pointer errors.
  const lon = Math.abs(latitude) > 90 - 1e-7 ? center.longitude
    : center.longitude + Math.atan2(x, z * Math.cos(phi0) - y * Math.sin(phi0)) / rad;
  return { latitude, longitude: ((lon + 180) % 360 + 360) % 360 - 180 };
}

const xy = (p: Vector, radius: number, center: number) => `${(center + radius * p.x).toFixed(2)},${(center - radius * p.y).toFixed(2)}`;
export function visibleLine(points: GeoPoint[], view: GeoPoint, radius = 180, center = 300) {
  let path = '', previous: Vector | undefined;
  for (const point of points) {
    const current = project(point, view);
    if (previous && (previous.z >= 0) !== (current.z >= 0)) {
      const t = previous.z / (previous.z - current.z);
      const x = previous.x + t * (current.x - previous.x), y = previous.y + t * (current.y - previous.y);
      const magnitude = Math.hypot(x, y);
      const edge = { x: x / magnitude, y: y / magnitude, z: 0 };
      path += `${previous.z >= 0 ? 'L' : 'M'}${xy(edge, radius, center)}`;
    }
    if (current.z >= 0) path += `${previous && previous.z >= 0 ? 'L' : previous ? 'L' : 'M'}${xy(current, radius, center)}`;
    previous = current;
  }
  return path;
}

// In a frame where projected sunlight is from the right, the visible terminator
// is x = -sun.z * sqrt(1 - y²). The dark polygon closes along the left limb.
export function nightPath(sun: Vector, radius = 180) {
  const limb = `M0,${-radius}A${radius},${radius} 0 0 0 0,${radius}`;
  const rx = Math.min(1, Math.abs(sun.z)) * radius;
  return rx < 1e-8 ? `${limb}L0,${-radius}Z` : `${limb}A${rx},${radius} 0 0 ${sun.z > 0 ? 1 : 0} 0,${-radius}Z`;
}
