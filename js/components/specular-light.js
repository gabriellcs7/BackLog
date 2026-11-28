/* Original Specular Button shader and perimeter math from React Bits by David Haz.
 * https://reactbits.dev/components/specular-button
 * License: ../vendor/licenses/react-bits.txt
 * One shared WebGL renderer copies its light into each control's 2D canvas.
 */
const PAD = 24;
const TAU = Math.PI * 2;

const VERTEX = `#version 300 es
in vec2 aPosition;
void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
}`;

const FRAGMENT = `#version 300 es
precision highp float;
uniform vec2 uCenter;
uniform vec2 uHalf;
uniform float uRadius;
uniform float uPx;
uniform float uSpot;
uniform vec2 uEntry;
uniform vec3 uLineColor;
uniform vec3 uBaseColor;
uniform float uIntensity;
uniform vec2 uWindow;
uniform float uThickness;
uniform float uGlow;
out vec4 outColor;

float roundedBox(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}

float loopPosition(vec2 p, vec2 b, float r) {
  vec2 inner = b - r;
  float arc = 1.5707963 * r;
  float quarter = inner.x + inner.y + arc;
  vec2 a = abs(p);
  vec2 q = a - inner;
  float s = q.x > 0.0 && q.y > 0.0
    ? inner.y + atan(q.y, q.x) * r
    : (q.x > q.y ? min(a.y, inner.y) : inner.y + arc + inner.x - min(a.x, inner.x));
  if (p.x < 0.0) s = p.y >= 0.0 ? 2.0 * quarter - s : 2.0 * quarter + s;
  else if (p.y < 0.0) s = 4.0 * quarter - s;
  return s / max(4.0 * quarter, 0.0001);
}

float lobe(float position, float center) {
  float gap = abs(fract(position - center + 0.5) - 0.5);
  return 1.0 - smoothstep(uWindow.x, uWindow.x + uWindow.y, gap);
}

void main() {
  vec2 p = gl_FragCoord.xy - uCenter;
  float d = roundedBox(p, uHalf, uRadius);
  float position = loopPosition(p, uHalf, uRadius);
  float key = lobe(position, uSpot);
  float back = lobe(position, uSpot + 0.5);
  float streak = key + back * 0.45;
  float width = max(uThickness * uPx * mix(1.0, max(key, back), 0.6), 0.35);
  float band = smoothstep(-width - 0.6, -width + 0.6, d) * (1.0 - smoothstep(-0.6, 0.6, d));
  float hair = smoothstep(-uPx - 0.6, -uPx + 0.6, d) * (1.0 - smoothstep(-0.6, 0.6, d));
  float inside = 1.0 - smoothstep(-0.6, 0.6, d);
  vec2 pool = (p - uEntry) / (uHalf.y * vec2(1.6, 1.1));
  float glow = streak * 0.2 * exp(-abs(d + width * 0.5) / (5.0 * uPx)) + inside * 0.08 * exp(-dot(pool, pool));
  float light = clamp((band * streak + glow * uGlow) * uIntensity, 0.0, 1.0);
  vec4 base = vec4(uBaseColor, 1.0) * hair * 0.6;
  outColor = vec4(uLineColor, 1.0) * light + base * (1.0 - light);
}`;

const UNIFORMS = [
    'uCenter',
    'uHalf',
    'uRadius',
    'uPx',
    'uSpot',
    'uEntry',
    'uLineColor',
    'uBaseColor',
    'uIntensity',
    'uWindow',
    'uThickness',
    'uGlow',
];

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const wrap = (value) => value - Math.floor(value);

const loopPosition = (x, y, halfX, halfY, r) => {
    const innerX = halfX - r;
    const innerY = halfY - r;
    const arc = (Math.PI / 2) * r;
    const quarter = innerX + innerY + arc;
    const ax = Math.abs(x);
    const ay = Math.abs(y);
    const qx = ax - innerX;
    const qy = ay - innerY;
    let s;
    if (qx > 0 && qy > 0) s = innerY + Math.atan2(qy, qx) * r;
    else if (qx > qy) s = Math.min(ay, innerY);
    else s = innerY + arc + innerX - Math.min(ax, innerX);
    if (x < 0) s = y >= 0 ? 2 * quarter - s : 2 * quarter + s;
    else if (y < 0) s = 4 * quarter - s;
    return wrap(s / Math.max(4 * quarter, 0.0001));
};

const rimPoint = (position, halfX, halfY, r) => {
    const innerX = halfX - r;
    const innerY = halfY - r;
    const arc = (Math.PI / 2) * r;
    const quarter = innerX + innerY + arc;
    let s = wrap(position) * 4 * quarter;
    let signX = 1;
    let signY = 1;
    if (s > 3 * quarter) {
        s = 4 * quarter - s;
        signY = -1;
    } else if (s > 2 * quarter) {
        s -= 2 * quarter;
        signX = -1;
        signY = -1;
    } else if (s > quarter) {
        s = 2 * quarter - s;
        signX = -1;
    }
    let x = innerX - (s - innerY - arc);
    let y = halfY;
    if (s <= innerY) {
        x = halfX;
        y = s;
    } else if (s <= innerY + arc) {
        const angle = (s - innerY) / Math.max(r, 0.0001);
        x = innerX + Math.cos(angle) * r;
        y = innerY + Math.sin(angle) * r;
    }
    return [x * signX, y * signY];
};

const compile = (gl, type, source) => {
    const shader = gl.createShader(type);
    if (!shader) return null;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return shader;
    gl.deleteShader(shader);
    return null;
};

