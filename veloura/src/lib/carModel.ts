import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import gsap from 'gsap';

export const MODEL_URL = '/models/CarConcept.glb';

export const PAINT_VARIANTS = [
  { id: 0, name: 'Carmine Candy', label: 'Carmine', swatch: '#a9122c', note: 'A deep, lacquered red' },
  { id: 1, name: 'Pearly Swirly', label: 'Pearly', swatch: '#d8d2c5', note: 'Soft pearl, warm in the light' },
  { id: 2, name: 'Torched Graphite', label: 'Graphite', swatch: '#3d4142', note: 'A quiet metallic charcoal' },
] as const;

export const WHEEL_FINISHES = [
  { id: 'original', name: 'Original alloy', swatch: '#b8b8b4', metalness: 0.82, roughness: 0.27 },
  { id: 'graphite', name: 'Satin graphite', swatch: '#404343', metalness: 0.75, roughness: 0.32 },
  { id: 'champagne', name: 'Champagne metal', swatch: '#9d8561', metalness: 0.78, roughness: 0.3 },
] as const;

export type PaintId = (typeof PAINT_VARIANTS)[number]['id'];
export type WheelFinishId = (typeof WHEEL_FINISHES)[number]['id'];
export type PanelId = 'doors' | 'hood' | 'hatch';

interface PrimitiveDefinition {
  material?: number;
  extensions?: { KHR_materials_variants?: { mappings?: Array<{ material: number; variants: number[] }> } };
}
interface GlbDocument {
  scenes?: Array<{ nodes?: number[] }>;
  nodes?: Array<{ mesh?: number; name?: string }>;
  meshes?: Array<{ primitives?: PrimitiveDefinition[] }>;
  materials?: Array<{ name?: string }>;
  extensions?: { KHR_materials_variants?: { variants?: Array<{ name: string }> } };
}
interface ParserShape {
  json: GlbDocument;
  associations: Map<THREE.Object3D, { meshes?: number; primitives?: number }>;
  getDependency: (type: string, index: number) => Promise<unknown>;
}

type LoadingCallback = (progress: number) => void;

export interface CarModelBundle {
  root: THREE.Group;
  scene: THREE.Group;
  variantNames: string[];
  applyVariant: (variantId: number) => void;
  applyWheelFinish: (finishId: WheelFinishId) => void;
  setPanel: (panel: PanelId, opened: boolean) => void;
  resetPanels: () => void;
}

const panelAngles: Record<PanelId, { node: string; axis: 'x' | 'z'; open: number }[]> = {
  doors: [
    { node: 'BodyDoorLColor1', axis: 'z', open: 0.88 },
    { node: 'BodyDoorRColor1', axis: 'z', open: -0.88 },
  ],
  hood: [{ node: 'BodyHood', axis: 'x', open: -0.76 }],
  hatch: [{ node: 'BodyRearPanelsColor1', axis: 'x', open: 0.82 }],
};

