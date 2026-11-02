"use client";

import { useEffect, useRef } from "react";

const LOW_END = () => innerWidth < 768 || navigator.hardwareConcurrency <= 4;

const VERTEX = `
  uniform float uTime;
  uniform vec2 uPointer;
  uniform float uPixelRatio;
  varying float vGlow;
  varying float vDepth;

  void main() {
    vec3 p = position;
    p.y += sin(p.x * 0.45 + uTime * 0.5) * 0.28 + cos(p.z * 0.6 + uTime * 0.35) * 0.22;

    float dist = distance(p.xz, uPointer);
    vGlow = exp(-dist * dist * 0.28);
    p.y += vGlow * 1.1 + sin(dist * 3.0 - uTime * 3.0) * vGlow * 0.18;

    vec4 view = modelViewMatrix * vec4(p, 1.0);
    vDepth = smoothstep(16.0, 3.0, -view.z);
    gl_Position = projectionMatrix * view;
    gl_PointSize = (2.0 + vGlow * 2.4) * uPixelRatio * (9.0 / -view.z);
  }
`;

const FRAGMENT = `
  uniform vec3 uColor;
  varying float vGlow;
  varying float vDepth;

  void main() {
    float edge = 1.0 - smoothstep(0.32, 0.5, distance(gl_PointCoord, vec2(0.5)));
    gl_FragColor = vec4(uColor, edge * vDepth * (0.42 + vGlow * 0.58));
  }
`;

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
      camera.position.set(0, 3.1, 8.6);
      camera.lookAt(0, 0, -1.5);

      const [columns, rows, spacing] = LOW_END() ? [64, 34, 0.54] : [110, 56, 0.32];
      const positions = new Float32Array(columns * rows * 3);
      for (let i = 0; i < columns * rows; i++) {
        positions[i * 3] = ((i % columns) - columns / 2) * spacing;
        positions[i * 3 + 2] = (Math.floor(i / columns) - rows / 2) * spacing - 2;
      }
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

      const accent = () => getComputedStyle(document.documentElement).getPropertyValue("--accent").trim();
      const uniforms = {
        uTime: { value: 0 },
        uPointer: { value: new THREE.Vector2(0, 40) },
        uPixelRatio: { value: pixelRatio },
        uColor: { value: new THREE.Color(accent()) },
      };
      const material = new THREE.ShaderMaterial({
        vertexShader: VERTEX,
        fragmentShader: FRAGMENT,
        uniforms,
        transparent: true,
        depthWrite: false,
      });
      scene.add(new THREE.Points(geometry, material));

      const resize = () => {
        const { clientWidth: width, clientHeight: height } = host;
        renderer.setSize(width, height);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
      };
      resize();

      const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
      const ray = new THREE.Raycaster();
      const pointer = new THREE.Vector2();
      const hit = new THREE.Vector3();
      const target = new THREE.Vector2(0, 40);
      let pointerActive = false;
      const onPointer = (e) => {
        if (e.pointerType !== "mouse") return;
        pointerActive = true;
        const rect = host.getBoundingClientRect();
        pointer.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
        ray.setFromCamera(pointer, camera);
        if (ray.ray.intersectPlane(plane, hit)) target.set(hit.x, hit.z);
      };

      const clock = new THREE.Clock();
      let frame = 0;
      let visible = true;
      const draw = () => {
        const time = clock.getElapsedTime();
        uniforms.uTime.value = time;
        // Touch screens have no cursor, so the ripple drifts by itself.
        if (!pointerActive) target.set(Math.sin(time * 0.3) * 5, Math.cos(time * 0.2) * 1.5 + 1);
        uniforms.uPointer.value.lerp(target, 0.08);
        camera.position.x += (pointer.x * 0.5 - camera.position.x) * 0.03;
        camera.lookAt(0, 0, -1.5);
        renderer.render(scene, camera);
      };
      const loop = () => {
        draw();
        frame = visible && !document.hidden ? requestAnimationFrame(loop) : 0;
      };
      const wake = () => {
        if (!frame && visible && !document.hidden && !reduced) frame = requestAnimationFrame(loop);
      };

      const seen = new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
        wake();
      });
      seen.observe(host);
      const sized = new ResizeObserver(() => {
        resize();
        if (reduced) draw();
      });
      sized.observe(host);
      const themed = new MutationObserver(() => {
        uniforms.uColor.value.set(accent());
        if (reduced) draw();
      });
      themed.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
      document.addEventListener("visibilitychange", wake);

      if (reduced) {
        draw();
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
      className="pointer-events-none absolute inset-0 [mask-image:linear-gradient(to_bottom,black_70%,transparent)]"
    />
  );
}
