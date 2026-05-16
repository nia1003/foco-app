/**
 * StayPet3D — fluffy 5-pointed star pet.
 * Lavender body, cute face, slow auto-spin + float idle.
 * Uses same WebView + Three.js r128 pattern as all other pets.
 */
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

interface StayPet3DProps {
  size?: number;
  color?: string;
  interactive?: boolean;
}

function buildHTML(accentHex: string, interactive: boolean): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width,initial-scale=1,user-scalable=no">
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  html,body{width:100%;height:100%;overflow:hidden;background:transparent}
  canvas{display:block;width:100%!important;height:100%!important;filter:saturate(1.25) contrast(1.02)}
</style>
</head>
<body>
<div id="m"></div>
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
<script>
(function(){
  var W=window.innerWidth, H=window.innerHeight;
  var interactive=${interactive ? 'true' : 'false'};

  var renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));
  renderer.setSize(W,H);
  renderer.outputEncoding=THREE.sRGBEncoding;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.05;
  document.getElementById('m').appendChild(renderer.domElement);

  var scene=new THREE.Scene();
  var camera=new THREE.PerspectiveCamera(36,W/H,0.1,100);
  camera.position.set(0,0,9.5);
  camera.lookAt(0,0,0);

  // ── Lighting ─────────────────────────────────
  scene.add(new THREE.AmbientLight(0xffffff,1.10));
  var key=new THREE.DirectionalLight(0xfff0ff,0.85);
  key.position.set(-2,5,6); scene.add(key);
  var fill=new THREE.DirectionalLight(0xe8d0ff,0.50);
  fill.position.set(4,0,5); scene.add(fill);
  var rim=new THREE.DirectionalLight(0xd0c0ff,0.30);
  rim.position.set(0,-3,2); scene.add(rim);

  // ── Materials ────────────────────────────────
  var accent=new THREE.Color('${accentHex}');
  var bodyColor=accent.clone().lerp(new THREE.Color(0xffffff),0.30);
  var starMat=new THREE.MeshStandardMaterial({
    color:bodyColor, roughness:0.62, metalness:0.02
  });
  var faceMat=new THREE.MeshStandardMaterial({
    color:0x3e3050, roughness:0.55, metalness:0.0
  });

  // ── Geometry helpers ─────────────────────────
  var ch=new THREE.Group();
  scene.add(ch);
  var sph=function(r){ return new THREE.SphereGeometry(r,48,48); };

  // ── Center body ──────────────────────────────
  var center=new THREE.Mesh(sph(0.72),starMat);
  center.scale.z=0.72;
  ch.add(center);

  // ── 5 star arms + rounded tips ───────────────
  // Arms start from top (−π/2) and go clockwise.
  var nArms=5;
  for(var i=0;i<nArms;i++){
    var ang=(i/nArms)*Math.PI*2 - Math.PI/2;
    var r=0.88;
    var ax=Math.cos(ang)*r, ay=Math.sin(ang)*r;

    // Arm: sphere elongated along the radial direction.
    // rotation.z = ang rotates local-Y to point outward, then scale elongates it.
    var arm=new THREE.Mesh(sph(0.35),starMat);
    arm.position.set(ax,ay,0);
    arm.rotation.z=ang;
    arm.scale.set(0.80,1.75,0.68);
    ch.add(arm);

    // Rounded tip
    var tip=new THREE.Mesh(sph(0.24),starMat);
    tip.position.set(Math.cos(ang)*1.44, Math.sin(ang)*1.44, 0);
    tip.scale.z=0.70;
    ch.add(tip);
  }

  // ── Eyes ─────────────────────────────────────
  var eGeo=sph(0.085);
  var le=new THREE.Mesh(eGeo,faceMat);
  le.position.set(-0.20,0.18,0.68); le.scale.set(1.0,1.55,0.75);
  ch.add(le);
  var re=new THREE.Mesh(eGeo,faceMat);
  re.position.set(0.20,0.18,0.68);  re.scale.set(1.0,1.55,0.75);
  ch.add(re);

  // ── Smile ────────────────────────────────────
  var smilePts=[
    new THREE.Vector3(-0.18,-0.04,0.68),
    new THREE.Vector3(-0.06,-0.15,0.70),
    new THREE.Vector3( 0.06,-0.15,0.70),
    new THREE.Vector3( 0.18,-0.04,0.68),
  ];
  var smileGeo=new THREE.TubeGeometry(
    new THREE.CatmullRomCurve3(smilePts),18,0.024,8,false
  );
  ch.add(new THREE.Mesh(smileGeo,faceMat));

  ch.scale.setScalar(0.84);

  // ── Interaction ──────────────────────────────
  var dragY=0, rotX=0.02, tDragY=0, tX=0.02, dragging=false, lx=0, ly=0;
  if(interactive){
    renderer.domElement.addEventListener('pointerdown',function(e){
      dragging=true; lx=e.clientX; ly=e.clientY;
    });
    window.addEventListener('pointermove',function(e){
      if(!dragging) return;
      tDragY+=(e.clientX-lx)*0.007;
      tX+=(e.clientY-ly)*0.004;
      tX=Math.max(-0.40,Math.min(0.40,tX));
      lx=e.clientX; ly=e.clientY;
    });
    window.addEventListener('pointerup',function(){ dragging=false; });
  }

  // ── Render loop ───────────────────────────────
  // Auto-spin at 0.40 rad/s (matches user's delta*0.4 reference).
  // User drag adds an offset on top.
  var start=performance.now();
  (function tick(){
    var t=(performance.now()-start)/1000;
    dragY+=(tDragY-dragY)*0.10;
    rotX+=(tX-rotX)*0.10;
    ch.position.y=Math.sin(t*0.75)*0.09;
    ch.rotation.z=Math.sin(t*0.50)*0.022;
    ch.rotation.y=t*0.40 + dragY;   // auto-spin + user drag offset
    ch.rotation.x=rotX;
    renderer.render(scene,camera);
    requestAnimationFrame(tick);
  })();
})();
</script>
</body>
</html>`;
}

export function StayPet3D({
  size = 120,
  color = '#C4A8E8',
  interactive = true,
}: StayPet3DProps) {
  const html = buildHTML(color, interactive);
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <WebView
        source={{ html }}
        style={styles.webview}
        scrollEnabled={false}
        bounces={false}
        overScrollMode="never"
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        backgroundColor="transparent"
        renderToHardwareTextureAndroid
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        originWhitelist={['*']}
        javaScriptEnabled
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { overflow: 'hidden', backgroundColor: 'transparent' },
  webview: { flex: 1, backgroundColor: 'transparent' },
});
