"use client";

import { useEffect, useRef } from "react";

const LOW_END = () => innerWidth < 768 || navigator.hardwareConcurrency <= 4;
const RADIUS = 2.1;
const INTRO_START = 3.3; // Seconds after load, as the loader lifts.
const INTRO_LENGTH = 2.2;

const VERTEX = `
  attribute float aRandom;
  uniform float uTime;
  uniform float uIntro;
  uniform float uScatter;
  uniform float uPixelRatio;
  uniform float uPull;
  uniform float uDistance;
  uniform float uSize;
  uniform float uDim;
  uniform vec3 uPointer;
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform vec3 uColorC;
  varying vec3 vColor;
  varying float vAlpha;

  float ripple(vec3 p) {
    return sin(p.x * 2.1 + uTime * 0.6) * cos(p.y * 2.6 - uTime * 0.45) * sin(p.z * 2.3 + uTime * 0.5);
  }

  void main() {
    vec3 dir = normalize(position);
    float glow = uPull * smoothstep(0.82, 1.0, dot(dir, uPointer));

    vec3 p = position * (1.0 + ripple(position) * 0.09 + glow * 0.24);
    float spread = (1.0 - uIntro) * (1.5 + aRandom * 3.5) + uScatter * (0.8 + aRandom * 2.6);
    p += dir * spread;

    vec4 view = modelViewMatrix * vec4(p, 1.0);
    float front = smoothstep(uDistance + 3.0, uDistance - 2.2, -view.z);

    vColor = mix(mix(uColorA, uColorB, dir.y * 0.5 + 0.5), uColorC, smoothstep(0.1, 0.9, dir.x));
    vAlpha = (0.3 + front * 0.6 + glow * 0.4) * uDim * uIntro * (1.0 - uScatter);

    gl_Position = projectionMatrix * view;
    gl_PointSize = (1.3 + aRandom * 1.3 + glow * 2.4) * uSize * uPixelRatio * (uDistance * 1.08 / -view.z);
  }
`;

const FRAGMENT = `
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    float edge = 1.0 - smoothstep(0.3, 0.5, distance(gl_PointCoord, vec2(0.5)));
    gl_FragColor = vec4(vColor, edge * vAlpha);
  }
`;

