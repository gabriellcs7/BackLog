/* Morph Slider shader adapted from React Bits by David Haz.
 * https://reactbits.dev/components/morph-slider
 * License: ../vendor/licenses/react-bits.txt
 * Native WebGL integration: contain framing, on-demand rendering, existing gallery controls.
 */
const vertexShader = `
attribute vec2 position;
attribute vec2 uv;
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;
const fragmentShader = `
precision highp float;

uniform sampler2D tCurrent;
uniform sampler2D tNext;
uniform vec2 uResolution;
uniform vec2 uCurrentSize;
uniform vec2 uNextSize;
uniform float uProgress;
uniform float uDir;
uniform int uMode;
uniform float uIntensity;
uniform float uScale;
uniform float uAberration;
uniform float uDrift;
uniform float uTime;
uniform float uReduce;
uniform vec2 uPointer;
uniform vec3 uOverlay;

varying vec2 vUv;

const float PI = 3.14159265359;

float hash11(float p) {
  p = fract(p * 0.1031);
  p *= p + 33.33;
  p *= p + p;
  return fract(p);
}

float hash21(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = hash21(i);
  float b = hash21(i + vec2(1.0, 0.0));
  float c = hash21(i + vec2(0.0, 1.0));
  float d = hash21(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 5; i++) {
    v += a * noise(p);
    p *= 2.0;
    a *= 0.5;
  }
  return v;
}

mat2 rot(float a) {
  float s = sin(a);
  float c = cos(a);
  return mat2(c, -s, s, c);
}

vec2 coverUV(vec2 uv, vec2 res, vec2 img) {
  float rA = res.x / max(res.y, 1.0);
  float iA = img.x / max(img.y, 1.0);
  vec2 s = vec2(1.0);
  float ratio = rA / max(iA, 0.0001);
  if (ratio > 1.0) {
    s.x = ratio;
  } else {
    s.y = 1.0 / ratio;
  }
  return (uv - 0.5) * s + 0.5;
}

