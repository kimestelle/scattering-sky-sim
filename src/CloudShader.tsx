import * as THREE from 'three';

const CloudShaderMaterial = new THREE.ShaderMaterial({
    vertexShader: `
        varying vec2 vUv;

        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        precision highp float;

        uniform float time;
        uniform vec2 resolution;
        uniform float cloudOpacity;
        uniform vec2 windDirection;

        varying vec2 vUv;

        float noise(vec2 p) {
            return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453123);
        }

        float fbm(vec2 p) {
            float value = 0.0;
            float scale = 0.5;
            for (int i = 0; i < 5; i++) {
                value += scale * noise(p);
                p *= 2.0;
                scale *= 0.5;
            }
            return value;
        }

        void main() {
            vec2 uv = vUv;

            // wind offset
            vec2 windOffset = windDirection * time * 0.1;
            uv += windOffset;

            // layered fractal noise for depth
            float n = fbm(uv * 2.0);

            // opacity
            vec3 cloudColor = vec3(0.8, 0.8, 0.8) * n;
            gl_FragColor = vec4(cloudColor, cloudOpacity * n);
        }
    `,
    uniforms: {
        time: { value: 0.0 },
        resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
        cloudOpacity: { value: 0.5 },
        windDirection: { value: new THREE.Vector2(1.0, 0.0) },
    },
    transparent: true,
});

export default CloudShaderMaterial;