export async function loadCarModel(onProgress: LoadingCallback): Promise<CarModelBundle> {
  const loader = new GLTFLoader();
  loader.setMeshoptDecoder(MeshoptDecoder);
  const gltf = await loader.loadAsync(MODEL_URL, (event) => {
    if (event.lengthComputable && event.total > 0) {
      onProgress(Math.round((event.loaded / event.total) * 100));
    } else {
      onProgress(Math.min(92, Math.round((event.loaded / (event.loaded + 1_800_000)) * 100)));
    }
  });
  onProgress(100);

  const scene = gltf.scene;
  scene.name = 'Veloura concept grand tourer';
  const startingBounds = new THREE.Box3().setFromObject(scene);
  const initialSize = startingBounds.getSize(new THREE.Vector3());

  // The source model's long axis is local Y and its vertical axis is local Z.
  // Rotate its Z-up authoring orientation into Three.js's Y-up presentation space.
  if (initialSize.y > initialSize.x * 1.2 && initialSize.z < initialSize.y * 0.72) {
    scene.rotation.x = -Math.PI / 2;
  } else if (initialSize.y > initialSize.z * 1.2 && initialSize.x < initialSize.y * 0.58) {
    scene.rotation.z = Math.PI / 2;
  }
  scene.updateMatrixWorld(true);

  const bounds = new THREE.Box3().setFromObject(scene);
  const size = bounds.getSize(new THREE.Vector3());
  const center = bounds.getCenter(new THREE.Vector3());
  scene.position.x -= center.x;
  scene.position.y -= bounds.min.y;
  scene.position.z -= center.z;
  scene.updateMatrixWorld(true);

  const root = new THREE.Group();
  root.name = 'Vehicle presentation rig';
  root.add(scene);
  const maxDimension = Math.max(size.x, size.y, size.z) || 1;
  root.scale.setScalar(5.45 / maxDimension);

  const parser = gltf.parser as unknown as ParserShape;
  const definitions = parser.json;
  const materialCount = definitions.materials?.length ?? 0;
  const materials = await Promise.all(
    Array.from({ length: materialCount }, async (_, index) => {
      return (await parser.getDependency('material', index)) as THREE.Material;
    }),
  );

  const baseMaterials = new Map<THREE.Mesh, THREE.Material | THREE.Material[]>();
  const wheelOriginals = new Map<THREE.Mesh, THREE.Material | THREE.Material[]>();
  const wheelMeshes: THREE.Mesh[] = [];
  scene.traverse((object) => {
    const mesh = object as THREE.Mesh;
    if (!mesh.isMesh) return;
    baseMaterials.set(mesh, mesh.material);
    if (/Rim/i.test(mesh.name) || /Rim/i.test(mesh.parent?.name ?? '')) {
      wheelOriginals.set(mesh, mesh.material);
      wheelMeshes.push(mesh);
    }
  });

  const applyVariant = (variantId: number) => {
    scene.traverse((object) => {
      const mesh = object as THREE.Mesh;
      if (!mesh.isMesh) return;
      const association = parser.associations.get(mesh);
      if (association?.meshes === undefined || association.primitives === undefined) return;
      const primitive = definitions.meshes?.[association.meshes]?.primitives?.[association.primitives];
      if (!primitive) return;
      const variantMapping = primitive.extensions?.KHR_materials_variants?.mappings?.find((mapping) =>
        mapping.variants.includes(variantId),
      );
      const materialIndex = variantMapping?.material ?? primitive.material;
      if (materialIndex === undefined) {
        const original = baseMaterials.get(mesh);
        if (original) mesh.material = original;
        return;
      }
      const material = materials[materialIndex];
      if (material) mesh.material = material;
    });
  };

  const applyWheelFinish = (finishId: WheelFinishId) => {
    const finish = WHEEL_FINISHES.find((item) => item.id === finishId) ?? WHEEL_FINISHES[0];
    wheelMeshes.forEach((mesh) => {
      const original = wheelOriginals.get(mesh);
      if (!original) return;
      if (finishId === 'original') {
        mesh.material = original;
        return;
      }
      const tintMaterial = (material: THREE.Material) => {
        const clone = material.clone();
        if ('color' in clone && clone.color instanceof THREE.Color) clone.color.set(finish.swatch);
        if ('metalness' in clone) (clone as THREE.MeshStandardMaterial).metalness = finish.metalness;
        if ('roughness' in clone) (clone as THREE.MeshStandardMaterial).roughness = finish.roughness;
        return clone;
      };
      mesh.material = Array.isArray(original) ? original.map(tintMaterial) : tintMaterial(original);
    });
  };

  const panelNodes = new Map<string, THREE.Object3D>();
  scene.traverse((object) => {
    if (Object.values(panelAngles).flat().some((part) => part.node === object.name)) panelNodes.set(object.name, object);
  });
  const panelDefaults = new Map<string, { x: number; z: number }>();
  panelNodes.forEach((node, name) => panelDefaults.set(name, { x: node.rotation.x, z: node.rotation.z }));

  const setPanel = (panel: PanelId, isOpened: boolean) => {
    panelAngles[panel].forEach(({ node: name, axis, open }) => {
      const object = panelNodes.get(name);
      const initial = panelDefaults.get(name);
      if (!object || !initial) return;
      const target = initial[axis] + (isOpened ? open : 0);
      gsap.to(object.rotation, { [axis]: target, duration: 0.82, ease: 'power3.inOut', overwrite: 'auto' });
    });
  };

  const resetPanels = () => {
    (Object.keys(panelAngles) as PanelId[]).forEach((panel) => setPanel(panel, false));
  };

  return {
    root,
    scene,
    variantNames: (definitions.extensions?.KHR_materials_variants?.variants ?? []).map((variant) => variant.name),
    applyVariant,
    applyWheelFinish,
    setPanel,
    resetPanels,
  };
}
