import * as THREE from 'three';

import { avatarAssets } from '@/data/avatar';

export function addDesktopScreen(model: THREE.Object3D) {
  const screen = model.getObjectByName('mtos_screen');
  if (!(screen instanceof THREE.Mesh) || !(screen.geometry instanceof THREE.BufferGeometry)) return;
  screen.geometry.computeBoundingBox();
  const dimensions = screen.geometry.boundingBox?.getSize(new THREE.Vector3());
  if (!dimensions) return;
  const texture = new THREE.TextureLoader().load(avatarAssets.wallpaper);
  texture.colorSpace = THREE.SRGBColorSpace;
  const display = new THREE.Mesh(
    new THREE.PlaneGeometry(dimensions.x, dimensions.y),
    new THREE.MeshBasicMaterial({ map: texture, toneMapped: false })
  );
  display.name = 'mtos_wallpaper';
  display.position.z = -0.004;
  display.rotation.y = Math.PI;
  screen.add(display);
}

export function enterLaptop({
  model,
  camera,
  renderer,
  target,
  onComplete,
  onCancel,
  onRestore
}: {
  model: THREE.Object3D;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  target: THREE.Vector3;
  onComplete: () => void;
  onCancel: () => void;
  onRestore: () => void;
}) {
  const screen = model.getObjectByName('mtos_screen');
  const mount = renderer.domElement.parentElement;
  if (!screen || !mount) {
    onRestore();
    onComplete();
    return;
  }
  const originalPosition = camera.position.clone();
  const originalQuaternion = camera.quaternion.clone();
  const bounds = mount.getBoundingClientRect();
  const dialog = document.createElement('dialog');
  dialog.className = 'avatar-entry';
  dialog.setAttribute('aria-label', 'Opening mTOS');
  const viewport = document.createElement('div');
  viewport.className = 'avatar-entry-viewport';
  const cancel = document.createElement('button');
  cancel.textContent = 'Cancel';
  const skip = document.createElement('button');
  skip.textContent = 'Skip to desktop';
  const actions = document.createElement('div');
  actions.className = 'avatar-entry-actions';
  actions.append(cancel, skip);
  dialog.append(viewport, actions);
  document.body.append(dialog);
  dialog.showModal();
  viewport.append(renderer.domElement);
  const previousOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';
  let frame = 0;
  let restored = false;
  const restore = () => {
    if (restored) return;
    restored = true;
    cancelAnimationFrame(frame);
    mount.append(renderer.domElement);
    camera.position.copy(originalPosition);
    camera.quaternion.copy(originalQuaternion);
    const { width, height } = mount.getBoundingClientRect();
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
    dialog.close();
    dialog.remove();
    document.body.style.overflow = previousOverflow;
    onRestore();
  };
  let completed = false;
  const finish = () => {
    if (completed) return;
    completed = true;
    cancelAnimationFrame(frame);
    onComplete();
  };
  const cancelEntry = () => {
    restore();
    onCancel();
  };
  cancel.addEventListener('click', cancelEntry);
  skip.addEventListener('click', finish);
  dialog.addEventListener('cancel', (event) => {
    event.preventDefault();
    cancelEntry();
  });
  model.updateMatrixWorld(true);
  const center = screen.getWorldPosition(new THREE.Vector3());
  const normal = new THREE.Vector3(0, 0, -1).transformDirection(screen.matrixWorld);
  const side = new THREE.Vector3(1, 0, 0).transformDirection(screen.matrixWorld);
  const end = center.clone().addScaledVector(normal, 0.42);
  const path = new THREE.CubicBezierCurve3(
    originalPosition,
    center.clone().addScaledVector(side, 7).addScaledVector(normal, -3),
    center.clone().addScaledVector(side, 2.6).addScaledVector(normal, 4),
    end
  );
  const started = performance.now();
  const animate = (now: number) => {
    if (restored || completed) return;
    const progress = Math.min((now - started) / 2200, 1);
    const eased = progress * progress * (3 - 2 * progress);
    const expansion = Math.min(eased * 2, 1);
    const width = THREE.MathUtils.lerp(bounds.width, window.innerWidth, expansion);
    const height = THREE.MathUtils.lerp(bounds.height, window.innerHeight, expansion);
    Object.assign(viewport.style, {
      left: `${bounds.left * (1 - expansion)}px`,
      top: `${bounds.top * (1 - expansion)}px`,
      width: `${width}px`,
      height: `${height}px`
    });
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    path.getPoint(eased, camera.position);
    camera.lookAt(target.clone().lerp(center, Math.min(eased * 2, 1)));
    if (progress === 1) finish();
    else frame = requestAnimationFrame(animate);
  };
  frame = requestAnimationFrame(animate);
  return restore;
}