const link = (gl) => {
    const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX);
    const fragment = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT);
    const program = gl.createProgram();
    if (!vertex || !fragment || !program) return null;
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.bindAttribLocation(program, 0, 'aPosition');
    gl.linkProgram(program);
    gl.deleteShader(vertex);
    gl.deleteShader(fragment);
    if (gl.getProgramParameter(program, gl.LINK_STATUS)) return program;
    gl.deleteProgram(program);
    return null;
};

export function restSpot(width, height, radius) {
    const r = Math.min(radius, width / 2, height / 2),
        inset = r * (1 - Math.SQRT1_2);
    return loopPosition(inset - width / 2, height / 2 - inset, width / 2, height / 2, r);
}
export function aim(rect, radius, pointer) {
    if (!pointer) return null;
    const halfX = rect.width / 2,
        halfY = rect.height / 2,
        x = pointer.x - rect.left - halfX,
        y = rect.top + halfY - pointer.y;
    const distance = Math.hypot(Math.max(Math.abs(x) - halfX, 0), Math.max(Math.abs(y) - halfY, 0));
    const t = clamp(1 - distance / 180, 0, 1),
        near = t * t * (3 - 2 * t),
        r = Math.min(radius, halfX, halfY);
    const nearest = loopPosition(x, y, halfX, halfY, r);
    if (distance > 0) return { spot: nearest, near };
    const depth = clamp(Math.min(halfX - Math.abs(x), halfY - Math.abs(y)) / (halfY * 0.8), 0, 1);
    const sway = restSpot(rect.width, rect.height, r) - (x / halfX) * 0.06 - (y / halfY) * 0.02;
    const offset = sway - nearest - Math.round(sway - nearest);
    return { spot: wrap(nearest + offset * depth * depth * (3 - 2 * depth)), near };
}
export function createSpecularRenderer() {
    const source = document.createElement('canvas'),
        gl = source.getContext('webgl2', {
            alpha: true,
            premultipliedAlpha: true,
            antialias: false,
            depth: false,
            stencil: false,
            preserveDrawingBuffer: true,
        });
    if (!gl) return null;
    const program = link(gl);
    if (!program) return null;
    const uniforms = Object.fromEntries(
            UNIFORMS.map((name) => [name, gl.getUniformLocation(program, name)])
        ),
        buffer = gl.createBuffer(),
        vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.bindVertexArray(null);
    const probe = document.createElement('canvas').getContext('2d', { willReadFrequently: true }),
        colors = new Map();
    let alive = true;
    function rgb(value) {
        if (colors.has(value)) return colors.get(value);
        probe.clearRect(0, 0, 1, 1);
        probe.fillStyle = value;
        probe.fillRect(0, 0, 1, 1);
        const pixel = probe.getImageData(0, 0, 1, 1).data,
            result = [pixel[0] / 255, pixel[1] / 255, pixel[2] / 255];
        colors.set(value, result);
        return result;
    }
    function destroy() {
        if (!alive) return;
        alive = false;
        gl.deleteBuffer(buffer);
        gl.deleteVertexArray(vao);
        gl.deleteProgram(program);
        gl.getExtension('WEBGL_lose_context')?.loseContext();
    }
    source.addEventListener(
        'webglcontextlost',
        (event) => {
            event.preventDefault();
            alive = false;
        },
        { once: true }
    );
    function draw(output, box, state, color, baseColor) {
        if (!alive) return false;
        const width = box.width,
            height = box.height,
            ratio = Math.min(devicePixelRatio || 1, 2),
            w = Math.max(1, Math.round((width + PAD * 2) * ratio)),
            h = Math.max(1, Math.round((height + PAD * 2) * ratio));
        if (source.width !== w) source.width = w;
        if (source.height !== h) source.height = h;
        const outputWidth = Math.max(
            1,
            Math.round((width + (box.padLeft ?? PAD) + (box.padRight ?? PAD)) * ratio)
        );
        if (output.width !== outputWidth) output.width = outputWidth;
        if (output.height !== h) output.height = h;
        const sx = w / (width + PAD * 2),
            sy = h / (height + PAD * 2),
            r = Math.min(box.radius, width / 2, height / 2);
        gl.viewport(0, 0, w, h);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.useProgram(program);
        gl.uniform2f(uniforms.uCenter, (PAD + width / 2) * sx, (PAD + height / 2) * sy);
        gl.uniform2f(uniforms.uHalf, (width / 2) * sx, (height / 2) * sy);
        gl.uniform1f(uniforms.uRadius, r * sx);
        gl.uniform1f(uniforms.uPx, ratio);
        const [rx, ry] = rimPoint(state.spot, width / 2, height / 2, r),
            pull =
                1 -
                Math.min(0.35 * (height / 2), Math.hypot(rx, ry)) /
                    Math.max(Math.hypot(rx, ry), 0.0001);
        gl.uniform1f(uniforms.uSpot, state.spot);
        gl.uniform2f(uniforms.uEntry, rx * pull * sx, ry * pull * sy);
        gl.uniform3fv(uniforms.uLineColor, rgb(color));
        gl.uniform3fv(uniforms.uBaseColor, rgb(baseColor));
        gl.uniform1f(uniforms.uIntensity, 1.15 * (state.level + state.press * 0.8));
        gl.uniform2f(uniforms.uWindow, 10 / 360 + state.press * 0.06, 34 / 360 + 0.0001);
        gl.uniform1f(uniforms.uThickness, 1.4);
        gl.uniform1f(uniforms.uGlow, 0.6);
        gl.bindVertexArray(vao);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
        gl.bindVertexArray(null);
        const ctx = output.getContext('2d');
        ctx.clearRect(0, 0, outputWidth, h);
        ctx.drawImage(
            source,
            (PAD - (box.padLeft ?? PAD)) * sx,
            0,
            outputWidth,
            h,
            0,
            0,
            outputWidth,
            h
        );
        return true;
    }
    return { draw, destroy };
}
