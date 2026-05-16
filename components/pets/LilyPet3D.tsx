/**
 * LilyPet3D — Three.js r128 flower pet rendered in a WebView.
 * Same approach as XingWangPet3D:
 *   - pointerdown/pointermove/pointerup for drag-to-rotate
 *   - buildHTML(color, interactive) pattern
 *   - ACESFilmic tone-mapping + PCFSoft shadow map + sRGB encoding
 *   - identical WebView props
 *
 * Design: 6 glossy petals, yellow face, green stem + leaves + base.
 */
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

interface LilyPet3DProps {
  size?: number;
  color?: string;
  interactive?: boolean;
}

function buildHTML(color: string, interactive: boolean): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width,initial-scale=1,user-scalable=no">
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  html,body{width:100%;height:100%;overflow:hidden;background:transparent}
  canvas{display:block;width:100%!important;height:100%!important;filter:saturate(1.6) contrast(1.05)}
</style>
</head>
<body>
<div id="m"></div>
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
<script>
(function(){
  var W=window.innerWidth, H=window.innerHeight;
  var interactive=${interactive ? 'true' : 'false'};
  var accentHex='${color}';

  // ── Renderer (same setup as XingWang) ──────────
  var renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));
  renderer.setSize(W,H);
  renderer.shadowMap.enabled=true;
  renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  renderer.outputEncoding=THREE.sRGBEncoding;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.05;
  document.getElementById('m').appendChild(renderer.domElement);

  var scene=new THREE.Scene();
  var camera=new THREE.PerspectiveCamera(40,W/H,0.1,100);
  camera.position.set(0,0.5,6.5);
  camera.lookAt(0,0.2,0);

  // ── Lighting ────────────────────────────────────
  scene.add(new THREE.AmbientLight(0xffffff,0.9));
  var key=new THREE.DirectionalLight(0xfff0f5,1.4);
  key.position.set(-3,6,5); key.castShadow=true;
  key.shadow.mapSize.set(1024,1024);
  scene.add(key);
  var fill=new THREE.DirectionalLight(0xffe8f5,0.5);
  fill.position.set(4,2,3);
  scene.add(fill);
  var bot=new THREE.DirectionalLight(0xccffee,0.25);
  bot.position.set(0,-4,2);
  scene.add(bot);

  // ── Materials ────────────────────────────────────
  var petalColor=new THREE.Color(accentHex);
  var petalMat=new THREE.MeshStandardMaterial({color:petalColor,roughness:0.08,metalness:0.12});
  var faceMat =new THREE.MeshStandardMaterial({color:0xf5c040,roughness:0.38,metalness:0.04});
  var greenMat=new THREE.MeshStandardMaterial({color:0x2a7530,roughness:0.48,metalness:0.03});
  var eyeMat  =new THREE.MeshStandardMaterial({color:0x111118,roughness:0.25});
  var mouthMat=new THREE.MeshStandardMaterial({color:0xcc2040,roughness:0.38});

  var ch=new THREE.Group();
  scene.add(ch);

  var add=function(geo,mat,x,y,z,sx,sy,sz,rx,rz){
    var m=new THREE.Mesh(geo,mat);
    m.position.set(x,y,z);
    if(sx!==undefined) m.scale.set(sx,sy||sx,sz||sx);
    if(rx!==undefined) m.rotation.x=rx;
    if(rz!==undefined) m.rotation.z=rz;
    m.castShadow=true; m.receiveShadow=true;
    ch.add(m); return m;
  };

  // ── Petals (6 in a ring) ─────────────────────────
  var pGeo=new THREE.SphereGeometry(0.54,28,28);
  for(var i=0;i<6;i++){
    var a=(i/6)*Math.PI*2-Math.PI/2;
    add(pGeo,petalMat, Math.cos(a)*0.70, Math.sin(a)*0.70, -0.08);
  }

  // ── Face sphere ──────────────────────────────────
  add(new THREE.SphereGeometry(0.52,32,32), faceMat, 0,0,0.14);

  // ── Eyes ─────────────────────────────────────────
  var eGeo=new THREE.SphereGeometry(0.075,14,14);
  [-0.18,0.18].forEach(function(x){
    add(eGeo,eyeMat, x,0.10,0.65);
  });

  // ── Mouth ─────────────────────────────────────────
  add(new THREE.BoxGeometry(0.20,0.065,0.05), mouthMat, 0,-0.10,0.64);

  // ── Stem ──────────────────────────────────────────
  add(new THREE.CylinderGeometry(0.075,0.095,1.85,14), greenMat, 0,-1.33,0);

  // ── Leaves ────────────────────────────────────────
  var lGeo=new THREE.SphereGeometry(0.58,22,22);
  add(lGeo,greenMat, -0.65,-0.82,0.04, 1.38,0.36,0.72, 0, 0.42);
  add(lGeo,greenMat,  0.65,-1.05,0.04, 1.38,0.36,0.72, 0,-0.42);

  // ── Base dome ─────────────────────────────────────
  add(new THREE.SphereGeometry(0.80,26,26), greenMat, 0,-2.02,0, 1.28,0.36,1.0);

  ch.scale.setScalar(0.82);
  ch.position.y=0.20;

  // ── Drag-to-rotate (same logic as XingWang) ──────
  var rotY=0,rotX=0.05,tY=0,tX=0.05,dragging=false,lx=0,ly=0;
  if(interactive){
    renderer.domElement.addEventListener('pointerdown',function(e){
      dragging=true; lx=e.clientX; ly=e.clientY;
    });
    window.addEventListener('pointermove',function(e){
      if(!dragging)return;
      tY+=(e.clientX-lx)*0.007;
      tX+=(e.clientY-ly)*0.004;
      tX=Math.max(-0.55,Math.min(0.55,tX));
      lx=e.clientX; ly=e.clientY;
    });
    window.addEventListener('pointerup',function(){ dragging=false; });
  }

  // ── Render loop ───────────────────────────────────
  var start=performance.now();
  (function tick(){
    var t=(performance.now()-start)/1000;
    rotY+=(tY-rotY)*0.15;
    rotX+=(tX-rotX)*0.15;
    // gentle sway + float (flower-in-breeze feel)
    ch.position.y=0.10+Math.sin(t*1.0)*0.08;
    ch.rotation.z=Math.sin(t*0.55)*0.04;
    ch.rotation.y=rotY+Math.sin(t*0.3)*0.04;
    ch.rotation.x=rotX;
    renderer.render(scene,camera);
    requestAnimationFrame(tick);
  })();
})();
</script>
</body>
</html>`;
}

export function LilyPet3D({
  size = 120,
  color = '#e03060',
  interactive = true,
}: LilyPet3DProps) {
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
  container: {
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});
