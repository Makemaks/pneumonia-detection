import * as T from "three";
import type { BreathingFrame } from "./breathing";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

// Procedural anatomical illustration. Coordinates and textures are artwork,
// never derived from an uploaded X-ray or from the classifier's output.
const PROFILE = [
  [0, -1.17, 0, 0, 0.88],
  [0.045, -1.27, 0.34, 0.27, 0.88],
  [0.11, -1.32, 0.56, 0.43, 0.85],
  [0.2, -1.14, 0.65, 0.53, 0.81],
  [0.36, -0.7, 0.65, 0.58, 0.76],
  [0.53, -0.18, 0.58, 0.55, 0.7],
  [0.69, 0.35, 0.47, 0.47, 0.63],
  [0.83, 0.84, 0.33, 0.36, 0.57],
  [0.94, 1.22, 0.18, 0.22, 0.53],
  [1, 1.39, 0, 0, 0.52],
];
const clamp = T.MathUtils.clamp;
const smooth = T.MathUtils.smoothstep;
function profile(t: number) {
  let i = 0;
  while (i < PROFILE.length - 2 && t > PROFILE[i + 1]![0]!) i++;
  const a = PROFILE[i]!,
    b = PROFILE[i + 1]!;
  const v = (t - a[0]!) / (b[0]! - a[0]!);
  // Catmull-Rom interpolation avoids hard ridges between cross sections.
  return [1, 2, 3, 4].map((k) => {
    const p0 = PROFILE[Math.max(0, i - 1)]![k]!;
    const p1 = a[k]!,
      p2 = b[k]!,
      p3 = PROFILE[Math.min(PROFILE.length - 1, i + 2)]![k]!;
    return (
      0.5 *
      (2 * p1 +
        (-p0 + p2) * v +
        (2 * p0 - 5 * p1 + 4 * p2 - p3) * v * v +
        (-p0 + 3 * p1 - 3 * p2 + p3) * v * v * v)
    );
  });
}
function noise(x: number, y: number, z: number) {
  return (
    Math.sin(x * 15.1 + Math.sin(z * 7.3)) *
      Math.sin(y * 17.7 + z * 5.1) *
      0.5 +
    Math.sin(x * 37.2 + y * 11.3) * Math.cos(y * 31.4 - z * 28.5) * 0.3 +
    Math.cos(x * 83.1 - z * 63.7) * Math.sin(y * 76.1 + x * 12.2) * 0.2
  );
}
function lungSurface(side: number) {
  const positions: number[] = [],
    colors: number[] = [],
    indices: number[] = [];
  const rows = 128,
    columns = 160;
  const base = new T.Color("#be7978");
  const shade = new T.Color("#795258");
  const warm = new T.Color("#dfa59b");
  for (let row = 0; row <= rows; row++) {
    const t = row / rows;
    const [py, width, depth, center] = profile(t) as [
      number,
      number,
      number,
      number,
    ];
    for (let col = 0; col <= columns; col++) {
      const angle = (col / columns) * Math.PI * 2;
      const lateral = Math.cos(angle),
        front = Math.sin(angle);
      const medial = Math.max(0, -lateral);
      const frontFactor = smooth(-0.3, 0.6, front);
      const rightLung = side === -1;
      // The medial wall is flatter. The left anterior edge has a cardiac notch
      // and a small lingular projection below it; the right is wider/shorter.
      const notch = !rightLung
        ? 0.38 *
          Math.exp(-(((py + 0.04) / 0.47) ** 2)) *
          medial ** 3 *
          (0.65 + frontFactor * 0.35)
        : 0;
      const lingula = !rightLung
        ? -0.09 *
          Math.exp(-(((py + 0.67) / 0.19) ** 2)) *
          medial ** 2 *
          frontFactor
        : 0;
      let outward =
        center +
        lateral * width * (rightLung ? 1.04 : 0.94) * (lateral < 0 ? 0.73 : 1) +
        notch +
        lingula;
      let y = py * (rightLung ? 0.955 : 1.02);
      let z = front * depth * (rightLung ? 1 : 0.96);
      // Model pleural fissures as shallow grooves, rather than drawn-on stripes.
      const obliqueDistance = y + 1.27 * z + 0.14 - 0.52 * (outward - 0.75);
      const oblique = Math.exp(-((obliqueDistance / 0.029) ** 2));
      const horizontalDistance = y - 0.19 + 0.12 * z;
      const horizontal = rightLung
        ? Math.exp(-((horizontalDistance / 0.04) ** 2)) *
          smooth(-0.08, 0.16, obliqueDistance) *
          smooth(-0.32, 0.08, z)
        : 0;
      const fissure = Math.max(oblique, horizontal);
      const fine = noise(outward, y, z);
      const relief = 1 - fissure * 0.042 + fine * 0.004;
      outward = center + (outward - center) * relief;
      z *= relief;
      positions.push(outward * side, y, z);
      const color = base.clone().lerp(warm, clamp(fine * 0.25 + 0.16, 0, 0.35));
      color.lerp(
        shade,
        clamp(fissure * 0.6 + Math.max(0, -fine) * 0.13, 0, 0.72),
      );
      colors.push(color.r, color.g, color.b);
      if (row < rows && col < columns) {
        const a = row * (columns + 1) + col,
          b = a + columns + 1;
        // Mirroring changes the winding of the surface.
        if (side === 1) indices.push(a, b, a + 1, b, b + 1, a + 1);
        else indices.push(a, a + 1, b, b, a + 1, b + 1);
      }
    }
  }
  const geometry = new T.BufferGeometry();
  geometry.setAttribute("position", new T.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("color", new T.Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function tissueTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 256;
  const context = canvas.getContext("2d")!;
  const data = context.createImageData(256, 256);
  // A periodic microtexture adds restrained pleural grain without image assets.
  for (let y = 0; y < 256; y++)
    for (let x = 0; x < 256; x++) {
      const n =
        Math.sin(x * 0.81) * Math.sin(y * 0.73) +
        Math.sin(x * 1.61 + y * 0.41) * 0.45;
      const value = 128 + n * 27;
      const i = (y * 256 + x) * 4;
      data.data[i] = data.data[i + 1] = data.data[i + 2] = value;
      data.data[i + 3] = 255;
    }
  context.putImageData(data, 0, 0);
  const texture = new T.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = T.RepeatWrapping;
  return texture;
}

export function createLungModel() {
  const group = new T.Group();
  const lungs: T.Group[] = [];
  const surfaces: T.MeshPhysicalMaterial[] = [];
  const wires: T.Mesh[] = [];
  const flowPaths: { curve: T.CatmullRomCurve3; side: number }[] = [];
  const scanY = { value: 1.7 },
    scanStrength = { value: 0 };
  const scanColor = new T.Color("#8ff6df");
  const texture = tissueTexture();
  const cartilage = new T.MeshPhysicalMaterial({
    color: "#e3c7b0",
    roughness: 0.52,
    clearcoat: 0.18,
    clearcoatRoughness: 0.4,
  });
  const airwayMaterial = new T.MeshStandardMaterial({
    color: "#dbbfa8",
    roughness: 0.55,
  });
  const ringsMaterial = new T.MeshStandardMaterial({
    color: "#efd7c1",
    roughness: 0.43,
  });

  function scanShader(material: T.MeshStandardMaterial, strength = 1) {
    material.onBeforeCompile = (shader) => {
      shader.uniforms.uScanY = scanY;
      shader.uniforms.uScanStrength = scanStrength;
      shader.vertexShader = shader.vertexShader.replace(
        "#include <common>",
        "#include <common>\nvarying vec3 vScanWorld;",
      );
      shader.vertexShader = shader.vertexShader.replace(
        "#include <project_vertex>",
        "#include <project_vertex>\nvScanWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;",
      );
      shader.fragmentShader = shader.fragmentShader.replace(
        "#include <common>",
        "#include <common>\nuniform float uScanY;\nuniform float uScanStrength;\nvarying vec3 vScanWorld;",
      );
      shader.fragmentShader = shader.fragmentShader.replace(
        "#include <emissivemap_fragment>",
        `#include <emissivemap_fragment>
        float band = exp(-pow((vScanWorld.y - uScanY) * 24.0, 2.0));
        float trail = exp(-pow((vScanWorld.y - uScanY - 0.10) * 5.0, 2.0)) * 0.13;
        totalEmissiveRadiance += vec3(0.18, 0.95, 0.75) * (band + trail) * uScanStrength * ${strength.toFixed(1)};
      `,
      );
    };
    material.customProgramCacheKey = () => `lung-scan-v2-${strength}`;
  }
  scanShader(cartilage, 0.8);
  scanShader(airwayMaterial, 1.1);
  scanShader(ringsMaterial, 0.8);

  function tube(
    parent: T.Group,
    points: T.Vector3[],
    startRadius: number,
    endRadius: number,
    material: T.Material,
    segments = 16,
  ) {
    const curve = new T.CatmullRomCurve3(points);
    const frames = curve.computeFrenetFrames(segments, false);
    const positions: number[] = [],
      indices: number[] = [];
    const radial = 9;
    for (let i = 0; i <= segments; i++) {
      const p = curve.getPointAt(i / segments);
      const radius = T.MathUtils.lerp(startRadius, endRadius, i / segments);
      for (let j = 0; j <= radial; j++) {
        const angle = (j / radial) * Math.PI * 2;
        const offset = frames.normals[i]!.clone()
          .multiplyScalar(Math.cos(angle) * radius)
          .addScaledVector(frames.binormals[i]!, Math.sin(angle) * radius);
        positions.push(p.x + offset.x, p.y + offset.y, p.z + offset.z);
        if (i < segments && j < radial) {
          const a = i * (radial + 1) + j,
            b = a + radial + 1;
          indices.push(a, b, a + 1, b, b + 1, a + 1);
        }
      }
    }
    const geometry = new T.BufferGeometry();
    geometry.setAttribute(
      "position",
      new T.Float32BufferAttribute(positions, 3),
    );
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    parent.add(new T.Mesh(geometry, material));
  }
  const V = (x: number, y: number, z: number) => new T.Vector3(x, y, z);
  tube(
    group,
    [V(0, 1.95, -0.07), V(0.01, 1.4, -0.035), V(0, 0.73, 0)],
    0.113,
    0.102,
    cartilage,
    28,
  );
  // Open C-shaped cartilage rings leave a posterior membranous wall.
  for (let i = 0; i < 14; i++) {
    const ring = new T.Mesh(
      new T.TorusGeometry(0.112 - i * 0.0005, 0.016, 7, 32, Math.PI * 1.72),
      ringsMaterial,
    );
    ring.rotation.x = Math.PI / 2;
    ring.rotation.z = Math.PI * 0.14;
    ring.position.set(0.007, 0.83 + i * 0.079, -0.006 - i * 0.004);
    group.add(ring);
  }
  for (const side of [-1, 1]) {
    const lung = new T.Group();
    lungs.push(lung);
    group.add(lung);
    const geometry = lungSurface(side);
    // The UVs are used only for a very small-scale bump texture.
    const uv: number[] = [];
    for (let i = 0; i <= 128; i++)
      for (let j = 0; j <= 160; j++) uv.push((j / 160) * 6, (i / 128) * 6);
    geometry.setAttribute("uv", new T.Float32BufferAttribute(uv, 2));
    const material = new T.MeshPhysicalMaterial({
      vertexColors: true,
      roughness: 0.48,
      metalness: 0,
      clearcoat: 0.24,
      clearcoatRoughness: 0.42,
      transparent: true,
      opacity: 1,
      depthWrite: true,
      bumpMap: texture,
      bumpScale: 0.008,
    });
    scanShader(material, 1.8);
    surfaces.push(material);
    const surface = new T.Mesh(geometry, material);
    surface.renderOrder = 3;
    lung.add(surface);
    const wire = new T.Mesh(
      geometry,
      new T.MeshBasicMaterial({
        color: "#a5e4cc",
        wireframe: true,
        transparent: true,
        opacity: 0.065,
        depthWrite: false,
      }),
    );
    wire.visible = false;
    wire.renderOrder = 4;
    wires.push(wire);
    lung.add(wire);

    const root = V(0, 0.73, 0),
      hilum = V(side * 0.47, 0.28, -0.08);
    tube(
      lung,
      [
        root,
        V(side * 0.23, 0.5, -0.035),
        hilum,
        V(side * 0.66, -0.37, -0.15),
        V(side * 0.78, -1.05, -0.05),
      ],
      0.088,
      0.031,
      cartilage,
      24,
    );
    // Branches fan into lobes at varying depths, tapering to fine bronchioles.
    const targets = [
      [0.54, 1.18, 0.02],
      [0.79, 0.87, 0.11],
      [1.0, 0.5, 0.13],
      [1.13, 0.02, 0.18],
      [1.25, -0.44, 0.15],
      [1.23, -0.9, 0.04],
      [0.96, -1.2, 0.17],
      [0.55, -1.12, 0.1],
      [0.48, -0.78, -0.3],
      [0.92, 0.33, -0.31],
      [1.12, -0.64, -0.34],
      [0.64, 0.76, -0.23],
    ];
    function clampBranch(p: T.Vector3) {
      // Conservative bounds keep peripheral airways enclosed by the tissue.
      let best = [0, 0, 0, 0],
        distance = Infinity;
      for (let k = 2; k < 98; k++) {
        const candidate = profile(k / 100);
        const d = Math.abs(candidate[0]! * (side === -1 ? 0.955 : 1.02) - p.y);
        if (d < distance) {
          distance = d;
          best = candidate;
        }
      }
      const rx = best[1]! * (side === -1 ? 1.04 : 0.94) * 0.78,
        rz = best[2]! * 0.8;
      const center = best[3]!,
        x = Math.abs(p.x) - center;
      const len = Math.sqrt((x / rx) ** 2 + (p.z / rz) ** 2);
      if (len > 1) {
        p.x = side * (center + x / len);
        p.z /= len;
      }
      return p;
    }
    targets.forEach((target, index) => {
      const end = clampBranch(V(side * target[0]!, target[1]!, target[2]!));
      const origin =
        index < 3 || index > 8
          ? hilum.clone()
          : V(side * 0.59, 0.02 - (index - 3) * 0.1, -0.1);
      const mid = origin.clone().lerp(end, 0.54);
      mid.z -= 0.025;
      tube(lung, [origin, mid, end], 0.031, 0.012, airwayMaterial);
      const flowRoute = [
        V(0, 2.2, -0.08),
        V(0, 1.7, -0.055),
        V(0, 0.73, 0),
        V(side * 0.23, 0.5, -0.035),
        hilum.clone(),
        origin.clone(),
        mid.clone(),
        end.clone(),
      ].filter(
        (point, i, points) =>
          i === 0 || point.distanceTo(points[i - 1]!) > 0.001,
      );
      flowPaths.push({ curve: new T.CatmullRomCurve3(flowRoute), side });
      function twigs(
        start: T.Vector3,
        direction: T.Vector3,
        length: number,
        depth: number,
        seed: number,
      ) {
        if (!depth) return;
        for (const fork of [-1, 1]) {
          const dir = direction
            .clone()
            .add(
              V(
                side * fork * 0.42,
                Math.sin(seed * 1.71 + fork) * 0.45,
                fork * 0.52,
              ),
            )
            .normalize();
          const tip = clampBranch(start.clone().addScaledVector(dir, length));
          const middle = start
            .clone()
            .lerp(tip, 0.5)
            .add(V(0, 0, 0.018 * fork));
          tube(
            lung,
            [start, middle, tip],
            depth * 0.0038,
            Math.max(0.002, depth * 0.0018),
            airwayMaterial,
            7,
          );
          twigs(tip, dir, length * 0.62, depth - 1, seed + fork + 2);
        }
      }
      twigs(mid, end.clone().sub(mid).normalize(), 0.22, 3, index + side);
    });
  }

  // Air parcels travel along the same curved route as the airway tree. One
  // dynamic point cloud avoids individual meshes and keeps mobile rendering light.
  const parcelsPerPath = 4;
  const count = flowPaths.length * parcelsPerPath;
  const flowPositions = new Float32Array(count * 3);
  const flowAlpha = new Float32Array(count);
  const flowGeometry = new T.BufferGeometry();
  flowGeometry.setAttribute(
    "position",
    new T.BufferAttribute(flowPositions, 3).setUsage(T.DynamicDrawUsage),
  );
  flowGeometry.setAttribute(
    "aAlpha",
    new T.BufferAttribute(flowAlpha, 1).setUsage(T.DynamicDrawUsage),
  );
  const flowMaterial = new T.ShaderMaterial({
    uniforms: { uExhale: { value: 0 } },
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: T.NormalBlending,
    vertexShader: `attribute float aAlpha; varying float vAlpha;
      void main(){vAlpha=aAlpha;vec4 p=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*p;gl_PointSize=clamp(43./-p.z,2.5,9.);}`,
    fragmentShader: `varying float vAlpha; uniform float uExhale;
      void main(){float r=length(gl_PointCoord-.5)*2.;if(r>1.)discard;
      float glow=exp(-r*r*4.);vec3 color=mix(vec3(.22,.82,1.),vec3(.60,.98,.79),uExhale);
      float core=1.-smoothstep(.28,.60,r);gl_FragColor=vec4(color,max(core,glow*.4)*vAlpha);}`,
  });
  const airflow = new T.Points(flowGeometry, flowMaterial);
  airflow.renderOrder = 7;
  airflow.frustumCulled = false;
  group.add(airflow);
  const flowPoint = new T.Vector3();

  // A transparent horizontal light sheet and rim provide a spatial scan cue.
  const scanner = new T.Group();
  group.add(scanner);
  const sheetMaterial = new T.ShaderMaterial({
    uniforms: { uOpacity: { value: 0 } },
    transparent: true,
    depthWrite: false,
    side: T.DoubleSide,
    blending: T.AdditiveBlending,
    vertexShader:
      "varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}",
    fragmentShader:
      "varying vec2 vUv; uniform float uOpacity; void main(){vec2 p=(vUv-.5)*2.;float edge=1.-smoothstep(.65,1.,length(p));float grid=pow(abs(sin(vUv.x*120.)),28.)+pow(abs(sin(vUv.y*90.)),28.);gl_FragColor=vec4(.22,.93,.78,edge*(.08+grid*.045)*uOpacity);}",
  });
  const sheet = new T.Mesh(new T.PlaneGeometry(3.6, 1.75), sheetMaterial);
  sheet.rotation.x = -Math.PI / 2;
  sheet.renderOrder = 5;
  scanner.add(sheet);
  const ringMaterial = new T.MeshBasicMaterial({
    color: scanColor,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    blending: T.AdditiveBlending,
  });
  const ring = new T.Mesh(new T.TorusGeometry(1, 0.005, 5, 100), ringMaterial);
  ring.rotation.x = Math.PI / 2;
  ring.scale.set(1.72, 0.82, 1);
  ring.renderOrder = 6;
  scanner.add(ring);
  const floorMaterial = new T.MeshBasicMaterial({
    color: "#64987c",
    transparent: true,
    opacity: 0.12,
    side: T.DoubleSide,
    depthWrite: false,
  });
  const floor = new T.Mesh(new T.RingGeometry(1.25, 1.255, 100), floorMaterial);
  floor.rotation.x = -Math.PI / 2;
  floor.scale.set(1.1, 0.53, 1);
  floor.position.y = -1.46;
  group.add(floor);

  // Combine hundreds of airway segments into a handful of draw calls.
  for (const parent of [group, ...lungs]) {
    for (const material of [cartilage, airwayMaterial, ringsMaterial]) {
      const meshes = parent.children.filter(
        (object): object is T.Mesh<T.BufferGeometry, T.Material> =>
          object instanceof T.Mesh && object.material === material,
      );
      if (meshes.length < 2) continue;
      const copies = meshes.map((mesh) => {
        mesh.updateMatrix();
        return mesh.geometry.clone().applyMatrix4(mesh.matrix);
      });
      const merged = mergeGeometries(copies);
      copies.forEach((geometry) => geometry.dispose());
      if (!merged) continue;
      meshes.forEach((mesh) => {
        parent.remove(mesh);
        mesh.geometry.dispose();
      });
      parent.add(new T.Mesh(merged, material));
    }
  }
  return {
    group,
    update(
      breathing: BreathingFrame,
      active: number,
      scanHeight: number,
      airwayView: boolean,
      wireframe: boolean,
    ) {
      scanY.value = scanHeight;
      scanStrength.value = active;
      scanner.position.y = scanHeight;
      scanner.visible = active > 0.005;
      sheetMaterial.uniforms.uOpacity!.value = active;
      ringMaterial.opacity = active * 0.55;
      // Each lung expands outward; the trachea remains steady.
      const breath = breathing.volume;
      lungs.forEach((lung) => {
        lung.scale.set(
          1 + breath * 0.085,
          1 + breath * 0.025,
          1 + breath * 0.1,
        );
        lung.position.x = 0;
      });
      surfaces.forEach((material) => {
        const transparency = Math.max(
          active * 0.68,
          airwayView ? 0.76 : 0,
          wireframe ? 0.93 : 0,
        );
        material.opacity = 1 - transparency;
        material.depthWrite = transparency < 0.05;
      });
      wires.forEach((wire) => {
        wire.visible = wireframe;
      });
      airwayMaterial.color.set(
        airwayView || active > 0.2 ? "#b6dfcc" : "#dbbfa8",
      );
      flowMaterial.uniforms.uExhale!.value =
        breathing.phase === "exhale" ? 1 : 0;
      flowPaths.forEach((route, pathIndex) => {
        for (let parcel = 0; parcel < parcelsPerPath; parcel++) {
          const i = pathIndex * parcelsPerPath + parcel;
          const offset = parcel * 0.16 + (pathIndex % 3) * 0.04;
          const travel = breathing.progress * 1.55 - offset;
          const progress = breathing.phase === "exhale" ? 1 - travel : travel;
          const shown =
            breathing.phase !== "rest" && progress >= 0 && progress <= 1;
          route.curve.getPointAt(clamp(progress, 0, 1), flowPoint);
          const deformation = 1 - smooth(0.5, 0.9, flowPoint.y);
          flowPoint.x = flowPoint.x * (1 + breath * 0.085 * deformation);
          flowPoint.y *= 1 + breath * 0.025 * deformation;
          flowPoint.z *= 1 + breath * 0.1 * deformation;
          flowPositions[i * 3] = flowPoint.x;
          flowPositions[i * 3 + 1] = flowPoint.y;
          flowPositions[i * 3 + 2] = flowPoint.z;
          const reveal =
            airwayView ||
            wireframe ||
            active > 0.1 ||
            (flowPoint.y > 0.73 && Math.abs(flowPoint.x) < 0.14);
          flowAlpha[i] =
            shown && reveal
              ? Math.min(1, progress * 12, (1 - progress) * 12) * 0.95
              : 0;
        }
      });
      flowGeometry.attributes.position!.needsUpdate = true;
      flowGeometry.attributes.aAlpha!.needsUpdate = true;
    },
    dispose() {
      const geometries = new Set<T.BufferGeometry>(),
        materials = new Set<T.Material>();
      group.traverse((object) => {
        if (object instanceof T.Mesh || object instanceof T.Points) {
          geometries.add(object.geometry);
          const ms = Array.isArray(object.material)
            ? object.material
            : [object.material];
          ms.forEach((m) => materials.add(m));
        }
      });
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
      texture.dispose();
    },
  };
}
