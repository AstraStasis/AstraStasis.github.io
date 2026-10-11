/*
 * WebGL scene - a displaced, iridescent orb with a particle ring, floating dust and bloom.
 * Loaded as a classic script and pulls Three.js through dynamic import(), so the page
 * works both from a local server and when index.html is opened directly from disk.
 * Reads shared state from window.WORLD (written by script.js).
 */
(async () => {
  const W = window.WORLD;
  if (!W) return;
  const statusEl = document.getElementById("loaderStatus");
  const status = (t) => statusEl && (statusEl.textContent = t);
  const fail = (err) => {
    console.warn("[scene] WebGL disabled:", err);
    document.body.classList.add("no-webgl");
    W.sceneReady = true;
  };

  let THREE, EffectComposer, RenderPass, UnrealBloomPass, OutputPass;
  try {
    status("Loading engine.");
    [THREE, { EffectComposer }, { RenderPass }, { UnrealBloomPass }, { OutputPass }] = await Promise.all([
      import("three"),
      import("three/addons/postprocessing/EffectComposer.js"),
      import("three/addons/postprocessing/RenderPass.js"),
      import("three/addons/postprocessing/UnrealBloomPass.js"),
      import("three/addons/postprocessing/OutputPass.js"),
    ]);
  } catch (e) {
    return fail(e);
  }

  status("Compiling shaders.");
  const canvas = document.getElementById("webgl");
  const isMobile = () => innerWidth < 800;
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: "high-performance" });
  } catch (e) {
    return fail(e);
  }
  const DPR = Math.min(devicePixelRatio, isMobile() ? 1 : 1.5);
  renderer.setPixelRatio(DPR);
  renderer.setSize(innerWidth, innerHeight, false);
  renderer.setClearColor(0x050507, 1);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, innerWidth / innerHeight, 0.1, 100);
  camera.position.set(0, 0, 6);

  // Beveled app badges and a modeled brush float in the same lit 3D space.
  scene.add(new THREE.AmbientLight(0xbec8ff, 1.6));
  const studioLight = new THREE.DirectionalLight(0xffe5d3, 3);
  studioLight.position.set(-3, 5, 5); scene.add(studioLight);
  const creativeObjects = [];
  function badge(label, base, ink) {
    const face = document.createElement("canvas"); face.width = face.height = 256;
    const ctx = face.getContext("2d");
    ctx.fillStyle = base; ctx.fillRect(0, 0, 256, 256);
    ctx.fillStyle = ink; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.font = "600 132px Arial";
    if (label !== "GitHub") ctx.fillText(label, 128, 138);
    else {
      ctx.beginPath();ctx.arc(128,108,62,0,Math.PI*2);ctx.fill();
      ctx.beginPath();ctx.moveTo(72,85);ctx.lineTo(73,32);ctx.lineTo(107,56);ctx.moveTo(149,56);ctx.lineTo(183,32);ctx.lineTo(184,85);ctx.fill();
      ctx.fillRect(111,155,34,39);
      ctx.strokeStyle=ink;ctx.lineWidth=13;ctx.lineCap="round";
      ctx.beginPath();ctx.moveTo(114,175);ctx.bezierCurveTo(60,187,82,148,48,149);ctx.stroke();
      ctx.font="600 29px Arial";ctx.fillText("GitHub",128,222);
    }
    const texture = new THREE.CanvasTexture(face);texture.colorSpace=THREE.SRGBColorSpace;
    const shape = new THREE.Shape(), s=.48, r=.1;
    shape.moveTo(-s+r,-s);shape.lineTo(s-r,-s);shape.quadraticCurveTo(s,-s,s,-s+r);
    shape.lineTo(s,s-r);shape.quadraticCurveTo(s,s,s-r,s);shape.lineTo(-s+r,s);
    shape.quadraticCurveTo(-s,s,-s,s-r);shape.lineTo(-s,-s+r);shape.quadraticCurveTo(-s,-s,-s+r,-s);
    const object = new THREE.Group();
    const body = new THREE.Mesh(new THREE.ExtrudeGeometry(shape,{depth:.12,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:.025,bevelThickness:.025,curveSegments:5}),new THREE.MeshStandardMaterial({color:base,metalness:.55,roughness:.3}));
    const front = new THREE.Mesh(new THREE.PlaneGeometry(.87,.87),new THREE.MeshStandardMaterial({map:texture,roughness:.5,metalness:.12}));
    front.position.z=.148;object.add(body,front);return object;
  }
  creativeObjects.push(badge("Ae","#17113c","#b0a0ff"),badge("Pr","#21103d","#dbabff"),badge("GitHub","#10151d","#ece8e1"));
  const brush = new THREE.Group();
  const handle = new THREE.Mesh(new THREE.CylinderGeometry(.055,.095,1.05,12),new THREE.MeshStandardMaterial({color:0x472b65,metalness:.35,roughness:.3}));
  const ferrule = new THREE.Mesh(new THREE.CylinderGeometry(.095,.065,.3,12),new THREE.MeshStandardMaterial({color:0xc6b3d9,metalness:.9,roughness:.22}));
  ferrule.position.y=.65;
  const tip = new THREE.Mesh(new THREE.ConeGeometry(.095,.4,12),new THREE.MeshStandardMaterial({color:0xffa174,metalness:.1,roughness:.65}));
  tip.position.y=1;brush.add(handle,ferrule,tip);brush.rotation.z=-.5;creativeObjects.push(brush);
  creativeObjects.forEach(object=>scene.add(object));

  /* ������������� Orb shaders ������������� */
  const NOISE = /* glsl */ `
    vec3 mod289(vec3 x){ return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 mod289(vec4 x){ return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 permute(vec4 x){ return mod289(((x * 34.0) + 1.0) * x); }
    vec4 taylorInvSqrt(vec4 r){ return 1.79284291400159 - 0.85373472095314 * r; }
    float snoise(vec3 v){
      const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
      const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
      vec3 i  = floor(v + dot(v, C.yyy));
      vec3 x0 = v - i + dot(i, C.xxx);
      vec3 g = step(x0.yzx, x0.xyz);
      vec3 l = 1.0 - g;
      vec3 i1 = min(g.xyz, l.zxy);
      vec3 i2 = max(g.xyz, l.zxy);
      vec3 x1 = x0 - i1 + C.xxx;
      vec3 x2 = x0 - i2 + C.yyy;
      vec3 x3 = x0 - D.yyy;
      i = mod289(i);
      vec4 p = permute(permute(permute(
                i.z + vec4(0.0, i1.z, i2.z, 1.0))
              + i.y + vec4(0.0, i1.y, i2.y, 1.0))
              + i.x + vec4(0.0, i1.x, i2.x, 1.0));
      float n_ = 0.142857142857;
      vec3 ns = n_ * D.wyz - D.xzx;
      vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
      vec4 x_ = floor(j * ns.z);
      vec4 y_ = floor(j - 7.0 * x_);
      vec4 x = x_ * ns.x + ns.yyyy;
      vec4 y = y_ * ns.x + ns.yyyy;
      vec4 h = 1.0 - abs(x) - abs(y);
      vec4 b0 = vec4(x.xy, y.xy);
      vec4 b1 = vec4(x.zw, y.zw);
      vec4 s0 = floor(b0) * 2.0 + 1.0;
      vec4 s1 = floor(b1) * 2.0 + 1.0;
      vec4 sh = -step(h, vec4(0.0));
      vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
      vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
      vec3 p0 = vec3(a0.xy, h.x);
      vec3 p1 = vec3(a0.zw, h.y);
      vec3 p2 = vec3(a1.xy, h.z);
      vec3 p3 = vec3(a1.zw, h.w);
      vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
      p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
      vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
      m = m * m;
      return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
    }
  `;

  const blobVS = /* glsl */ `
    uniform float uTime;
    uniform float uDistort;
    uniform float uFreq;
    uniform float uPulse;
    uniform vec3 uPulseOrigin;
    uniform vec3 uMouse;
    uniform float uMouseStr;
    varying vec3 vNormal;
    varying vec3 vViewPos;
    varying float vDisp;
    ${NOISE}

    float displacement(vec3 n){
      float t = uTime * 0.22;
      float d = snoise(n * uFreq + vec3(t, t * 0.7, -t * 0.4)) * uDistort;
      d += snoise(n * uFreq * 2.4 - vec3(t * 1.3)) * uDistort * 0.32;
      // bulge toward the cursor
      float md = distance(n, uMouse);
      d += (1.0 - smoothstep(0.0, 0.9, md)) * 0.22 * uMouseStr;
      // click shockwave
      float pd = distance(n, uPulseOrigin);
      d += sin(pd * 16.0 - uTime * 18.0) * 0.09 * uPulse * (1.0 - smoothstep(0.0, 2.0, pd));
      return d;
    }
    vec3 displaced(vec3 n){ return n * (1.0 + displacement(n)); }

    void main(){
      vec3 n = normalize(position);
      vec3 helper = abs(n.y) < 0.99 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0);
      vec3 t = normalize(cross(n, helper));
      vec3 b = normalize(cross(n, t));
      float eps = 0.008;
      vec3 p0 = displaced(n);
      vec3 p1 = displaced(normalize(n + t * eps));
      vec3 p2 = displaced(normalize(n + b * eps));
      vec3 dn = normalize(cross(p1 - p0, p2 - p0));

      vDisp = length(p0) - 1.0;
      vNormal = normalize(normalMatrix * dn);
      vec4 mv = modelViewMatrix * vec4(p0, 1.0);
      vViewPos = mv.xyz;
      gl_Position = projectionMatrix * mv;
    }
  `;

  const blobFS = /* glsl */ `
    uniform float uTime;
    uniform float uHue;
    uniform float uBright;
    uniform vec3 uLight;
    varying vec3 vNormal;
    varying vec3 vViewPos;
    varying float vDisp;

    vec3 palette(float t){
      vec3 a = vec3(0.5);
      vec3 b = vec3(0.5);
      vec3 c = vec3(1.0);
      vec3 d = vec3(0.0, 0.18, 0.32) + uHue;
      return a + b * cos(6.28318 * (c * t + d));
    }

    void main(){
      vec3 N = normalize(vNormal);
      vec3 V = normalize(-vViewPos);
      float ndv = clamp(dot(N, V), 0.0, 1.0);
      float fres = pow(1.0 - ndv, 3.0);
      vec3 L = normalize(uLight);
      float diff = clamp(dot(N, L), 0.0, 1.0);
      vec3 H = normalize(L + V);
      float spec = pow(clamp(dot(N, H), 0.0, 1.0), 90.0);

      vec3 irid = palette(fres * 0.9 + vDisp * 2.2 + uTime * 0.02);
      vec3 col = vec3(0.003, 0.003, 0.006);
      col += irid * diff * 0.10;
      col += irid * fres * 1.7;
      col += vec3(1.0, 0.96, 0.92) * spec * 0.9;
      gl_FragColor = vec4(col * uBright, 1.0);
    }
  `;

  const blobUniforms = {
    uTime: { value: 0 },
    uDistort: { value: 0.3 },
    uFreq: { value: 1.1 },
    uPulse: { value: 0 },
    uPulseOrigin: { value: new THREE.Vector3(0, 0, 1) },
    uMouse: { value: new THREE.Vector3(0, 0, 1) },
    uMouseStr: { value: 0 },
    uHue: { value: 0 },
    uBright: { value: 1 },
    uLight: { value: new THREE.Vector3(1, 1, 2) },
  };
  const seg = isMobile() ? 48 : 96;
  const blob = new THREE.Mesh(
    new THREE.SphereGeometry(1, seg, seg),
    new THREE.ShaderMaterial({ uniforms: blobUniforms, vertexShader: blobVS, fragmentShader: blobFS })
  );
  const group = new THREE.Group();
  group.add(blob);
  scene.add(group);

  // Invisible proxy for cheap cursor raycasting
  const hit = new THREE.Mesh(new THREE.SphereGeometry(1.08, 24, 24), new THREE.MeshBasicMaterial());
  hit.visible = false;
  group.add(hit);

  // Faint wireframe shell
  const shell = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(1.6, 1)),
    new THREE.LineBasicMaterial({ color: 0xece8e1, transparent: true, opacity: 0.07, depthWrite: false })
  );
  group.add(shell);

  /* ������������� Particles (dust field + orbit ring) ������������� */
  const pointsVS = /* glsl */ `
    uniform float uTime;
    uniform float uSize;
    uniform float uPR;
    uniform float uDrift;
    attribute float aSeed;
    varying float vAlpha;
    void main(){
      vec3 p = position;
      p.x += sin(uTime * 0.12 + aSeed * 6.2831) * uDrift;
      p.y += cos(uTime * 0.10 + aSeed * 12.566) * uDrift;
      vec4 mv = modelViewMatrix * vec4(p, 1.0);
      gl_Position = projectionMatrix * mv;
      gl_PointSize = uSize * uPR * (0.35 + aSeed) / -mv.z;
      float tw = 0.35 + 0.65 * abs(sin(uTime * 0.7 + aSeed * 40.0));
      vAlpha = tw * (1.0 - smoothstep(4.0, 26.0, -mv.z));
    }
  `;
  const pointsFS = /* glsl */ `
    uniform vec3 uColor;
    uniform float uOpacity;
    varying float vAlpha;
    void main(){
      float d = length(gl_PointCoord - 0.5);
      float a = 1.0 - smoothstep(0.0, 0.5, d);
      gl_FragColor = vec4(uColor, a * a * vAlpha * uOpacity);
    }
  `;
  function makePoints(positions, seeds, { size, color, opacity, drift }) {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    g.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
    const m = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uSize: { value: size },
        uPR: { value: DPR },
        uDrift: { value: drift },
        uColor: { value: new THREE.Color(color) },
        uOpacity: { value: opacity },
      },
      vertexShader: pointsVS,
      fragmentShader: pointsFS,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    return new THREE.Points(g, m);
  }

  const DUST = isMobile() ? 200 : 650;
  const dPos = new Float32Array(DUST * 3);
  const dSeed = new Float32Array(DUST);
  for (let i = 0; i < DUST; i++) {
    dPos[i * 3] = (Math.random() - 0.5) * 28;
    dPos[i * 3 + 1] = (Math.random() - 0.5) * 28;
    dPos[i * 3 + 2] = 3 - Math.random() * 18;
    dSeed[i] = Math.random();
  }
  const dust = makePoints(dPos, dSeed, { size: 42, color: 0xffe6d0, opacity: 0.5, drift: 0.25 });
  scene.add(dust);

  const RING = isMobile() ? 350 : 900;
  const rPos = new Float32Array(RING * 3);
  const rSeed = new Float32Array(RING);
  for (let i = 0; i < RING; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = 1.9 + Math.pow(Math.random(), 2) * 0.9;
    rPos[i * 3] = Math.cos(a) * r;
    rPos[i * 3 + 1] = (Math.random() - 0.5) * 0.05;
    rPos[i * 3 + 2] = Math.sin(a) * r;
    rSeed[i] = Math.random();
  }
  const ring = makePoints(rPos, rSeed, { size: 16, color: 0xffffff, opacity: 0.9, drift: 0.02 });
  const ringPivot = new THREE.Group();
  ringPivot.rotation.set(1.15, 0, 0.35);
  ringPivot.add(ring);
  group.add(ringPivot);

  // One low-cost shader plane paints a flowing aurora behind the existing scene.
  const skyUniforms = { uTime: { value: 0 }, uHue: { value: 0 }, uPulse: { value: 0 } };
  const aurora = new THREE.Mesh(
    new THREE.PlaneGeometry(42, 26),
    new THREE.ShaderMaterial({
      uniforms: skyUniforms, transparent: true, depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexShader: "varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}",
      fragmentShader: `
        varying vec2 vUv;
        uniform float uTime, uHue, uPulse;
        void main(){
          vec2 p=vUv;
          float t=uTime*.075;
          float wave=.48+.11*sin(p.x*7.+t)+.045*sin(p.x*17.-t*1.6);
          float curtain=exp(-abs(p.y-wave)*18.);
          float folds=.5+.5*sin(p.x*40.+sin(p.x*12.+t)*3.+t);
          float fine=exp(-abs(p.y-wave-.018*sin(p.x*32.-t))*140.);
          vec3 cyan=vec3(.12,.62,.7), violet=vec3(.44,.16,.64), coral=vec3(.75,.25,.13);
          vec3 color=mix(cyan,violet,.5+.5*sin(p.x*8.+t+uHue*6.));
          color=mix(color,coral,.22+.18*sin(t*.7+p.y*4.));
          float edge=smoothstep(0.,.16,p.x)*(1.-smoothstep(.84,1.,p.x));
          float nebula=exp(-length((p-vec2(.64,.5))*vec2(2.,3.))*3.)*.15;
          float glow=(curtain*(.1+folds*.11)+fine*.19+nebula)*edge;
          gl_FragColor=vec4(color,glow*(1.+uPulse*.8));
        }`
    })
  );
  aurora.position.set(0, 1, -9); scene.add(aurora);

  // Thin emissive orbits and moving glints share the existing animation loop.
  const lightOrbits = new THREE.Group();
  const orbitColors = [0x88e8f2, 0xb7a0ff, 0xffa274];
  const glints = [];
  for (let j = 0; j < 3; j++) {
    const pivot = new THREE.Group();
    pivot.rotation.set(.6 + j * .55, .2 + j * .4, -.4 + j * .55);
    const radius = 1.65 + j * .24;
    const orbit = new THREE.Mesh(
      new THREE.TorusGeometry(radius, .006, 4, isMobile() ? 90 : 160),
      new THREE.MeshBasicMaterial({ color: orbitColors[j], transparent: true, opacity: .38, depthWrite: false, blending: THREE.AdditiveBlending })
    );
    pivot.add(orbit);
    const glint = new THREE.Mesh(new THREE.SphereGeometry(.028, 8, 6), new THREE.MeshBasicMaterial({color:orbitColors[j]}));
    pivot.add(glint); glints.push({ glint, radius, pivot, orbit });
    lightOrbits.add(pivot);
  }
  group.add(lightOrbits);
  const meteors = [];
  for (let j = 0; j < (isMobile() ? 1 : 3); j++) {
    const vertices = [], colors = [];
    for(let n=0;n<30;n++){
      const f=n/29;
      vertices.push(-f*1.5,f*.48,0);
      colors.push((1-f)*.55,(1-f)*.8,1-f);
    }
    const g=new THREE.BufferGeometry();
    g.setAttribute("position",new THREE.Float32BufferAttribute(vertices,3));
    g.setAttribute("color",new THREE.Float32BufferAttribute(colors,3));
    const line=new THREE.Line(g,new THREE.LineBasicMaterial({vertexColors:true,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false}));
    scene.add(line);meteors.push(line);
  }

  /* ������������� Post-processing ������������� */
  const composer = new EffectComposer(renderer);
  composer.setPixelRatio(DPR);
  composer.setSize(innerWidth, innerHeight);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.6, 0.65, 0.18);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  /* ������������� Scroll choreography: one keyframe per section ������������� */
  const KF = [
    { x: 1.25, y: 0.05, z: 0.0, s: 1.1, distort: 0.3, freq: 1.1, hue: 0.0, bright: 1.0, ring: 1.0 }, // hero
    { x: 1.9, y: 0.3, z: -0.6, s: 0.8, distort: 0.18, freq: 1.7, hue: 0.12, bright: 0.85, ring: 0.6 }, // about
    { x: -1.4, y: 0.2, z: -2, s: 1.1, distort: 0.35, freq: 1.2, hue: 0.4, bright: 0.5, ring: 0.4 }, // motion
    { x: 0.0, y: 0.0, z: -3.5, s: 1.5, distort: 0.42, freq: 0.9, hue: 0.3, bright: 0.45, ring: 0.25 }, // artworks
    { anchor: ".sphere-wrap", z: -0.5, sFactor: 0.5, distort: 0.25, freq: 2.0, hue: 0.55, bright: 1.0, ring: 0.0 }, // toolkit: sits inside the tag sphere
    { x: 1.7, y: 0.5, z: -0.8, s: 1.0, distort: 0.5, freq: 1.3, hue: 0.8, bright: 0.7, ring: 0.9 }, // contact
  ];
  const tmpV = new THREE.Vector3();
  const tmpDir = new THREE.Vector3();
  function resolveKF(k) {
    if (!k.anchor) {
      if (!isMobile()) return k;
      return { ...k, x: k.x * 0.2, y: k.y + 0.3, s: k.s * 0.5, bright: k.bright * 0.45 };
    }
    // Project a DOM element's centre into the 3D world at depth k.z
    const el = document.querySelector(k.anchor);
    const r = el.getBoundingClientRect();
    const ndcX = ((r.left + r.width / 2) / innerWidth) * 2 - 1;
    const ndcY = -((r.top + r.height / 2) / innerHeight) * 2 + 1;
    tmpV.set(ndcX, ndcY, 0.5).unproject(camera);
    tmpDir.copy(tmpV).sub(camera.position).normalize();
    const dist = (k.z - camera.position.z) / tmpDir.z;
    const pos = tmpV.copy(camera.position).addScaledVector(tmpDir, dist);
    const depth = camera.position.z - k.z;
    const unitsPerPx = (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * depth) / innerHeight;
    const s = Math.min(r.width, r.height) * 0.4 * k.sFactor * unitsPerPx;
    return { ...k, x: pos.x, y: pos.y, s };
  }

  /* ������������� Loop ������������� */
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const localMouse = new THREE.Vector3(0, 0, 1);
  const state = { x: KF[0].x, y: KF[0].y, z: 0, s: KF[0].s, distort: 0.3, freq: 1.1, hue: 0, bright: 1, ring: 1 };
  const LERP_KEYS = ["x", "y", "z", "s", "distort", "freq", "bright", "ring"];
  const timeScale = 1;
  const smooth = (t) => t * t * (3 - 2 * t);
  const timer = new THREE.Clock();
  let time = 0, mouseStr = 0, tiltX = 0, tiltY = 0;

  let frameId = 0;
  function frame() {
    frameId = 0;
    if (W.sceneReady && (W.paused || W.modal || document.hidden)) return;
    const dt = Math.min(timer.getDelta(), 0.05);
    const surge = W.universeBoost || 0;
    time += dt * timeScale * (1 + surge * 3);
    const k = 1 - Math.exp(-dt * 3.2);

    // Blend between the two keyframes around the current scroll position
    const v = Math.min(Math.max(W.scroll, 0), KF.length - 1);
    const i = Math.min(Math.floor(v), KF.length - 2);
    const f = smooth(v - i);
    const a = resolveKF(KF[i]);
    const b = resolveKF(KF[i + 1]);
    for (const key of LERP_KEYS) state[key] += (a[key] + (b[key] - a[key]) * f - state[key]) * k;
    const hueTarget = (W.hue ?? a.hue + (b.hue - a.hue) * f) + W.hueShift;
    state.hue += (hueTarget - state.hue) * k;

    // Cursor  orb
    ndc.set(W.pointer.nx, W.pointer.ny);
    raycaster.setFromCamera(ndc, camera);
    const hits = W.modal ? [] : raycaster.intersectObject(hit, false);
    const over = hits.length > 0;
    W.blobHover = over;
    if (over) {
      localMouse.copy(hits[0].point);
      blob.worldToLocal(localMouse).normalize();
      blobUniforms.uMouse.value.lerp(localMouse, 0.2).normalize();
    }
    mouseStr += ((over ? 1 : 0) - mouseStr) * (1 - Math.exp(-dt * 5));

    // Shockwave requests from the UI
    if (W.pulse > 0) {
      blobUniforms.uPulse.value = Math.max(blobUniforms.uPulse.value, W.pulse);
      if (over) blobUniforms.uPulseOrigin.value.copy(localMouse);
      else blobUniforms.uPulseOrigin.value.randomDirection();
      W.pulse = 0;
    }
    blobUniforms.uPulse.value *= Math.exp(-dt * 1.4);

    // Transforms
    group.position.set(state.x, state.y, state.z);
    group.scale.setScalar(state.s * (1 + blobUniforms.uPulse.value * 0.06 + surge*.3));
    tiltX += (W.pointer.ny * 0.35 - tiltX) * k;
    tiltY += (W.pointer.nx * 0.5 - tiltY) * k;
    group.rotation.set(-tiltX + Math.sin(time)*surge*.25, tiltY + surge*.6, Math.sin(time*.6)*surge*.2);
    blob.rotation.y += dt * 0.12 * timeScale;
    shell.rotation.y -= dt * 0.05 * timeScale;
    shell.rotation.x += dt * 0.03 * timeScale;
    ring.rotation.y += dt * 0.1 * timeScale;
    skyUniforms.uTime.value = time;
    creativeObjects.forEach((object,j)=>{
      const mobile=isMobile(),side=j%2===0?-1:1;
      object.position.set(side*(mobile?1.05:2.6)+Math.sin(time*.23+j)*.12,(j<2?1.35:-1.3)+Math.sin(time*.36+j*1.8)*.17,-1-j*.28);
      object.scale.setScalar(mobile?.36:.55);
      object.rotation.y=Math.sin(time*.27+j)*.4;
      object.rotation.x=Math.sin(time*.19+j)*.15;
      object.rotation.z=(j===3?-.5:side*.12)+Math.sin(time*.22+j)*.08;
    });
    skyUniforms.uHue.value = state.hue;
    skyUniforms.uPulse.value = blobUniforms.uPulse.value + surge*2;
    lightOrbits.rotation.y = time * .035 + surge*Math.sin(time*.6);
    lightOrbits.scale.setScalar(1+surge*.5);
    glints.forEach(({glint, radius, orbit}, j) => {
      const angle = time * (.23 + j * .09) + j * 2;
      glint.position.set(Math.cos(angle)*radius, Math.sin(angle)*radius, 0);
      orbit.material.opacity = (.2 + state.ring * .23) * (isMobile() ? .65 : 1);
    });
    meteors.forEach((meteor, j) => {
      const cycle = (time + j * 3.7) % 14;
      const progress = cycle / 2.8;
      meteor.visible = progress < 1;
      if(meteor.visible){
        meteor.position.set(-7 + progress * 14, 4 - progress * 4 - j * .4, -4 - j);
        meteor.material.opacity = Math.sin(progress * Math.PI) * .65;
      }
    });

    // Uniforms
    blobUniforms.uTime.value = time;
    blobUniforms.uDistort.value = state.distort + surge*.4;
    blobUniforms.uFreq.value = state.freq;
    blobUniforms.uHue.value = state.hue + surge*.35;
    blobUniforms.uBright.value = state.bright;
    blobUniforms.uMouseStr.value = mouseStr;
    blobUniforms.uLight.value.set(W.pointer.nx * 3, W.pointer.ny * 3 + 1, 2.5);
    ring.material.uniforms.uTime.value = time;
    ring.material.uniforms.uOpacity.value = 0.9 * state.ring;
    dust.material.uniforms.uTime.value = time;
    shell.material.opacity = 0.07 * state.bright;
    dust.position.y = W.scroll * 1.2; // depth parallax while scrolling

    // Camera parallax
    camera.position.x += (W.pointer.nx * 0.35 - camera.position.x) * k;
    camera.position.y += (W.pointer.ny * 0.25 - camera.position.y) * k;
    camera.lookAt(0, 0, 0);

    composer.render(dt);
    if (!W.sceneReady) {
      W.sceneReady = true;
      status("Ready");
    }
    frameId = requestAnimationFrame(frame);
  }

  addEventListener("portfolio:resume", () => {
    if (!frameId && !W.paused && !W.modal && !document.hidden) { timer.getDelta(); frameId = requestAnimationFrame(frame); }
  });
  canvas.addEventListener("webglcontextlost", e => { e.preventDefault(); cancelAnimationFrame(frameId); fail("Context lost"); });
  addEventListener("resize", () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight, false);
    composer.setSize(innerWidth, innerHeight);
  });

  frameId = requestAnimationFrame(frame);
})().catch(error => { console.warn("[scene] Using static background:", error); document.body.classList.add("no-webgl"); if (window.WORLD) window.WORLD.sceneReady = true; });
