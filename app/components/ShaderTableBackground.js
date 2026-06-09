"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

const vertexShader = `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`;

const fragmentShader = `
  precision highp float;

  uniform float uTime;
  uniform vec2 uResolution;
  uniform float uTheme;

  varying vec2 vUv;

  float waveHeight(vec2 p) {
    float r = length(p);
    float w1 = sin(p.x * 8.5 + uTime * 0.95) * 0.07;
    float w2 = cos(p.y * 10.0 - uTime * 0.8) * 0.06;
    float w3 = sin((p.x + p.y) * 12.0 + uTime * 1.3) * 0.035;
    float ripple = sin(r * 15.0 - uTime * 1.7) * 0.025;
    return w1 + w2 + w3 + ripple;
  }

  void main() {
    vec2 uv = vUv;
    vec2 aspect = vec2(uResolution.x / max(uResolution.y, 1.0), 1.0);
    vec2 p = (uv - 0.5) * 2.0 * aspect;

    float height = waveHeight(p);

    float eps = 0.015;
    float hx = waveHeight(p + vec2(eps, 0.0));
    float hy = waveHeight(p + vec2(0.0, eps));
    vec3 normal = normalize(vec3((hx - height) / eps, (hy - height) / eps, 1.2));

    vec3 lightDir = normalize(vec3(-0.45, 0.6, 1.0));
    float diffuse = clamp(dot(normal, lightDir), 0.0, 1.0);
    float spec = pow(clamp(dot(reflect(-lightDir, normal), vec3(0.0, 0.0, 1.0)), 0.0, 1.0), 22.0);

    vec3 darkBase = vec3(0.03, 0.20, 0.14);
    vec3 darkAccent = vec3(0.04, 0.34, 0.23);
    vec3 lightBase = vec3(0.12, 0.43, 0.29);
    vec3 lightAccent = vec3(0.17, 0.58, 0.40);

    vec3 base = mix(lightBase, darkBase, uTheme);
    vec3 accent = mix(lightAccent, darkAccent, uTheme);

    float grain = fract(sin(dot(uv * uResolution.xy + uTime, vec2(12.9898, 78.233))) * 43758.5453123);
    float vignette = smoothstep(1.2, 0.35, length(uv - 0.5));

    vec3 color = mix(base, accent, diffuse * 0.75 + 0.15);
    color += spec * 0.14;
    color += (grain - 0.5) * 0.025;
    color *= vignette;

    gl_FragColor = vec4(color, 0.92);
  }
`;

export default function ShaderTableBackground() {
  const hostRef = useRef(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return undefined;

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const uniforms = {
      uTime: { value: 0 },
      uResolution: { value: new THREE.Vector2(1, 1) },
      uTheme: {
        value: document.documentElement.getAttribute("data-theme") === "dark" ? 1 : 0
      }
    };

    const geometry = new THREE.PlaneGeometry(2, 2);
    const material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader,
      fragmentShader,
      transparent: true
    });

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance"
    });

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    host.appendChild(renderer.domElement);

    const clock = new THREE.Clock();
    let rafId;

    const resize = () => {
      const width = Math.max(host.clientWidth, 1);
      const height = Math.max(host.clientHeight, 1);
      renderer.setSize(width, height, false);
      uniforms.uResolution.value.set(width, height);
    };

    const observer = new ResizeObserver(resize);
    observer.observe(host);
    resize();

    const themeObserver = new MutationObserver(() => {
      uniforms.uTheme.value = document.documentElement.getAttribute("data-theme") === "dark" ? 1 : 0;
    });

    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"]
    });

    const render = () => {
      uniforms.uTime.value = clock.getElapsedTime();
      renderer.render(scene, camera);
      rafId = window.requestAnimationFrame(render);
    };

    render();

    return () => {
      window.cancelAnimationFrame(rafId);
      observer.disconnect();
      themeObserver.disconnect();
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      host.removeChild(renderer.domElement);
    };
  }, []);

  return <div className="shader-table-bg" aria-hidden ref={hostRef} />;
}
