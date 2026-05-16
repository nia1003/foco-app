/**
 * PenguinPet3D — Three.js r128 penguin rendered in a WebView.
 * Floating idle animation + drag-to-rotate.
 */
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

interface Props {
  size?: number;
  color?: string;
}

const HTML = `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1">
<style>
* { margin:0; padding:0; box-sizing:border-box; }
body { background:transparent; overflow:hidden; }
canvas { display:block; }
</style>
</head>
<body>
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
<script>
(function(){
  var W = window.innerWidth, H = window.innerHeight;
  var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(W, H);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.outputEncoding = THREE.sRGBEncoding;
  document.body.appendChild(renderer.domElement);

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(42, W / H, 0.1, 100);
  camera.position.z = 5.5;

  scene.add(new THREE.AmbientLight(0xffffff, 0.75));
  var dl = new THREE.DirectionalLight(0xffffff, 0.9);
  dl.position.set(2, 3, 4);
  scene.add(dl);
  var fl = new THREE.DirectionalLight(0xddeeff, 0.4);
  fl.position.set(-2, -1, 2);
  scene.add(fl);

  var grp = new THREE.Group();
  scene.add(grp);

  function mk(geo, hex, rough) {
    return new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
      color: hex, roughness: rough !== undefined ? rough : 0.5, metalness: 0.05
    }));
  }

  // ── Body (dark navy) ────────────────────────────
  var body = mk(new THREE.SphereGeometry(1, 32, 32), 0x1e1e30, 0.42);
  body.scale.set(0.88, 1.16, 0.83);
  grp.add(body);

  // ── Belly (cream) ───────────────────────────────
  var belly = mk(new THREE.SphereGeometry(0.68, 32, 32), 0xfaf5ef, 0.55);
  belly.scale.set(0.80, 1.08, 0.40);
  belly.position.set(0, -0.18, 0.72);
  grp.add(belly);

  // ── Eyes ────────────────────────────────────────
  [[-0.27, 0.56, 0.76], [0.27, 0.56, 0.76]].forEach(function(p) {
    var ew = mk(new THREE.SphereGeometry(0.13, 16, 16), 0xffffff, 0.30);
    ew.position.set(p[0], p[1], p[2]);
    grp.add(ew);
    var ep = mk(new THREE.SphereGeometry(0.078, 12, 12), 0x08080f, 0.25);
    ep.position.set(p[0] * 0.96, p[1] + 0.01, p[2] + 0.115);
    grp.add(ep);
    // specular highlight
    var eh = mk(new THREE.SphereGeometry(0.03, 8, 8), 0xffffff, 0.1);
    eh.position.set(p[0] * 0.88, p[1] + 0.055, p[2] + 0.155);
    grp.add(eh);
  });

  // ── Beak (orange cone pointing forward) ─────────
  var beak = mk(new THREE.ConeGeometry(0.115, 0.27, 8), 0xff8c00, 0.40);
  beak.rotation.x = Math.PI / 2;
  beak.position.set(0, 0.30, 0.93);
  grp.add(beak);

  // ── Wings ───────────────────────────────────────
  [{ x: -0.93, rz: 0.28 }, { x: 0.93, rz: -0.28 }].forEach(function(d) {
    var w = mk(new THREE.SphereGeometry(0.46, 20, 20), 0x1a1a28, 0.42);
    w.scale.set(0.36, 0.86, 0.30);
    w.position.set(d.x, -0.06, 0.04);
    w.rotation.z = d.rz;
    grp.add(w);
  });

  // ── Feet (orange) ───────────────────────────────
  [{ x: -0.30 }, { x: 0.30 }].forEach(function(d) {
    var f = mk(new THREE.SphereGeometry(0.21, 16, 16), 0xff8c00, 0.42);
    f.scale.set(1.55, 0.36, 1.28);
    f.position.set(d.x, -1.30, 0.30);
    grp.add(f);
  });

  grp.scale.setScalar(0.70);

  // ── Interaction ─────────────────────────────────
  var t = 0, isDrag = false, lastX = 0, velX = 0;

  renderer.domElement.addEventListener('touchstart', function(e) {
    isDrag = true; lastX = e.touches[0].clientX; velX = 0;
  }, { passive: true });
  renderer.domElement.addEventListener('touchmove', function(e) {
    var dx = e.touches[0].clientX - lastX;
    grp.rotation.y += dx * 0.012;
    velX = dx * 0.012;
    lastX = e.touches[0].clientX;
  }, { passive: true });
  renderer.domElement.addEventListener('touchend', function() { isDrag = false; });

  (function frame() {
    requestAnimationFrame(frame);
    t += 0.016;
    if (!isDrag) {
      grp.position.y = Math.sin(t * 0.85) * 0.07;
      grp.rotation.y += 0.005;
      if (Math.abs(velX) > 0.001) { grp.rotation.y += velX; velX *= 0.90; }
    }
    renderer.render(scene, camera);
  })();
})();
</script>
</body>
</html>`;

export function PenguinPet3D({ size = 120 }: Props) {
  return (
    <View style={{ width: size, height: size }}>
      <WebView
        source={{ html: HTML }}
        style={StyleSheet.absoluteFill}
        scrollEnabled={false}
        originWhitelist={['*']}
        javaScriptEnabled
        onShouldStartLoadWithRequest={() => true}
        androidLayerType="hardware"
      />
    </View>
  );
}
