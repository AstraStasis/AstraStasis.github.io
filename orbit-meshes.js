/* Real scene geometry: content has depth, lighting, rotation, and occlusion. */
window.createPortfolioOrbit=(THREE,scene,camera)=>{
 const W=window.WORLD,root=new THREE.Group();scene.add(root);root.visible=false;
 let pieces=[],panels=[],signature=null;
 let captureDepth=6,priorPoses=[],departing=[];
 const smooth=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);};
 const project=new THREE.Vector3(),point=new THREE.Vector3(),ray=new THREE.Vector3();
 const material=new THREE.MeshStandardMaterial({color:0x304253,metalness:.55,roughness:.32});
 const fragmentSide=new THREE.MeshStandardMaterial({color:0x8197ab,transparent:true,opacity:.7,metalness:.3,roughness:.4});
 function texture(text,color='#eee8e1',font='32px sans-serif',width=512,height=128,spacing=0){
  const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;const ctx=canvas.getContext('2d');ctx.fillStyle=color;ctx.font=font;ctx.letterSpacing=spacing+'px';ctx.textBaseline='alphabetic';
  const metrics=ctx.measureText(text),ascent=metrics.fontBoundingBoxAscent||metrics.actualBoundingBoxAscent,descent=metrics.fontBoundingBoxDescent||metrics.actualBoundingBoxDescent;
  ctx.fillText(text,0,(height-ascent-descent)/2+ascent);return canvas;
 }
 function mesh(canvas,w,h,depth=.055){
  const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;
  const face=new THREE.MeshBasicMaterial({map,color:0xffffff,transparent:true,alphaTest:.025,depthWrite:true});
  const side=depth<.05?fragmentSide:material;
  let geometry;
  if(depth>=.1){
   const shape=new THREE.Shape(),r=Math.min(w,h)*.13,x=-w/2,y=-h/2;
   shape.moveTo(x+r,y);shape.lineTo(x+w-r,y);shape.quadraticCurveTo(x+w,y,x+w,y+r);shape.lineTo(x+w,y+h-r);shape.quadraticCurveTo(x+w,y+h,x+w-r,y+h);shape.lineTo(x+r,y+h);shape.quadraticCurveTo(x,y+h,x,y+h-r);shape.lineTo(x,y+r);shape.quadraticCurveTo(x,y,x+r,y);
   geometry=new THREE.ExtrudeGeometry(shape,{depth:depth-.025,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:.012,bevelThickness:.012,curveSegments:5});geometry.translate(0,0,-depth/2);
   const pos=geometry.attributes.position,uv=geometry.attributes.uv;
   for(let i=0;i<pos.count;i++)uv.setXY(i,(pos.getX(i)+w/2)/w,(pos.getY(i)+h/2)/h);
   geometry.groups.forEach(group=>group.materialIndex=group.materialIndex===0?4:0);Object.assign(geometry.parameters,{width:w,height:h,depth});
  }else geometry=new THREE.BoxGeometry(w,h,depth);
  const m=new THREE.Mesh(geometry,[side,side,side,side,face,face]);root.add(m);return m;
 }
 function release(items){items.forEach(({m})=>{root.remove(m);m.geometry.dispose();m.material[4].map.dispose();m.material[4].dispose();});}
 function dispose(){release([...pieces,...panels,...departing]);pieces=[];panels=[];departing=[];signature=null;}
 function world(x,y){point.set(x/innerWidth*2-1,1-y/innerHeight*2,.5).unproject(camera);ray.copy(point).sub(camera.position).normalize();return camera.position.clone().addScaledVector(ray,-camera.position.z/ray.z);}
 function capture(){
  const savedCamera={position:camera.position.clone(),quaternion:camera.quaternion.clone()};
  priorPoses=pieces.map(p=>({position:p.m.position.clone(),quaternion:p.m.quaternion.clone(),scale:p.m.scale.x,width:p.m.geometry.parameters.width,height:p.m.geometry.parameters.height}));
  if(W.orbitPhase==='returning'){
   if(!W.orbitReturnDestination){signature=W.orbitCapture;return;}
   departing=[...pieces,...panels].map(p=>({...p,from:p.m.position.clone(),rotation:p.m.quaternion.clone(),size:p.m.scale.x}));pieces=[];panels=[];
  }
  if(W.orbitPhase!=='returning')dispose();
  if(W.orbitPhase==='returning'){camera.position.set(0,0,6);camera.lookAt(0,0,0);}
  signature=W.orbitCapture;camera.updateMatrixWorld();captureDepth=camera.position.z;const mobile=innerWidth<761,limit=mobile?45:110;
  const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let node;
  while((node=walker.nextNode())&&pieces.length<limit){
   const parent=node.parentElement;if(!parent||!parent.closest('#main,.hud,.hud-corner,.footer')||parent.closest('button svg,.gd-stage,[hidden],script,style'))continue;
   const css=getComputedStyle(parent);if(css.display==='none'||css.visibility==='hidden'||Number(css.opacity)===0)continue;
   for(const match of node.textContent.matchAll(/\S+/g)){
    if(pieces.length>=limit)break;const range=document.createRange();range.setStart(node,match.index);range.setEnd(node,match.index+match[0].length);const r=range.getBoundingClientRect();
    if(r.width<2||r.height<3||r.top<0||r.bottom>innerHeight||r.right<0||r.left>innerWidth)continue;
    const units=2*Math.tan(THREE.MathUtils.degToRad(camera.fov/2))*camera.position.z/innerHeight;
    const canvas=texture(match[0],css.color,`${css.fontStyle} ${css.fontWeight} ${parseFloat(css.fontSize)*2}px ${css.fontFamily}`,Math.max(2,Math.ceil(r.width*2)),Math.max(2,Math.ceil(r.height*2)),(parseFloat(css.letterSpacing)||0)*2);
    const m=mesh(canvas,r.width*units,r.height*units,.025);const origin=world(r.x+r.width/2,r.y+r.height/2);m.position.copy(origin);
    m.quaternion.copy(camera.quaternion);pieces.push({m,origin,rect:{x:r.x,y:r.y,width:r.width,height:r.height},startQuaternion:camera.quaternion.clone(),seed:pieces.length*.618,hero:Boolean(parent.closest('#heroTitle'))});
   }
  }
  // Borders and header surfaces travel with the text rather than disappearing.
  [...document.querySelectorAll('.hud,.hud-corner,#main button,#main .pill-link')].forEach(el=>{
   const r=el.getBoundingClientRect(),css=getComputedStyle(el);if(r.width<5||r.height<5||r.bottom<0||r.top>innerHeight)return;
   const border=parseFloat(css.borderTopWidth)||0,bg=css.backgroundColor;if(!border&&(bg==='rgba(0, 0, 0, 0)'||bg==='transparent'))return;
   const tiles=r.width>500?6:1,units=2*Math.tan(THREE.MathUtils.degToRad(camera.fov/2))*camera.position.z/innerHeight;
   for(let tile=0;tile<tiles;tile++){
    const w=r.width/tiles,c=document.createElement('canvas');c.width=Math.ceil(w*2);c.height=Math.ceil(r.height*2);const ctx=c.getContext('2d');ctx.fillStyle=bg;ctx.fillRect(0,0,c.width,c.height);if(border){ctx.strokeStyle=css.borderTopColor;ctx.lineWidth=border*2;ctx.strokeRect(1,1,c.width-2,c.height-2);}
    const rect={x:r.x+w*tile,y:r.y,width:w,height:r.height},origin=world(rect.x+w/2,rect.y+r.height/2),m=mesh(c,w*units,r.height*units,.025);m.position.copy(origin);m.position.z-=.004;
    pieces.push({m,origin,rect,startQuaternion:camera.quaternion.clone(),seed:pieces.length*.618,hero:false});
   }
  });
  // Local artwork breaks into textured pieces alongside the visible text.
  [...document.querySelectorAll('#main img')].filter(img=>img.complete&&img.naturalWidth&&new URL(img.currentSrc||img.src,location.href).origin===location.origin).slice(0,30).forEach(img=>{
   const r=img.getBoundingClientRect();if(r.width<30||r.height<30||r.bottom<0||r.top>innerHeight||r.right<0||r.left>innerWidth)return;
   const units=2*Math.tan(THREE.MathUtils.degToRad(camera.fov/2))*camera.position.z/innerHeight;
   for(let x=0;x<2;x++)for(let y=0;y<2;y++){
    const canvas=document.createElement('canvas');canvas.width=256;canvas.height=256;canvas.getContext('2d').drawImage(img,x*img.naturalWidth/2,y*img.naturalHeight/2,img.naturalWidth/2,img.naturalHeight/2,0,0,256,256);
    const m=mesh(canvas,r.width*units/2,r.height*units/2,.025),origin=world(r.x+r.width*(x+.5)/2,r.y+r.height*(y+.5)/2);m.position.copy(origin);pieces.push({m,origin,rect:{x:r.x+r.width*x/2,y:r.y+r.height*y/2,width:r.width/2,height:r.height/2},startQuaternion:camera.quaternion.clone(),seed:pieces.length*.618,hero:false});
   }
  });
  (W.orbitPhase==='returning'?[]:W.orbitItems||[]).forEach((item,i)=>{
   const c=document.createElement('canvas');c.width=640;c.height=400;const ctx=c.getContext('2d');
   const g=ctx.createLinearGradient(0,0,640,400);g.addColorStop(0,['#53396c','#355867','#4b3447','#315e68','#493e74','#674936'][i%6]);g.addColorStop(1,'#080c17');ctx.fillStyle=g;ctx.fillRect(0,0,640,400);
   function label(){ctx.fillStyle='#070b15d9';ctx.fillRect(0,235,640,165);ctx.fillStyle='#eee8e1';ctx.font='500 47px sans-serif';ctx.fillText(item.name,28,302,584);ctx.fillStyle='#d6b599';ctx.font='22px sans-serif';ctx.fillText(item.tag,30,354,580);}
   if(item.id==='home'){ctx.fillStyle='#eee8e1';ctx.font='italic 45px Georgia';ctx.fillText('A universe,',28,70);ctx.fillText('rendered frame perfect.',28,130,580);}else if(item.symbol){ctx.fillStyle='#d3b8e6';ctx.font='italic 65px Georgia';ctx.fillText(item.symbol,35,145,570);}label();
   const m=mesh(c,mobile?.56:1.15,mobile?.35:.72,.13);panels.push({m,seed:i});
   if(item.image&&!item.image.startsWith('http')){const img=new Image();img.onload=()=>{if(!panels.some(p=>p.m===m))return;const crop=Math.max(640/img.naturalWidth,400/img.naturalHeight);ctx.drawImage(img,(640-img.naturalWidth*crop)/2,(400-img.naturalHeight*crop)/2,img.naturalWidth*crop,img.naturalHeight*crop);label();m.material[4].map.needsUpdate=true;dispatchEvent(new Event('portfolio:orbit-render'));};img.src=item.image;}
  });
  W.orbitMeshReady=true;document.body.classList.add('orbit-3d-ready');
  camera.position.copy(savedCamera.position);camera.quaternion.copy(savedCamera.quaternion);camera.updateMatrixWorld();
 }
 function update(){
  const mix=W.orbitMix||0,mode=W.orbitPhase;
  if(mode==='closed'||!mode){root.visible=false;if(pieces.length)dispose();return;}
  if(signature!==W.orbitCapture)capture();root.visible=true;
  const clock=W.orbitClock||0;
  const t=W.orbitElapsed||0,a=W.orbitAngle||0,form=smooth((t-2.65)/1.85);
  const mobile=innerWidth<761,aspect=innerWidth/innerHeight;
  const ry=mobile?.98:1.3,rx=mobile?Math.max(.4,Math.min(.75,aspect*2.15-.38)):Math.min(2.8,aspect*2.1-.75);
  departing.forEach(({m,from,rotation,size})=>{
   const p=smooth((W.orbitReturn||0)/.42);m.position.copy(from);m.position.z-=p*3;m.quaternion.copy(rotation);m.rotateY(p*.7);m.scale.setScalar(Math.max(.001,size*(1-p)));m.visible=p<1;
  });
  pieces.forEach(({m,origin,rect,startQuaternion,seed,hero},i)=>{
   m.visible=!W.paused;
   const alpha=mode==='entering'?smooth((t-.05)/.65):mode==='returning'?1-smooth(((W.orbitReturn||0)-.9)/.1):1;
   m.material[4].opacity=alpha;
   if(mode==='returning'){
    const p=smooth(((W.orbitReturn||0)-(departing.length?.18:0))/(departing.length?.66:.84)),previous=priorPoses[i%Math.max(1,priorPoses.length)],target=world(rect.x+rect.width/2,rect.y+rect.height/2);
    const from=previous?.position||new THREE.Vector3();m.position.copy(from).lerp(target,p);m.position.z+=Math.sin(p*Math.PI)*.3;
    m.quaternion.copy(previous?.quaternion||startQuaternion).slerp(camera.quaternion,p);
    const startScale=departing.length?.001:previous?previous.scale*Math.min(previous.width/m.geometry.parameters.width,previous.height/m.geometry.parameters.height):.02;
    m.scale.setScalar(THREE.MathUtils.lerp(startScale,camera.position.z/captureDepth,p));return;
   }
   const lane=i%5,slot=Math.floor(i/5),count=Math.ceil(pieces.length/5),ang=a*.65+slot*Math.PI*2/count+lane*.27;
   const target=new THREE.Vector3(Math.cos(ang)*rx*(.84+lane*.045),Math.sin(ang)*ry*(.85+lane*.045),-1.65-lane*.5);
   const limit=(mobile?.10:.19)/Math.max(m.geometry.parameters.width,m.geometry.parameters.height);
   const orbitSize=Math.min(hero?.22:.35,limit);
   if(mode==='entering'){
    const delay=(i%7)*.025,q=Math.max(0,Math.min(1,(t-.55-delay)/2.1)),p=q*q*(3-2*q);
    m.position.copy(origin).lerp(target,p);m.position.z-=Math.sin(p*Math.PI)*(.5+lane*.2);
    m.quaternion.copy(startQuaternion);m.rotateX(p*Math.sin(seed)*.7);m.rotateY(p*Math.cos(seed)*.8);m.rotateZ(p*Math.sin(seed)*.65);m.scale.setScalar(THREE.MathUtils.lerp(1,orbitSize,smooth(q*2)));
    if(q<1)return;
   }
   m.position.copy(target);m.rotation.set(Math.sin(clock*.63+seed)*.65,Math.sin(clock*.47+seed)*1.1,Math.sin(clock*.39+seed)*.45);
   m.scale.setScalar(orbitSize);
  });
  const positions=[];
  panels.forEach(({m},i)=>{
   const angle=a+i*Math.PI*2/panels.length-Math.PI/2;
   m.position.set(Math.cos(angle)*rx,Math.sin(angle)*ry,Math.sin(angle*1.5)*(mobile?.18:.45));
   m.rotation.set(Math.sin(clock*.47+i)*.32,Math.sin(clock*.39+i*1.4)*.65,Math.sin(clock*.31+i)*.24);
   if(mode==='returning'){const p=W.orbitReturn||0;m.position.z-=p*3;m.rotation.x+=p*1.2;m.rotation.z+=p*.5;}
   m.scale.setScalar(mode==='entering'?form:mode==='returning'?Math.max(.001,1-(W.orbitReturn||0)*1.4):1);
   m.updateMatrixWorld();project.copy(m.position).project(camera);
   const bounds=m.geometry.parameters,coords=[];
   for(const x of [-.5,.5])for(const y of [-.5,.5]){const corner=new THREE.Vector3(x*bounds.width,y*bounds.height,bounds.depth/2);m.localToWorld(corner);corner.project(camera);coords.push({x:(corner.x+1)*innerWidth/2,y:(1-corner.y)*innerHeight/2});}
   const left=Math.min(...coords.map(p=>p.x)),right=Math.max(...coords.map(p=>p.x)),top=Math.min(...coords.map(p=>p.y)),bottom=Math.max(...coords.map(p=>p.y));
   positions.push({x:(left+right)/2,y:(top+bottom)/2,width:right-left,height:bottom-top});
  });
  W.orbitMeshPositions=positions;
  dispatchEvent(new Event('portfolio:orbit-projected'));
  W.orbitGeometry={pieces:pieces.length,panels:panels.length,depth:.13,tilts:panels.map(p=>p.m.rotation.toArray().slice(0,3)),returnProgress:W.orbitReturn||0};
 }
 return {update};
};
