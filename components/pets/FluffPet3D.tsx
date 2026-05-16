import React from 'react';
import { PetWebView } from './PetWebView';

interface FluffPet3DProps {
  size?: number;
  color?: string;
  interactive?: boolean;
}

function buildHTML(accentHex: string): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width,initial-scale=1,user-scalable=no">
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  html,body{width:100%;height:100%;overflow:hidden;background:transparent}
  canvas{display:block;width:100%!important;height:100%!important;filter:saturate(1.3) contrast(1.02)}
</style>
</head>
<body>
<div id="m"></div>
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
<script>
(function(){
  var W=window.innerWidth, H=window.innerHeight;

  var renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));
  renderer.setSize(W,H);
  renderer.shadowMap.enabled=false;
  renderer.outputEncoding=THREE.sRGBEncoding;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.10;
  document.getElementById('m').appendChild(renderer.domElement);

  var scene=new THREE.Scene();
  var camera=new THREE.PerspectiveCamera(36,W/H,0.1,100);
  camera.position.set(0,0.05,9.0);
  camera.lookAt(0,0,0);

  scene.add(new THREE.AmbientLight(0xffffff,1.15));
  var key=new THREE.DirectionalLight(0xffeef8,0.70);
  key.position.set(-2,6,6);
  scene.add(key);
  var fill=new THREE.DirectionalLight(0xf0fff8,0.35);
  fill.position.set(5,1,5);
  scene.add(fill);

  var accent=new THREE.Color('${accentHex}');
  var cloudColor=accent.clone().lerp(new THREE.Color(0xffffff),0.60);
  var cloudMat=new THREE.MeshStandardMaterial({
    color:cloudColor,
    roughness:0.92,
    metalness:0.00,
  });

  var faceMat=new THREE.MeshStandardMaterial({color:0x4a4a4a,roughness:0.55,metalness:0.0});

  var ch=new THREE.Group();
  scene.add(ch);

  var sph=function(r){ return new THREE.SphereGeometry(r,48,48); };
  var add=function(geo,mat,x,y,z,sx,sy,sz){
    var m=new THREE.Mesh(geo,mat);
    m.position.set(x,y,z);
    if(sx!==undefined) m.scale.set(sx,sy!==undefined?sy:sx,sz!==undefined?sz:sx);
    ch.add(m); return m;
  };

  add(sph(1.0),cloudMat,0,-0.04,0,  1.38,0.88,1.02);
  add(sph(0.56),cloudMat,    0, 0.98,0.02);
  add(sph(0.48),cloudMat,-0.64, 0.82,0.01);
  add(sph(0.48),cloudMat, 0.64, 0.82,0.01);
  add(sph(0.46),cloudMat,-1.10, 0.42,0.00);
  add(sph(0.46),cloudMat, 1.10, 0.42,0.00);
  add(sph(0.45),cloudMat,-1.22,-0.14,0.00);
  add(sph(0.45),cloudMat, 1.22,-0.14,0.00);
  add(sph(0.44),cloudMat,-0.72,-0.78,0.00);
  add(sph(0.44),cloudMat, 0.72,-0.78,0.00);

  var eGeo=sph(0.090);
  add(eGeo,faceMat,-0.30, 0.14,1.06, 1.0,1.55,0.75);
  add(eGeo,faceMat, 0.30, 0.14,1.06, 1.0,1.55,0.75);

  var smilePts=[
    new THREE.Vector3(-0.26,-0.06,1.04),
    new THREE.Vector3(-0.10,-0.17,1.08),
    new THREE.Vector3( 0.10,-0.17,1.08),
    new THREE.Vector3( 0.26,-0.06,1.04),
  ];
  var smileCurve=new THREE.CatmullRomCurve3(smilePts);
  var smileGeo=new THREE.TubeGeometry(smileCurve,20,0.026,8,false);
  ch.add(new THREE.Mesh(smileGeo,faceMat));

  ch.scale.setScalar(0.86);
  ch.position.y=0.0;

  // Rotation state — driven by RN PanResponder via window.rotatePet
  var rotY=0,rotX=0.03,tY=0,tX=0.03;
  window.rotatePet=function(ddx,ddy){
    tY+=ddx*0.010; tX+=ddy*0.006;
    tX=Math.max(-0.40,Math.min(0.40,tX));
  };

  var start=performance.now();
  (function tick(){
    var t=(performance.now()-start)/1000;
    rotY+=(tY-rotY)*0.12;
    rotX+=(tX-rotX)*0.12;
    ch.position.y=Math.sin(t*0.80)*0.10;
    ch.rotation.z=Math.sin(t*0.45)*0.025;
    ch.rotation.y=rotY+Math.sin(t*0.28)*0.025;
    ch.rotation.x=rotX;
    renderer.render(scene,camera);
    requestAnimationFrame(tick);
  })();
})();
</script>
</body>
</html>`;
}

export function FluffPet3D({
  size = 120,
  color = '#4ecdc4',
  interactive = true,
}: FluffPet3DProps) {
  return <PetWebView html={buildHTML(color)} size={size} interactive={interactive} />;
}
