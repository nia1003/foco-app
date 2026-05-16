/**
 * XingWangPet3D — real Three.js 3D render inside a WebView.
 * Identical geometry to the original xingwang.jsx:
 *   sphere body + concave notch + dot eyes + arm/foot blobs + float idle.
 * Three.js r128 is loaded from cdnjs (bundled in the HTML string —
 * no network needed after first load if the app caches the WebView).
 */
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

interface XingWangPet3DProps {
  size?: number;
  color?: string;   // CSS hex string, e.g. '#FABD03'
  interactive?: boolean;
}

function buildHTML(color: string, interactive: boolean): string {
  // hex '#FABD03' → Three.js Color accepts hex strings directly
  return `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width,initial-scale=1,user-scalable=no">
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  html,body{width:100%;height:100%;overflow:hidden;background:transparent}
  canvas{display:block;width:100%!important;height:100%!important}
</style>
</head>
<body>
<div id="m"></div>
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
<script>
(function(){
  var W = window.innerWidth, H = window.innerHeight;
  var interactive = ${interactive ? 'true' : 'false'};
  var bodyHex = '${color}';

  var renderer = new THREE.WebGLRenderer({antialias:true,alpha:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));
  renderer.setSize(W,H);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  document.getElementById('m').appendChild(renderer.domElement);

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(40, W/H, 0.1, 100);
  camera.position.set(0, 0.3, 8);
  camera.lookAt(0,0,0);

  scene.add(new THREE.AmbientLight(0xffffff, 0.9));
  var key = new THREE.DirectionalLight(0xfff8e8, 1.4);
  key.position.set(-3,6,5); key.castShadow=true;
  key.shadow.mapSize.set(1024,1024);
  scene.add(key);
  var fill = new THREE.DirectionalLight(0xe8f0ff, 0.5);
  fill.position.set(4,2,3);
  scene.add(fill);

  var bodyColor = new THREE.Color(bodyHex);
  var yMat = new THREE.MeshStandardMaterial({color:bodyColor,roughness:0.70,metalness:0.0});
  var bMat = new THREE.MeshStandardMaterial({color:0x111111,roughness:0.5});

  var ch = new THREE.Group();
  scene.add(ch);

  var S = function(r){ return new THREE.SphereGeometry(r,64,64); };
  var add = function(geo,mat,x,y,z){
    var m = new THREE.Mesh(geo,mat);
    m.position.set(x,y,z);
    m.castShadow=true; m.receiveShadow=true;
    ch.add(m); return m;
  };

  // Body with concave notch
  var bodyGeo = new THREE.SphereGeometry(1.22,128,128);
  var pos = bodyGeo.attributes.position;
  var notchCenter = new THREE.Vector3(0.0,0.55,1.72);
  var notchRadius = 1.05;
  var v = new THREE.Vector3(), d = new THREE.Vector3();
  for(var i=0;i<pos.count;i++){
    v.set(pos.getX(i),pos.getY(i),pos.getZ(i));
    var dist = v.distanceTo(notchCenter);
    if(dist < notchRadius){
      d.copy(v).sub(notchCenter).normalize();
      var np = notchCenter.clone().addScaledVector(d,notchRadius);
      pos.setXYZ(i,np.x,np.y,np.z);
    }
  }
  bodyGeo.computeVertexNormals();
  add(bodyGeo,yMat,0,0,0);

  add(S(0.12),bMat,-0.62, 0.10,1.04); // left eye
  add(S(0.12),bMat, 0.62, 0.10,1.04); // right eye
  add(S(0.34),yMat,-0.40,-1.22,0.20); // left foot
  add(S(0.34),yMat, 0.40,-1.22,0.20); // right foot
  add(S(0.24),yMat,-1.12,-0.28,0.22); // left arm
  add(S(0.24),yMat, 1.12,-0.28,0.22); // right arm

  // Drag to rotate
  var rotY=0, rotX=0.05, tY=0, tX=0.05, dragging=false, lx=0, ly=0;
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

  var start=performance.now();
  (function tick(){
    var t=(performance.now()-start)/1000;
    rotY+=(tY-rotY)*0.15;
    rotX+=(tX-rotX)*0.15;
    ch.position.y=Math.sin(t*1.0)*0.10;
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

export function XingWangPet3D({
  size = 120,
  color = '#FABD03',
  interactive = true,
}: XingWangPet3DProps) {
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
        // Keeps the WebView alive when off-screen
        renderToHardwareTextureAndroid
        // Required for transparent background on iOS
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
    borderRadius: 9999,
    backgroundColor: 'transparent',
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});
