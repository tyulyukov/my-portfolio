import React, { useEffect, useRef, useState } from 'react';

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const dispose = (object: THREE.Object3D) => {
  object.traverse((child) => {
    if ('geometry' in child && child.geometry instanceof THREE.BufferGeometry)
      child.geometry.dispose();
    if (!('material' in child)) return;
    const materials: unknown[] = Array.isArray(child.material) ? child.material : [child.material];
    for (const material of materials) {
      if (!(material instanceof THREE.Material)) continue;
      const values: unknown[] = Object.values(material);
      for (const value of values) {
        if (value instanceof THREE.Texture) value.dispose();
      }
      material.dispose();
    }
  });
};

export default function Avatar3D() {
  const mountReference = useRef<HTMLDivElement>(null);
  const modelReference = useRef<THREE.Object3D | undefined>(undefined);
  const [playing, setPlaying] = useState(
    () => !globalThis.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
  const playingReference = useRef(playing);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    playingReference.current = playing;
  }, [playing]);

  useEffect(() => {
    const mount = mountReference.current;
    if (!mount) return;
    let active = true;
    let frame = 0;
    let inViewport = true;
    let sceneObject: THREE.Object3D | undefined;
    const mediaQuery = globalThis.matchMedia('(prefers-reduced-motion: reduce)');
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    } catch {
      setState('error');
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    const environment = new RoomEnvironment();
    const generator = new THREE.PMREMGenerator(renderer);
    const environmentTarget = generator.fromScene(environment, 0.04);
    scene.environment = environmentTarget.texture;
    scene.environmentIntensity = 0.65;
    environment.dispose();
    generator.dispose();
    renderer.domElement.className = 'block h-full w-full';
    mount.append(renderer.domElement);
    const controls = new OrbitControls(camera, renderer.domElement);
    renderer.domElement.style.touchAction = 'pan-y';
    controls.enableDamping = true;
    controls.enablePan = false;
    controls.enableZoom = false;
    controls.minPolarAngle = Math.PI * 0.35;
    controls.maxPolarAngle = Math.PI * 0.65;
    controls.autoRotateSpeed = 0.7;
    scene.add(new THREE.HemisphereLight(0xff_f5_e8, 0x45_50_62, 0.55));
    const key = new THREE.DirectionalLight(0xff_f1_df, 3.2);
    key.position.set(-3, 5, 6);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.left = -4;
    key.shadow.camera.right = 4;
    key.shadow.camera.top = 5;
    key.shadow.camera.bottom = -3;
    key.shadow.camera.far = 20;
    key.shadow.normalBias = 0.025;
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xd9_e8_ff, 1.2);
    fill.position.set(4, 2, 3);
    scene.add(fill);
    const rim = new THREE.DirectionalLight(0xff_f4_df, 2);
    rim.position.set(1, 4, -4);
    scene.add(rim);
    const resize = () => {
      const { width, height } = mount.getBoundingClientRect();
      if (!width || !height) return;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(mount);
    resize();
    const viewportObserver = new IntersectionObserver(([entry]) => {
      inViewport = entry.isIntersecting;
    });
    viewportObserver.observe(mount);
    const onMotionChange = (event: MediaQueryListEvent) => {
      if (event.matches) setPlaying(false);
    };
    mediaQuery.addEventListener('change', onMotionChange);
    document.addEventListener('visibilitychange', resize);
    const clock = new THREE.Clock();
    const render = () => {
      if (!active) return;
      const delta = clock.getDelta();
      if (inViewport && !document.hidden) {
        controls.autoRotate = playingReference.current;
        controls.update(delta);
        renderer.render(scene, camera);
      }
      frame = requestAnimationFrame(render);
    };
    new GLTFLoader().load(
      '/avatar.glb?v=2',
      (gltf) => {
        if (!active) {
          dispose(gltf.scene);
          return;
        }
        const model = gltf.scene;
        model.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });
        sceneObject = model;
        modelReference.current = model;
        const bounds = new THREE.Box3().setFromObject(model);
        const center = bounds.getCenter(new THREE.Vector3());
        const size = bounds.getSize(new THREE.Vector3());
        const radius = Math.max(size.x, size.y, size.z) * 0.64;
        const distance = radius / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
        camera.position
          .copy(center)
          .add(new THREE.Vector3(distance * 0.1, distance * 0.03, distance * 1.05));
        controls.target.copy(center).add(new THREE.Vector3(0, 0.05, 0));
        controls.update();
        scene.add(model);
        setState('ready');
        render();
      },
      undefined,
      () => {
        if (active) setState('error');
      }
    );
    return () => {
      active = false;
      cancelAnimationFrame(frame);
      document.removeEventListener('visibilitychange', resize);
      mediaQuery.removeEventListener('change', onMotionChange);
      resizeObserver.disconnect();
      viewportObserver.disconnect();
      modelReference.current = undefined;
      controls.dispose();
      if (sceneObject) dispose(sceneObject);
      key.shadow.dispose();
      environmentTarget.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    };
  }, []);

  const rotate = (direction: 1 | -1) => {
    if (modelReference.current) modelReference.current.rotation.y += (direction * Math.PI) / 10;
  };

  return (
    <div className='relative aspect-square w-full max-w-[400px]'>
      <div
        ref={mountReference}
        className='absolute inset-0 touch-pan-y rounded-lg focus-visible:outline focus-visible:outline-violet-400'
        aria-hidden={state !== 'ready'}
        role='img'
        aria-label='3D portrait of Maksym with a laptop. Drag to rotate.'
      />
      {state !== 'ready' && (
        <img
          src='/avatar-3d.webp?v=2'
          alt='Maksym with his laptop'
          className='h-full w-full object-contain p-3'
        />
      )}
      <span
        role='status'
        className='absolute inset-x-3 bottom-3 text-center text-xs text-muted-foreground'
      >
        {state === 'loading'
          ? 'Loading 3D avatar...'
          : state === 'error'
            ? '3D view could not load. Here is the portrait instead.'
            : ''}
      </span>
      {state === 'ready' && (
        <div className='absolute bottom-2 left-1/2 flex -translate-x-1/2 items-center gap-1 whitespace-nowrap text-xs text-muted-foreground'>
          <button
            type='button'
            onClick={() => rotate(-1)}
            className='rounded px-1.5 py-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet-400'
            aria-label='Rotate avatar left'
          >
            ←
          </button>
          <span>Drag to rotate</span>
          <button
            type='button'
            onClick={() => rotate(1)}
            className='rounded px-1.5 py-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet-400'
            aria-label='Rotate avatar right'
          >
            →
          </button>
          <button
            type='button'
            onClick={() => setPlaying((value) => !value)}
            className='ml-1 rounded px-1.5 py-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet-400'
            aria-pressed={playing}
            aria-label={playing ? 'Pause avatar rotation' : 'Play avatar rotation'}
          >
            {playing ? 'Pause' : 'Play'}
          </button>
        </div>
      )}
    </div>
  );
}