// Evenly spread points on a sphere, then a loose ring around it.
function buildPoints(sphereCount, ringCount) {
  const total = sphereCount + ringCount;
  const positions = new Float32Array(total * 3);
  const randoms = new Float32Array(total);
  const golden = Math.PI * (3 - Math.sqrt(5));

  for (let i = 0; i < sphereCount; i++) {
    const y = 1 - (i / (sphereCount - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    positions[i * 3] = Math.cos(golden * i) * r * RADIUS;
    positions[i * 3 + 1] = y * RADIUS;
    positions[i * 3 + 2] = Math.sin(golden * i) * r * RADIUS;
    randoms[i] = Math.random();
  }
  for (let i = sphereCount; i < total; i++) {
    const angle = Math.random() * Math.PI * 2;
    const distance = RADIUS * (1.42 + Math.random() * 0.5);
    positions[i * 3] = Math.cos(angle) * distance;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 0.12;
    positions[i * 3 + 2] = Math.sin(angle) * distance;
    randoms[i] = Math.random();
  }
  return { positions, randoms };
}

export default function ParticleField() {
  const mount = useRef(null);

  useEffect(() => {
    const host = mount.current;
    let cleanup = () => {};
    let cancelled = false;

    import("three").then((THREE) => {
      if (cancelled) return;

      let renderer;
      try {
        renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false, powerPreference: "low-power" });
      } catch {
        return; // No WebGL: the hero simply has no background.
      }

      const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
      const pixelRatio = Math.min(devicePixelRatio, 1.75);
      renderer.setPixelRatio(pixelRatio);
      host.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 40);
      const globe = new THREE.Group();
      globe.rotation.set(0.32, 0, -0.18);
      scene.add(globe);

      const lowEnd = LOW_END();
      const { positions, randoms } = buildPoints(...(lowEnd ? [2400, 500] : [6500, 1500]));
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute("aRandom", new THREE.BufferAttribute(randoms, 1));

      const uniforms = {
        uTime: { value: 0 },
        uIntro: { value: reduced ? 1 : 0 },
        uScatter: { value: 0 },
        uPixelRatio: { value: pixelRatio },
        uPull: { value: 0 },
        uDistance: { value: 6 },
        uSize: { value: lowEnd ? 1.05 : 1 },
        uDim: { value: lowEnd ? 0.55 : 1 },
        uPointer: { value: new THREE.Vector3(0, 0, 1) },
        uColorA: { value: new THREE.Color() },
        uColorB: { value: new THREE.Color() },
        uColorC: { value: new THREE.Color() },
      };
      const material = new THREE.ShaderMaterial({
        vertexShader: VERTEX,
        fragmentShader: FRAGMENT,
        uniforms,
        transparent: true,
        depthWrite: false,
      });
      globe.add(new THREE.Points(geometry, material));

      const applyTheme = () => {
        const css = getComputedStyle(document.documentElement);
        uniforms.uColorA.value.set(css.getPropertyValue("--accent").trim());
        uniforms.uColorB.value.set(css.getPropertyValue("--amber").trim());
        uniforms.uColorC.value.set(css.getPropertyValue("--teal").trim());
        const dark = document.documentElement.classList.contains("dark");
        material.blending = dark ? THREE.AdditiveBlending : THREE.NormalBlending;
        material.needsUpdate = true;
      };
      applyTheme();

      const resize = () => {
        const { clientWidth: width, clientHeight: height } = host;
        renderer.setSize(width, height);
        camera.aspect = width / height;
        // Pulls back on narrow screens so the globe still fits.
        camera.position.z = camera.aspect < 1 ? 6 + (1 - camera.aspect) * 5 : 6;
        uniforms.uDistance.value = camera.position.z;
        camera.updateProjectionMatrix();
      };
      resize();

      const ray = new THREE.Raycaster();
      const sphere = new THREE.Sphere(new THREE.Vector3(), RADIUS * 1.05);
      const pointer = new THREE.Vector2();
      const hit = new THREE.Vector3();
      const target = new THREE.Vector3(0, 0, 1);
      let pull = 0;

      const onPointer = (e) => {
        const rect = host.getBoundingClientRect();
        pointer.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
        ray.setFromCamera(pointer, camera);
        pull = ray.ray.intersectSphere(sphere, hit) ? 1 : 0;
        if (pull) target.copy(globe.worldToLocal(hit.clone())).normalize();
      };

      const clock = new THREE.Clock();
      const startOffset = performance.now() / 1000;
      let frame = 0;
      let visible = true;
      let spin = 0;

      const draw = (delta) => {
        const time = clock.getElapsedTime();
        uniforms.uTime.value = time;
        if (!reduced) {
          const t = Math.min(Math.max((time + startOffset - INTRO_START) / INTRO_LENGTH, 0), 1);
          uniforms.uIntro.value = 1 - (1 - t) ** 3;
          spin += delta * (0.09 + (1 - t) * 1.1);
        }
        uniforms.uScatter.value = Math.min(scrollY / host.clientHeight, 1);
        uniforms.uPointer.value.lerp(target, 0.12).normalize();
        uniforms.uPull.value += (pull - uniforms.uPull.value) * 0.08;

        globe.rotation.y = spin + pointer.x * 0.35;
        globe.rotation.x = 0.32 - pointer.y * 0.2;
        renderer.render(scene, camera);
      };
      const loop = () => {
        draw(Math.min(clock.getDelta(), 0.1));
        frame = visible && !document.hidden ? requestAnimationFrame(loop) : 0;
      };
      const wake = () => {
        if (!frame && visible && !document.hidden && !reduced) {
          clock.getDelta();
          frame = requestAnimationFrame(loop);
        }
      };

      const seen = new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
        wake();
      });
      seen.observe(host);
      const sized = new ResizeObserver(() => {
        resize();
        if (reduced) draw(0);
      });
      sized.observe(host);
      const themed = new MutationObserver(() => {
        applyTheme();
        if (reduced) draw(0);
      });
      themed.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
      document.addEventListener("visibilitychange", wake);

      if (reduced) {
        draw(0);
      } else {
        window.addEventListener("pointermove", onPointer);
        wake();
      }

      cleanup = () => {
        cancelAnimationFrame(frame);
        seen.disconnect();
        sized.disconnect();
        themed.disconnect();
        document.removeEventListener("visibilitychange", wake);
        window.removeEventListener("pointermove", onPointer);
        geometry.dispose();
        material.dispose();
        renderer.dispose();
        renderer.domElement.remove();
      };
    });

    return () => {
      cancelled = true;
      cleanup();
    };
  }, []);

  return (
    <div
      ref={mount}
      aria-hidden
      className="pointer-events-none absolute inset-0 [mask-image:linear-gradient(to_bottom,black_78%,transparent)]"
    />
  );
}
