/* The portfolio's live blob becomes the center of an accessible section explorer. */
(() => {
 const W=window.WORLD, reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const trigger=document.getElementById('orbPulse');
 trigger.classList.add('universe-header');
 trigger.setAttribute('aria-label','Meet the universe');
 trigger.innerHTML='<svg class="saturn-icon" viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="7"/><ellipse cx="16" cy="16" rx="15" ry="4.5" transform="rotate(-28 16 16)"/></svg><span class="universe-label">Meet the universe</span>';
 const headerActions=document.createElement('div');headerActions.className='header-space-links';const github=document.querySelector('.hud .github-nav');github.before(headerActions);headerActions.append(trigger,github);
 const data=[
  {id:"home",name:"A universe",tag:"Rendered frame perfect",detail:"The beginning of this little creative universe.",symbol:"frame perfect"},
  {id:'about',name:'About me',tag:'The person',detail:'Gean / AndreiG. Drawing, editing, and following an idea just to see where it goes.',image:'assets/sketches/reze-thumb.webp'},
  {id:'portfolio',name:'Motion',tag:'11 films',detail:'Motion graphics, dance films, logo reveals, and stories in the screening room.',image:'assets/orbit-motion.jpg'},
  {id:'artworks',name:'Artworks',tag:'11 pieces',detail:'Characters, color, and detail studies. Explore the finished artwork and the sketches behind it.',image:'assets/artworks/reze-thumb.webp'},
  {id:'toolkit',name:'Toolkit',tag:'Tools & experiments',detail:'The creative tools, ideas, and code behind the work.',symbol:'Ae / Pr'},
  {id:'contact',name:'Contact',tag:'Make something',detail:'Have an idea? Find my contact details and social links.',symbol:'Let’s talk'}
 ];
 const panel=document.createElement('div');panel.className='orbit-explorer';panel.hidden=true;panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');panel.setAttribute('aria-labelledby','orbitTitle');
 panel.innerHTML=`<div class="orbit-heading"><span class="orbit-kicker">ANDREIG / A LITTLE UNIVERSE</span><h2 id="orbitTitle">Everything in my orbit.</h2></div><div class="orbit-controls"><button type="button" class="orbit-pause">Pause motion</button><button type="button" class="orbit-close">Back to portfolio <span aria-hidden="true">&#8599;</span></button></div><canvas class="orbit-explosion" aria-hidden="true"></canvas><svg class="orbit-paths" viewBox="0 0 1000 1000" preserveAspectRatio="none" aria-hidden="true"><ellipse cx="500" cy="500" rx="340" ry="270"/><ellipse cx="500" cy="500" rx="365" ry="310"/><ellipse cx="500" cy="500" rx="285" ry="235"/></svg><div class="orbit-fallback" aria-hidden="true"></div><div class="orbit-destinations"></div><div class="orbit-detail"><span class="orbit-detail-tag">SIX PLACES / ONE CREATIVE WORLD</span><h3>Pick a part of my universe.</h3><p>The sections orbit the same little blob that brought you here.</p><button type="button" class="orbit-explore" hidden>Explore section <span aria-hidden="true">&#8599;</span></button></div><span class="sr-only orbit-status" role="status"></span>`;
 document.body.append(panel);
 const navigation=document.createElement('div');navigation.className='orbit-navigation';
 navigation.innerHTML=`<select hidden aria-label="Camera destination"><option value="0">Whole system</option><option value="1">Central blob</option><option value="2">Ringed planet</option><option value="3">Blue planet</option></select><input hidden aria-label="Orbit zoom" type="range" min="0" max="1" step="0.01" value="0"><button type="button" title="Return to front view" aria-label="Reset orbit view">&#8634;</button><button type="button" data-step="200" aria-label="Zoom out">&#8722;</button><button type="button" data-step="-200" aria-label="Zoom in">+</button><span class="orbit-gesture-hint">Drag to orbit / scroll to explore / double click for a ripple</span>`;
 panel.append(navigation);
 navigation.querySelectorAll('[data-step]').forEach(button=>button.addEventListener('click',()=>{if(state!=='orbiting')return;const view=W.orbitView,old=view.zoom,next=Math.max(0,Math.min(1,old-Number(button.dataset.step)*.001));if(next<old){const ratio=next/old;view.target=view.target.map(v=>v*ratio);W.orbitPan=(W.orbitPan||[0,0,0]).map(v=>v*ratio);if(W.orbitRotation){W.orbitRotation.yaw*=ratio;W.orbitRotation.pitch*=ratio;}}view.zoom=next;zoom.value=next;renderScene();}));
 panel.addEventListener('dblclick',e=>{if(state!=='orbiting'||still()||e.target.closest('button,.orbit-navigation,.orbit-controls'))return;W.pulse=1;renderScene();});
 const zoom=navigation.querySelector('input'),view=navigation.querySelector('select');
 const destinations=[[0,0,0],[0,0,0],[-5.8,2.8,-8],[5,-2.9,-6]];
 function changeView(){if(state!=='orbiting')return;W.orbitView={target:destinations[Number(view.value)],zoom:Number(zoom.value)};renderScene();}
 zoom.addEventListener('input',changeView);
 view.addEventListener('change',()=>{W.orbitPan=[0,0,0];W.orbitRotation={yaw:0,pitch:0};zoom.value=view.value==='0'?'0':'.65';changeView();});
 navigation.querySelector('button').addEventListener('click',()=>{view.value='0';zoom.value='0';changeView();});
 panel.addEventListener('wheel',e=>{if(state!=='orbiting'||e.target.closest('.orbit-navigation'))return;e.preventDefault();const delta=e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?innerHeight:1);W.orbitWheel={x:e.clientX/innerWidth*2-1,y:1-e.clientY/innerHeight*2,delta:(W.orbitWheel?.delta||0)+delta};renderScene();},{passive:false});
 let drag=null,suppressClick=false;
 panel.addEventListener('pointerdown',e=>{if(state!=='orbiting'||e.button!==0||e.target.closest('.orbit-navigation,.orbit-controls'))return;drag={id:e.pointerId,x:e.clientX,y:e.clientY,moved:false};});
 panel.addEventListener('pointermove',e=>{if(!drag||drag.id!==e.pointerId)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(!drag.moved&&Math.hypot(dx,dy)<5)return;drag.moved=true;panel.setPointerCapture(e.pointerId);panel.classList.add('is-dragging');W.orbitRotation=W.orbitRotation||{yaw:0,pitch:0};W.orbitRotation.yaw=Math.max(-1.3,Math.min(1.3,W.orbitRotation.yaw-dx*.006));W.orbitRotation.pitch=Math.max(-.8,Math.min(.8,W.orbitRotation.pitch+dy*.006));drag.x=e.clientX;drag.y=e.clientY;renderScene();});
 function endDrag(e){if(!drag||drag.id!==e.pointerId)return;suppressClick=drag.moved;drag=null;panel.classList.remove('is-dragging');if(panel.hasPointerCapture(e.pointerId))panel.releasePointerCapture(e.pointerId);setTimeout(()=>suppressClick=false,0);}
 panel.addEventListener('pointerup',endDrag);panel.addEventListener('pointercancel',endDrag);
 panel.addEventListener('click',e=>{if(suppressClick){e.preventDefault();e.stopImmediatePropagation();}},true);
 navigation.querySelector('button').addEventListener('click',()=>{W.orbitRotation={yaw:0,pitch:0};W.orbitPan=[0,0,0];renderScene();});
 const close=panel.querySelector('.orbit-close'),pause=panel.querySelector('.orbit-pause'),explore=panel.querySelector('.orbit-explore'),canvas=panel.querySelector('canvas'),ctx=canvas.getContext('2d');
 const cards=data.map((item,i)=>{
  const b=document.createElement('button');b.type='button';b.className='orbit-card';b.setAttribute('aria-pressed','false');b.setAttribute('aria-label',item.name+': '+item.tag);
  b.innerHTML=(item.image?`<img src="${item.image}" alt="" loading="lazy" decoding="async">`:`<span class="orbit-card-symbol">${item.symbol}</span>`)+`<span class="orbit-card-caption"><strong>${item.name}</strong><small>${item.tag}</small></span>`;
  b.addEventListener('click',()=>select(i));panel.querySelector('.orbit-destinations').append(b);return b;
 });
 const blocked=[...document.querySelectorAll('body>header,body>main,body>footer,body>.hud-corner,body>.mobile-menu,body>.skip-link')];
 let savedInert=[],state='closed',frame=0,start=0,last=0,angle=0,selected=-1,hover=false,returnMix=0,sourceFocus,scrollOrigin=0,destination=null;
 const still=()=>W.paused||reduced.matches;
 const ease=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);};
 const renderScene=()=>dispatchEvent(new Event('portfolio:orbit-render'));
 function phase(value){state=value;W.orbitPhase=value;panel.dataset.state=value;dispatchEvent(new CustomEvent('portfolio:orbit-phase',{detail:value}));if(value==='orbiting')document.body.style.setProperty('--orbit-light',1);if(value==='closed')document.body.style.removeProperty('--orbit-light');}
 function size(){const ratio=Math.min(devicePixelRatio,innerWidth<761?1:1.5);canvas.width=innerWidth*ratio;canvas.height=innerHeight*ratio;ctx?.setTransform(ratio,0,0,ratio,0,0);layout();}
 function layout(){
  W.orbitAngle=angle;
  if(W.orbitMeshReady&&W.orbitMeshPositions?.length===cards.length){cards.forEach((b,i)=>{const p=W.orbitMeshPositions[i];b.style.left=p.x+'px';b.style.top=p.y+'px';b.style.setProperty('--orbit-x','0px');b.style.setProperty('--orbit-y','0px');b.style.setProperty('--orbit-scale',1);if(p.width){b.style.width=p.width+'px';b.style.height=p.height+'px';}});return;}
  const mobile=innerWidth<761,rx=innerWidth*(mobile?.32:.34),ry=mobile?Math.min(innerHeight*.245,Math.max(65,(innerHeight*.5-210)/.95)):innerHeight*.27;
  cards.forEach((b,i)=>{const a=angle+i*Math.PI*2/data.length-Math.PI/2;const depth=(Math.sin(a)+1)/2;
   b.style.setProperty('--orbit-x',Math.cos(a)*rx+'px');b.style.setProperty('--orbit-y',Math.sin(a)*ry+'px');b.style.setProperty('--orbit-scale',mobile?1:.86+depth*.14);b.style.zIndex=String(10+Math.round(depth*10));
  });
 }
 function select(i){if(state!=='orbiting')return;selected=i;W.orbitSelected=i;leave(data[i].id);}
 function explosion(t){
  if(!ctx)return;ctx.clearRect(0,0,innerWidth,innerHeight);
  const strength=Math.sin(Math.min(1,Math.max(0,(t-.65)/2.6))*Math.PI),reach=Math.hypot(innerWidth,innerHeight)*.6;
  if(strength<=0)return;
  const p=Math.max(0,(t-.65)/2.6),cx=W.orbitCenter?.x??innerWidth/2,cy=W.orbitCenter?.y??innerHeight/2;
  ctx.lineWidth=1;ctx.globalCompositeOperation='lighter';
  const glow=ctx.createRadialGradient(cx,cy,0,cx,cy,Math.max(1,reach*p*.65));
  glow.addColorStop(0,`rgba(151,193,245,${strength*.18})`);glow.addColorStop(.35,`rgba(173,125,227,${strength*.07})`);glow.addColorStop(1,'rgba(100,140,220,0)');
  ctx.fillStyle=glow;ctx.fillRect(0,0,innerWidth,innerHeight);
  const count=innerWidth<761?36:92;
  for(let i=0;i<count;i++){const a=i*2.39996,r=reach*p*(.4+(i%9)/14),tail=reach*.12*strength;
   ctx.strokeStyle=`rgba(${i%3?'133,200,255':'255,166,125'},${strength*.7})`;ctx.beginPath();ctx.moveTo(cx+Math.cos(a)*Math.max(0,r-tail),cy+Math.sin(a)*Math.max(0,r-tail));ctx.lineTo(cx+Math.cos(a)*r,cy+Math.sin(a)*r);ctx.stroke();}
  for(let i=0;i<3;i++){ctx.strokeStyle=`rgba(167,207,255,${strength*.25})`;ctx.beginPath();ctx.ellipse(cx,cy,Math.max(1,reach*p*(1-i*.13)),Math.max(1,reach*p*(.55-i*.05)),-.2,0,Math.PI*2);ctx.stroke();}
 }
 function tick(now){
  frame=0;if(state==='closed'||document.hidden)return;
  const dt=Math.min(.04,(now-(last||now))/1000);last=now;W.orbitClock=(W.orbitClock||0)+dt;
  if(state==='entering'){
   const t=(now-start)/1000;W.orbitElapsed=t;W.orbitMix=ease((t-.8)/3.3);W.orbitGather=t<1.9?Math.sin(t/1.9*Math.PI):0;W.universeBoost=t<1.9?0:Math.sin(Math.min(1,(t-1.9)/2.3)*Math.PI)*.7;
   panel.style.setProperty('--formation',ease((t-1.9)/2.3));document.body.style.setProperty('--orbit-away',ease((t-.2)/.65));explosion(t-.7);layout();
   if(t>=4.5){settle();}
  }else if(state==='returning'){
   const p=ease((now-start)/3200);W.orbitReturn=p;W.orbitMix=returnMix*(1-ease(p/.78));document.body.style.setProperty('--orbit-away',1-ease((p-.9)/.1));panel.style.setProperty('--formation',1-ease(p/.7));
   if(p>=1){finish();return;}
  }else if(!still()&&selected<0&&!hover){angle+=dt*(innerWidth<761?.025:.055);layout();}
  document.body.style.setProperty('--orbit-light',W.orbitMix||0);layout();if(still())renderScene();
  if(state!=='closed'&&!still())frame=requestAnimationFrame(tick);
 }
 function settle(){W.orbitElapsed=5;phase('orbiting');W.orbitMix=1;W.orbitGather=0;W.universeBoost=0;panel.style.setProperty('--formation',1);document.body.style.setProperty('--orbit-away',1);ctx?.clearRect(0,0,innerWidth,innerHeight);panel.querySelector('.orbit-status').textContent='Choose a section orbiting the blob.';layout();renderScene();}
 function open(){
  W.orbitRotation={yaw:0,pitch:0};W.orbitPan=[0,0,0];W.orbitWheel=null;
  W.orbitView={target:[0,0,0],zoom:0};view.value='0';zoom.value='0';document.body.style.setProperty('--orbit-light',0);
  if(state!=='closed')return;W.orbitItems=data;W.orbitCapture=performance.now();W.orbitElapsed=0;W.orbitReturn=0;W.orbitSelected=-1;W.orbitMeshReady=false;sourceFocus=document.activeElement;scrollOrigin=scrollY;destination=null;selected=-1;angle=0;hover=false;
  cards.forEach(b=>b.setAttribute('aria-pressed','false'));explore.hidden=true;panel.classList.remove('has-selection');
  panel.querySelector('.orbit-detail-tag').textContent='SIX PLACES / ONE CREATIVE WORLD';panel.querySelector('.orbit-detail h3').textContent='Pick a part of my universe.';panel.querySelector('.orbit-detail p').textContent='Choose a section to assemble it back into the page.';
  savedInert=blocked.map(e=>e.inert);blocked.forEach(e=>e.inert=true);document.body.classList.add('orbit-open');panel.hidden=false;trigger.setAttribute('aria-expanded','true');size();phase('entering');start=performance.now();last=start;
  panel.style.setProperty('--formation',0);document.body.style.setProperty('--orbit-away',0);close.focus({preventScroll:true});sync();if(still())settle();else if(!frame)frame=requestAnimationFrame(tick);
 }
 function leave(id){
  if(state==='closed'||state==='returning')return;destination=id||null;document.body.classList.add('orbit-returning');
  if(destination){document.getElementById(destination).scrollIntoView({behavior:'instant',block:'start'});dispatchEvent(new Event('scroll'));}
  W.orbitGather=0;W.universeBoost=0;ctx?.clearRect(0,0,innerWidth,innerHeight);returnMix=W.orbitMix||0;W.orbitReturn=0;W.orbitReturnDestination=destination;W.orbitCapture=performance.now();phase('returning');start=performance.now();
  if(still()){finish();return;}if(!frame)frame=requestAnimationFrame(tick);
 }
 function finish(){
  cancelAnimationFrame(frame);frame=0;phase('closed');panel.hidden=true;W.orbitMix=0;W.orbitGather=0;W.universeBoost=0;document.body.classList.remove('orbit-open','orbit-returning');document.body.style.removeProperty('--orbit-away');blocked.forEach((e,i)=>e.inert=savedInert[i]);trigger.setAttribute('aria-expanded','false');
  if(destination){const title=document.querySelector('#'+destination+' h2, #'+destination+' h1');if(title){title.setAttribute('tabindex','-1');title.focus({preventScroll:true});title.addEventListener('blur',()=>title.removeAttribute('tabindex'),{once:true});}}
  else{scrollTo({top:scrollOrigin,behavior:'instant'});sourceFocus?.focus({preventScroll:true});}renderScene();dispatchEvent(new Event('portfolio:resume'));
 }
 function sync(){
  pause.textContent=still()?'Resume motion':'Pause motion';pause.setAttribute('aria-pressed',String(still()));panel.classList.toggle('is-still',still());
  if(state==='closed')return;
  if(still()){cancelAnimationFrame(frame);frame=0;if(state==='returning')finish();else settle();}
  else if(!frame&&!document.hidden){last=performance.now();frame=requestAnimationFrame(tick);}
 }
 trigger.setAttribute('aria-haspopup','dialog');trigger.setAttribute('aria-expanded','false');trigger.addEventListener('click',open);
 close.addEventListener('click',()=>leave());explore.addEventListener('click',()=>{if(selected>=0)leave(data[selected].id);});pause.addEventListener('click',()=>document.getElementById('motionToggle').click());
 panel.querySelector('.orbit-destinations').addEventListener('pointerover',e=>{if(e.target.closest('.orbit-card'))hover=true;});panel.querySelector('.orbit-destinations').addEventListener('pointerout',()=>hover=false);
 panel.addEventListener('keydown',e=>{
  if(e.key==='Escape'){e.preventDefault();e.stopPropagation();leave();}
  if(e.key==='Tab'){const buttons=[...panel.querySelectorAll('button,input,select')].filter(b=>!b.hidden&&getComputedStyle(b).visibility!=='hidden'),first=buttons[0],lastButton=buttons.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();lastButton.focus();}else if(!e.shiftKey&&document.activeElement===lastButton){e.preventDefault();first.focus();}}
 });
 cards.forEach(b=>{b.addEventListener('focus',()=>hover=true);b.addEventListener('blur',()=>hover=false);});
 addEventListener('portfolio:orbit-projected',layout);
 addEventListener('portfolio:resume',sync);reduced.addEventListener('change',sync);addEventListener('resize',()=>{if(state!=='closed'){W.orbitCapture=performance.now();size();renderScene();}});
 document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(frame);frame=0;if(state==='entering')settle();if(state==='returning')finish();}else sync();});
})();
