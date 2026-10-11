/* Deterministic 60 Hz jump with polygon collision verification. */
(() => {
 const trigger=document.getElementById("gdTrigger");if(!trigger)return;
 const text=trigger.querySelector(".gd-text"),stage=trigger.querySelector(".gd-stage");
 const letters=[...text.textContent].map(char=>{const s=document.createElement("span");s.textContent=char===" "?"\u00a0":char;text.append(s);return s;});
 text.firstChild.remove();
 const shapes=[
 [[-25,0],[25,0],[25,50],[-25,50]],
 [[-25,54],[0,102],[25,54]],
 [[-51,25],[-29,49],[-29,0]],
 [[29,0],[29,49],[51,25]],
 [[-89,0],[-63,25],[-29,0]],
 [[29,0],[63,25],[89,0]]
 ];
 const base=220,obstacleX=400,cubeSize=64,speed=4.5,airFrames=244/4.5,takeoff=45,startX=43.5;
 const half=cubeSize/2;
 const polygon=shapes.map(p=>p.map(([x,y])=>[x+obstacleX,y]));
 function intersects(a,b){
   for(const poly of [a,b])for(let i=0;i<poly.length;i++){
     const p=poly[i],q=poly[(i+1)%poly.length],axis=[p[1]-q[1],q[0]-p[0]];
     const A=a.map(p=>p[0]*axis[0]+p[1]*axis[1]),B=b.map(p=>p[0]*axis[0]+p[1]*axis[1]);
     if(Math.max(...A)<=Math.min(...B)||Math.max(...B)<=Math.min(...A))return false;
   }
   return true;
 }
 function pose(frame,launch,height){
   const u=Math.max(0,Math.min(1,(frame-launch)/airFrames));
   return {x:startX+frame*speed,y:4*height*u*(1-u),angle:-Math.PI*u};
 }
 function hits(launch,height){
   for(let f=launch;f<=launch+airFrames;f+=.125){
     const p=pose(f,launch,height),c=Math.cos(p.angle),s=Math.sin(p.angle);
     const cube=[[-half,-half],[half,-half],[half,half],[-half,half]].map(([x,y])=>[p.x+half+x*c-y*s,p.y+half+x*s+y*c]);
     if(polygon.some(poly=>intersects(cube,poly)))return true;
   }
   return false;
 }
 function minimumHeight(launch){let low=40,high=190;for(let i=0;i<22;i++){const mid=(low+high)/2;if(hits(launch,mid))low=mid;else high=mid;}return high;}
 const safe=minimumHeight(takeoff),early=minimumHeight(takeoff-1),late=minimumHeight(takeoff+1);
 const height=safe+Math.min(.08,Math.max(0,(Math.min(early,late)-safe)/2));
 const verified=!hits(takeoff,height)&&hits(takeoff-1,height)&&hits(takeoff+1,height);
 window.gdJumpDiagnostics={hz:60,height,clear:!hits(takeoff,height),earlyCollision:hits(takeoff-1,height),lateCollision:hits(takeoff+1,height),verified};
 window.gdJumpDiagnostics.takeoffGap=obstacleX-89-(pose(takeoff,takeoff,height).x+cubeSize);
 window.gdJumpDiagnostics.landingGap=pose(takeoff+airFrames,takeoff,height).x-(obstacleX+89);
 stage.innerHTML='<span class="gd-camera"><svg class="gd-world" viewBox="0 0 800 280" preserveAspectRatio="xMidYMid meet"><path class="gd-ground" d="M-400 220H1200"/><g class="gd-reference-obstacle">'+shapes.map(p=>'<polygon points="'+p.map(([x,y])=>(x+obstacleX)+','+(base-y)).join(' ')+'"/>').join('')+'</g><g class="gd-player"><rect width="28" height="28" rx="1"/></g></svg></span><span class="gd-morph-shell"></span><span class="gd-apex-text" id="gdApexText">holy gd reference!</span>';
 const world=stage.querySelector(".gd-world"),player=stage.querySelector(".gd-player"),camera=stage.querySelector(".gd-camera"),shell=stage.querySelector(".gd-morph-shell"),popup=stage.querySelector(".gd-apex-text");
 player.querySelector("rect").setAttribute("width",cubeSize);
 world.setAttribute("viewBox","0 -120 800 400");
 player.querySelector("rect").setAttribute("height",cubeSize);
 let playing=false,raf=0;
 const ease=t=>t*t*(3-2*t);
 function play(){
   if(playing)return;playing=true;trigger.classList.add("is-playing");trigger.setAttribute("aria-disabled","true");
   world.style.opacity="0";player.style.opacity="0";
   const reduced=matchMedia("(prefers-reduced-motion: reduce)").matches||window.WORLD?.paused;
   if(reduced){popup.classList.add("flash");setTimeout(reset,1300);return;}
   const rect=text.getBoundingClientRect(),parent=trigger.getBoundingClientRect();
   const boxes=letters.map(l=>l.getBoundingClientRect());
   const unit=parent.width/800,size=cubeSize*unit;
   const stageY=stage.getBoundingClientRect().top-parent.top;
   const targetX=startX*unit,targetY=stageY+(base+120-cubeSize)*unit;
   const start=performance.now(),morph=760,run=2350,restore=650;
   function frame(now){
     const elapsed=now-start;
     if(elapsed<morph){
       const t=ease(Math.min(1,elapsed/morph));
       letters.forEach((l,i)=>{
         const b=boxes[i],dx=targetX+size/2-(b.left-parent.left+b.width/2),dy=targetY+size/2-(b.top-parent.top+b.height/2);
         l.style.transform="translate("+dx*t+"px,"+dy*t+"px) scale("+(1-t*.96)+")";l.style.opacity=t>.88?String((1-t)/.12):"1";
       });
       shell.style.cssText="opacity:1;left:"+((rect.left-parent.left)*(1-t)+targetX*t)+"px;top:"+((rect.top-parent.top-stageY)*(1-t)+(targetY-stageY)*t)+"px;width:"+(rect.width*(1-t)+size*t)+"px;height:"+(rect.height*(1-t)+size*t)+"px;border-radius:"+(5*(1-t))+"px;background:rgba(255,255,255,"+t*t+")";
       world.style.opacity=String(Math.max(0,(t-.55)/.45));player.style.opacity="0";
     }else if(elapsed<morph+run){
       shell.style.opacity="0";player.style.opacity="1";
       const f=(elapsed-morph)/1000*60,p=pose(f,takeoff,height);
       player.setAttribute("transform","translate("+p.x+","+(base-cubeSize-p.y)+") rotate("+(-p.angle*180/Math.PI)+" "+half+" "+half+")");
       const zoom=1+(innerWidth<760?.65:.38)*Math.sin(Math.min(1,f/141)*Math.PI);
       camera.style.transform="translateX("+((400-(p.x+half))*.055*unit*Math.sin(Math.min(1,f/141)*Math.PI))+"px) scale("+zoom+")";
       if(f>takeoff+airFrames*.88)popup.classList.add("flash");
     }else{
       const t=ease(Math.min(1,(elapsed-morph-run)/restore));
       world.style.opacity=String(1-t);camera.style.transform="";
       const endX=(startX+141*speed)*unit;
       shell.style.cssText="opacity:1;left:"+(endX*(1-t)+(rect.left-parent.left)*t)+"px;top:"+((targetY-stageY)*(1-t)+(rect.top-parent.top-stageY)*t)+"px;width:"+(size*(1-t)+rect.width*t)+"px;height:"+(size*(1-t)+rect.height*t)+"px;background:rgba(255,255,255,"+(1-t)*(1-t)+")";
       letters.forEach((l,i)=>{const b=boxes[i],dx=endX+size/2-(b.left-parent.left+b.width/2),dy=targetY+size/2-(b.top-parent.top+b.height/2);l.style.transform="translate("+dx*(1-t)+"px,"+dy*(1-t)+"px) scale("+(.04+.96*t)+")";l.style.opacity=String(Math.min(1,t*4));});
       if(t>=1){reset();return;}
     }
     raf=requestAnimationFrame(frame);
   }
   raf=requestAnimationFrame(frame);
 }
 function reset(){
   cancelAnimationFrame(raf);playing=false;trigger.classList.remove("is-playing");trigger.removeAttribute("aria-disabled");
   letters.forEach(l=>{l.style.transform="";l.style.opacity="";});shell.style.cssText="";world.style.opacity="";camera.style.transform="";popup.classList.remove("flash");
 }
 trigger.addEventListener("click",play);
 trigger.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();play();}if(e.key==="Escape")reset();});
 addEventListener("resize",()=>{if(playing)reset();});
 document.addEventListener("visibilitychange",()=>{if(document.hidden&&playing)reset();});
})();