void main() {
  float p = clamp(uProgress, 0.0, 1.0);
  float env = sin(p * PI);

  vec2 uv = vUv;

  uv += vec2(sin(uTime * 0.25 + uv.y * 4.0), cos(uTime * 0.22 + uv.x * 4.0)) * uDrift * 0.008;
  uv = (uv - 0.5) * (1.0 - uDrift * 0.02 * sin(uTime * 0.4)) + 0.5;

  vec2 uvC = uv;
  vec2 uvN = uv;
  float m = smoothstep(0.0, 1.0, p);

  if (uReduce < 0.5) {
    if (uMode == 3) {
      vec2 c = uv - 0.5;
      float r = length(c);
      float ang = env * uIntensity * 3.5 * (1.0 - r);
      uvC = rot(ang) * c + 0.5;
      uvN = rot(-ang) * c + 0.5;
      m = smoothstep(0.0, 1.0, p);
    } else if (uMode == 1) {
      float d = distance(uv, uPointer);
      float ring = p * 1.6;
      float wave = sin((d - ring) * 30.0) * env;
      vec2 dir = normalize(uv - uPointer + 1e-4);
      vec2 disp = dir * wave * uIntensity * 0.25;
      uvC = uv + disp;
      uvN = uv + disp * 0.6;
      m = 1.0 - smoothstep(ring - 0.03, ring + 0.03, d);
    } else if (uMode == 2) {
      float slices = 14.0;
      float row = floor(uv.y * slices);
      float rnd = hash11(row);
      vec2 disp = vec2((rnd - 0.5) * env * uIntensity * 0.6, 0.0);
      uvC = uv + disp;
      uvN = uv + disp;
      float localX = uDir > 0.0 ? uv.x : 1.0 - uv.x;
      float th = p * 1.5 - 0.25 + (rnd - 0.5) * 0.25;
      m = 1.0 - smoothstep(th - 0.06, th + 0.06, localX);
    } else {
      float nn = fbm(uv * uScale + uTime * 0.03);
      float warp = fbm(uv * uScale * 1.7 - uTime * 0.02);
      vec2 g = vec2(nn, warp) - 0.5;
      uvC = uv + g * uIntensity * 0.5 * p;
      uvN = uv - g * uIntensity * 0.5 * (1.0 - p);
      m = smoothstep(nn - 0.15, nn + 0.15, p);
    }
  }

  vec2 sC = coverUV(uvC, uResolution, uCurrentSize);
  vec2 sN = coverUV(uvN, uResolution, uNextSize);

  float ca = uReduce < 0.5 ? uAberration * env * 0.03 : 0.0;

  vec3 colC = vec3(
    texture2D(tCurrent, sC + vec2(ca, 0.0)).r,
    texture2D(tCurrent, sC).g,
    texture2D(tCurrent, sC - vec2(ca, 0.0)).b
  );
  vec3 colN = vec3(
    texture2D(tNext, sN + vec2(ca, 0.0)).r,
    texture2D(tNext, sN).g,
    texture2D(tNext, sN - vec2(ca, 0.0)).b
  );

  float insideC = step(0.0,sC.x)*step(sC.x,1.0)*step(0.0,sC.y)*step(sC.y,1.0);
  float insideN = step(0.0,sN.x)*step(sN.x,1.0)*step(0.0,sN.y)*step(sN.y,1.0);
  colC = mix(uOverlay,colC,insideC);
  colN = mix(uOverlay,colN,insideN);
  vec3 col = mix(colC, colN, m);

  float vig = smoothstep(1.25, 0.25, length(uv - 0.5));
  col = mix(col, uOverlay, (1.0 - vig) * 0.28 * env);

  gl_FragColor = vec4(col, 1.0);
}
`;

export function createGalleryMorph(stage) {
    const canvas = document.createElement('canvas');
    canvas.className = 'game-gallery-morph';
    canvas.setAttribute('aria-hidden', 'true');
    const gl = canvas.getContext('webgl', {
        alpha: false,
        antialias: false,
        powerPreference: 'low-power',
    });
    if (!gl) return null;
    let program,
        buffer,
        frame = 0,
        alive = true,
        textures = [];
    const shaders = [];
    function releaseTextures() {
        for (const texture of textures) gl.deleteTexture(texture);
        textures = [];
    }
    function cancel() {
        cancelAnimationFrame(frame);
        frame = 0;
        canvas.hidden = true;
        releaseTextures();
    }
    function destroy() {
        if (!alive) return;
        cancel();
        alive = false;
        if (buffer) gl.deleteBuffer(buffer);
        if (program) gl.deleteProgram(program);
        for (const shader of shaders) gl.deleteShader(shader);
        canvas.remove();
        gl.getExtension('WEBGL_lose_context')?.loseContext();
    }
    function compile(type, source) {
        const shader = gl.createShader(type);
        shaders.push(shader);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
            throw new Error('Shader unavailable');
        return shader;
    }
    try {
        program = gl.createProgram();
        gl.attachShader(program, compile(gl.VERTEX_SHADER, vertexShader));
        gl.attachShader(program, compile(gl.FRAGMENT_SHADER, fragmentShader));
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS))
            throw new Error('Program unavailable');
        gl.useProgram(program);
        buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(
            gl.ARRAY_BUFFER,
            new Float32Array([-1, -1, 0, 0, 3, -1, 2, 0, -1, 3, 0, 2]),
            gl.STATIC_DRAW
        );
        for (const [name, offset] of [
            ['position', 0],
            ['uv', 8],
        ]) {
            const location = gl.getAttribLocation(program, name);
            gl.enableVertexAttribArray(location);
            gl.vertexAttribPointer(location, 2, gl.FLOAT, false, 16, offset);
        }
    } catch {
        destroy();
        return null;
    }
    const location = Object.fromEntries(
        [
            'tCurrent',
            'tNext',
            'uResolution',
            'uCurrentSize',
            'uNextSize',
            'uProgress',
            'uDir',
            'uMode',
            'uIntensity',
            'uScale',
            'uAberration',
            'uDrift',
            'uTime',
            'uReduce',
            'uPointer',
            'uOverlay',
        ].map((name) => [name, gl.getUniformLocation(program, name)])
    );
    canvas.hidden = true;
    stage.append(canvas);
    canvas.addEventListener(
        'webglcontextlost',
        (event) => {
            event.preventDefault();
            destroy();
        },
        { once: true }
    );
    function upload(image, unit) {
        const texture = gl.createTexture();
        textures.push(texture);
        gl.activeTexture(gl.TEXTURE0 + unit);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    }
    function play(from, to, direction = 1) {
        cancel();
        if (!alive || document.hidden || !from.naturalWidth || !to.naturalWidth) return false;
        try {
            const rect = stage.getBoundingClientRect(),
                dpr = Math.min(devicePixelRatio || 1, 1.5);
            canvas.width = Math.max(1, Math.round(rect.width * dpr));
            canvas.height = Math.max(1, Math.round(rect.height * dpr));
            gl.viewport(0, 0, canvas.width, canvas.height);
            gl.useProgram(program);
            upload(from, 0);
            upload(to, 1);
            gl.uniform1i(location.tCurrent, 0);
            gl.uniform1i(location.tNext, 1);
            gl.uniform2f(location.uResolution, canvas.width, canvas.height);
            gl.uniform2f(location.uCurrentSize, from.naturalWidth, from.naturalHeight);
            gl.uniform2f(location.uNextSize, to.naturalWidth, to.naturalHeight);
            gl.uniform1f(location.uDir, direction);
            gl.uniform1i(location.uMode, 0);
            gl.uniform1f(location.uIntensity, 0.4);
            gl.uniform1f(location.uScale, 2.4);
            gl.uniform1f(location.uAberration, 0.1);
            gl.uniform1f(location.uDrift, 0);
            gl.uniform1f(location.uReduce, 0);
            gl.uniform2f(location.uPointer, 0.5, 0.5);
            gl.uniform3f(location.uOverlay, 8 / 255, 11 / 255, 6 / 255);
            const begin = performance.now();
            const tick = (now) => {
                frame = 0;
                if (!alive || document.hidden) return cancel();
                const progress = Math.min(1, (now - begin) / 1000);
                const eased = progress < 0.5 ? 4 * progress ** 3 : 1 - (-2 * progress + 2) ** 3 / 2;
                gl.uniform1f(location.uProgress, eased);
                gl.uniform1f(location.uTime, (now - begin) / 1000);
                gl.drawArrays(gl.TRIANGLES, 0, 3);
                if (progress < 1) frame = requestAnimationFrame(tick);
                else cancel();
            };
            canvas.hidden = false;
            tick(begin);
            return true;
        } catch {
            cancel();
            return false;
        }
    }
    return { play, cancel, destroy };
}
