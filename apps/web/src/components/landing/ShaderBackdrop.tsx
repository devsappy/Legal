"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

/*
 * A slow, domain-warped noise field behind the landing page.
 * Paper → violet-soft only, so it reads as light on paper rather than a
 * colour gradient, and it fades out below the hero. Renders one frame when
 * the visitor prefers reduced motion, sleeps while the tab is hidden.
 */

const VERT = /* glsl */ `
  void main() { gl_Position = vec4(position, 1.0); }
`;

const FRAG = /* glsl */ `
  precision highp float;
  uniform vec2 uRes;
  uniform float uTime;
  uniform vec3 uPaper;
  uniform vec3 uSoft;
  uniform vec3 uTint;
  uniform float uAmount;

  // Simplex noise (Ashima / Ian McEwan)
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec3 permute(vec3 x) { return mod289(((x * 34.0) + 1.0) * x); }
  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
    vec2 i = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
    m = m * m; m = m * m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
    vec3 g;
    g.x = a0.x * x0.x + h.x * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  float fbm(vec2 p) {
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 3; i++) {
      v += a * snoise(p);
      p = p * 2.0 + 17.0;
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vec2 uv = gl_FragCoord.xy / uRes;
    vec2 p = uv * vec2(uRes.x / uRes.y, 1.0) * 0.8;
    float t = uTime * 0.03;

    // Warp the field with itself so it drifts like slow air
    vec2 q = vec2(fbm(p + t), fbm(p - t * 0.7 + 3.1));
    float n = fbm(p + 1.2 * q + vec2(t * 0.3, -t * 0.2));
    float light = smoothstep(-0.1, 0.7, n);

    // Lives in the hero only: fully paper again by its lower edge
    float fade = smoothstep(0.08, 0.6, uv.y);
    // Keep the left column, where the headline sits, a touch quieter
    float side = 0.6 + 0.4 * smoothstep(0.15, 0.85, uv.x);

    float k = light * fade * side * uAmount;
    vec3 color = mix(uPaper, uSoft, k);
    color = mix(color, uTint, k * k * 0.6);
    gl_FragColor = vec4(color, 1.0);
  }
`;

function cssColor(name: string, fallback: string) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return new THREE.Color(v || fallback);
}

export function ShaderBackdrop() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: "low-power" });
    } catch {
      return; // no WebGL: the plain paper background stays
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const uniforms = {
      uRes: { value: new THREE.Vector2(1, 1) },
      uTime: { value: 0 },
      uPaper: { value: cssColor("--paper", "#fdfdff") },
      uSoft: { value: cssColor("--violet-soft", "#efeafd") },
      uTint: { value: cssColor("--orb-2", "#c9b8ff") },
      uAmount: { value: 0.9 },
    };
    const material = new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: FRAG, uniforms, depthTest: false });
    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
    scene.add(quad);

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const darkMode = window.matchMedia("(prefers-color-scheme: dark)");

    const resize = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      renderer.setSize(w, h, false);
      uniforms.uRes.value.set(renderer.domElement.width, renderer.domElement.height);
    };
    const retheme = () => {
      uniforms.uPaper.value = cssColor("--paper", "#fdfdff");
      uniforms.uSoft.value = cssColor("--violet-soft", "#efeafd");
      uniforms.uTint.value = cssColor("--orb-2", "#c9b8ff");
    };

    let frame = 0;
    let running = false;
    const start = performance.now();
    const draw = () => {
      uniforms.uTime.value = (performance.now() - start) / 1000;
      renderer.render(scene, camera);
    };
    const loop = () => {
      draw();
      frame = requestAnimationFrame(loop);
    };
    const play = () => {
      if (running || reduceMotion.matches || document.hidden) return;
      running = true;
      frame = requestAnimationFrame(loop);
    };
    const pause = () => {
      running = false;
      cancelAnimationFrame(frame);
    };
    const visibility = () => (document.hidden ? pause() : play());
    const motion = () => {
      pause();
      if (reduceMotion.matches) draw();
      else play();
    };
    const theme = () => {
      retheme();
      if (!running) draw();
    };

    resize();
    draw();
    play();

    const ro = new ResizeObserver(() => {
      resize();
      if (!running) draw();
    });
    ro.observe(canvas);
    document.addEventListener("visibilitychange", visibility);
    reduceMotion.addEventListener("change", motion);
    darkMode.addEventListener("change", theme);

    return () => {
      pause();
      ro.disconnect();
      document.removeEventListener("visibilitychange", visibility);
      reduceMotion.removeEventListener("change", motion);
      darkMode.removeEventListener("change", theme);
      quad.geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <canvas
      ref={ref}
      aria-hidden
      className="pointer-events-none absolute inset-x-0 top-0 h-dvh w-full"
    />
  );
}
