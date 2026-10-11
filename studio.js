/* Artwork process comparisons and a selectable screening room. */
(() => {
 const sketches=["Reze.png","ADO LATEST.png","Ai Hoshino.png","Ryo Yamada.png","Raiden LAST remake.png","Artoria Pendragon.png","makima.png","TACHYON.png","raining after all.png","eyes gaze.png","close up eye august.png"];
 const sources=["Reze FINAL.png","ADO FINAL.png","Ai Hoshino FINAL.png","Ryo Yamada FINAL.png","Raiden FINAL.png","Artoria Pendragon.jpg","makima FINAL.png","TACHYON FINAL.png","Raining after all FINAL.jpg","EYE GAZE FINAL.jpg","close up eye august to blur.jpg"];
 const cards=[...document.querySelectorAll(".art-card")];
 const slugs=cards.map(c=>c.querySelector(".art-image>img").getAttribute("src").split("/").pop().replace("-thumb.webp",""));
 const path=(i,size="large")=>"assets/sketches/"+slugs[i]+"-"+size+".webp";
 function comparison(host,title){
   host.classList.add("comparison");
   const before=document.createElement("div");before.className="compare-before";
   const img=document.createElement("img");img.alt=title+" sketch";img.decoding="async";before.append(img);
   const line=document.createElement("span");line.className="compare-line";line.setAttribute("aria-hidden","true");
   const labels=document.createElement("div");labels.className="compare-labels";labels.innerHTML="<span>Sketch</span><span>Finished</span>";
   host.append(before,line,labels);
   const controls=document.createElement("label");controls.className="compare-control";
   const label=document.createElement("span");label.textContent="Sketch / Finished";
   const range=document.createElement("input");range.type="range";range.min=0;range.max=100;range.value=50;range.setAttribute("aria-label","Compare sketch and finished "+title);
   controls.append(label,range);
   const update=()=>{host.style.setProperty("--split",range.value+"%");range.setAttribute("aria-valuetext",range.value+"% sketch revealed");};
   range.addEventListener("input",update);update();
   range.addEventListener("keydown",e=>e.stopPropagation());
   let dragging=false,suppressClick=false;
   const move=e=>{
     const r=host.getBoundingClientRect();
     range.value=Math.round(Math.max(0,Math.min(100,(e.clientX-r.left)/r.width*100)));update();
   };
   host.addEventListener("pointerdown",e=>{
     if(host.classList.contains("zoomed")||e.button!==0)return;
     const r=host.getBoundingClientRect(),divider=r.left+r.width*Number(range.value)/100;
     if(Math.abs(e.clientX-divider)>28)return;
     e.preventDefault();e.stopPropagation();dragging=true;suppressClick=true;
     host.setPointerCapture(e.pointerId);move(e);
   });
   host.addEventListener("pointermove",e=>{if(dragging){e.preventDefault();move(e);}});
   host.addEventListener("pointerup",e=>{if(dragging){dragging=false;host.releasePointerCapture(e.pointerId);setTimeout(()=>suppressClick=false,250);}});
   host.addEventListener("pointercancel",()=>{dragging=false;suppressClick=false;});
   host.addEventListener("click",e=>{if(suppressClick){e.preventDefault();e.stopPropagation();}},true);
   host.addEventListener("touchstart",e=>{if(dragging)e.stopPropagation();},{passive:true});
   host.addEventListener("touchend",e=>{if(suppressClick)e.stopPropagation();},{capture:true,passive:true});
   return {img,controls,range,update};
 }
 const observer=new IntersectionObserver(entries=>entries.forEach(e=>{
   if(!e.isIntersecting)return;
   const card=e.target,i=Number(card.querySelector("[data-art]").dataset.art);
   card.querySelector(".compare-before img").src=path(i,"thumb");observer.unobserve(card);
 }),{rootMargin:"100px"});
 cards.forEach((card,i)=>{
   const c=comparison(card.querySelector(".art-image"),card.querySelector("h3").textContent);
   const image=card.querySelector(".art-image>img");
   card.querySelector(".art-image").style.aspectRatio=image.getAttribute("width")+"/"+image.getAttribute("height");
   card.append(c.controls);observer.observe(card);
 });
 const full=document.getElementById("fullArtwork"),host=document.getElementById("artStage");
 const viewer=comparison(host,"artwork");host.after(viewer.controls);
 const loadComparison=()=>{
   const slug=(full.getAttribute("src")||"").split("/").pop().replace("-large.webp","");
   const i=slugs.indexOf(slug);if(i<0)return;
   const original=cards[i].querySelector(".art-image>img");
   host.style.setProperty("--art-ratio",Number(original.getAttribute("width"))/Number(original.getAttribute("height")));
   viewer.controls.style.setProperty("--art-ratio",Number(original.getAttribute("width"))/Number(original.getAttribute("height")));
   document.getElementById("artViewer").style.setProperty("--art-ratio",Number(original.getAttribute("width"))/Number(original.getAttribute("height")));
   viewer.img.src=path(i);viewer.img.alt=cards[i].querySelector("h3").textContent+" sketch";
   viewer.range.value=50;viewer.update();
   viewer.range.setAttribute("aria-label","Compare sketch and finished "+cards[i].querySelector("h3").textContent);
 };
 new MutationObserver(loadComparison).observe(full,{attributes:true,attributeFilter:["src"]});
 new MutationObserver(()=>{
   const zoomed=host.classList.contains("zoomed");
   viewer.range.disabled=zoomed;viewer.controls.querySelector("span").textContent=zoomed?"Fit image to compare":"Sketch / Finished";
 }).observe(host,{attributes:true,attributeFilter:["class"]});
 // The collage owns decoded display-size previews. Originals are reserved for comparisons and the viewer.
 const projects=document.getElementById("projects"),items=[...projects.children];
 const toolbar=document.querySelector(".video-layout-toolbar"),switcher=toolbar.querySelector(".view-switch");
 const theater=document.createElement("div");theater.className="screening-room";
 theater.innerHTML='<div class="screening-top"><span>Take a seat. Pick a film.</span><span class="screening-count"></span></div><button type="button" class="screening-poster"><img alt=""><span class="screening-shade"></span><span class="screening-caption"><span class="screening-genre"></span><strong></strong><span class="screening-play">Play film &#9654;</span></span></button><div class="screening-navigation"><button type="button" class="film-prev" aria-label="Previous film">&#8592;</button><span>Explore the collection</span><button type="button" class="film-next" aria-label="Next film">&#8594;</button></div><div class="screening-rail" role="group" aria-label="Select a film"></div><span class="sr-only screening-status" role="status"></span>';
 projects.before(theater);
 const option=document.createElement("button");option.type="button";option.dataset.videoView="screening";option.textContent="Screening room";switcher.prepend(option);
 const rail=theater.querySelector(".screening-rail");
 let active=0,mode="screening";
 const checkedStills=new Set();
 const visible=()=>items.map((li,i)=>li.hidden?-1:i).filter(i=>i>=0);
 const thumbs=items.map((li,i)=>{
   const a=li.querySelector(".project"),b=document.createElement("button");b.type="button";
   const img=a.querySelector("img").cloneNode();img.alt="";const label=document.createElement("span");label.textContent=a.dataset.title;
   b.append(img,label);b.addEventListener("click",()=>{active=i;render();});rail.append(b);return b;
 });
 function render(){
   const list=visible();if(!list.includes(active))active=list[0];
   const a=items[active].querySelector(".project");
   if(!checkedStills.has(a.dataset.video)){
     checkedStills.add(a.dataset.video);
     const probe=new Image(),index=active;
     probe.onload=()=>{if(probe.naturalWidth>500){a.querySelector("img").src=probe.src;thumbs[index].querySelector("img").src=probe.src;}};
     probe.src="https://img.youtube.com/vi/"+a.dataset.video+"/maxresdefault.jpg";
   }
   const img=theater.querySelector(".screening-poster>img");
   img.src=a.querySelector("img").src;img.alt=a.dataset.title+" video still";
   theater.querySelector("strong").textContent=a.dataset.title;
   theater.querySelector(".screening-genre").textContent=a.dataset.subtitle;
   theater.querySelector(".screening-count").textContent=String(list.indexOf(active)+1).padStart(2,"0")+" / "+String(list.length).padStart(2,"0");
   theater.querySelector(".screening-poster").setAttribute("aria-label","Play "+a.dataset.title);
   theater.querySelector(".screening-status").textContent=a.dataset.title+", "+a.dataset.subtitle;
   thumbs.forEach((b,i)=>{b.hidden=!list.includes(i);b.setAttribute("aria-pressed",String(i===active));});
   const selected=thumbs[active];rail.scrollTo({left:Math.max(0,selected.offsetLeft-rail.offsetLeft-rail.clientWidth/2+selected.offsetWidth/2),behavior:window.WORLD?.paused?"instant":"smooth"});
 }
 function step(d){const list=visible();active=list[(list.indexOf(active)+d+list.length)%list.length];render();}
 theater.querySelector(".film-prev").addEventListener("click",()=>step(-1));
 theater.querySelector(".film-next").addEventListener("click",()=>step(1));
 theater.querySelector(".screening-poster").addEventListener("click",e=>{
   items[active].querySelector(".project").click();
   document.getElementById("videoViewer").addEventListener("close",()=>theater.querySelector(".screening-poster").focus({preventScroll:true}),{once:true});
 });
 theater.addEventListener("keydown",e=>{if(e.key==="ArrowLeft"||e.key==="ArrowRight"){e.preventDefault();step(e.key==="ArrowRight"?1:-1);}});
 let touch;
 theater.querySelector(".screening-poster").addEventListener("touchstart",e=>{touch=e.touches.length===1?{x:e.touches[0].clientX,y:e.touches[0].clientY}:null;},{passive:true});
 let swiped=false;
 theater.querySelector(".screening-poster").addEventListener("touchend",e=>{if(touch){const dx=e.changedTouches[0].clientX-touch.x,dy=e.changedTouches[0].clientY-touch.y;if(Math.abs(dx)>60&&Math.abs(dx)>Math.abs(dy)*1.5){step(dx<0?1:-1);swiped=true;setTimeout(()=>swiped=false,400);}touch=null;}},{passive:true});
 theater.querySelector(".screening-poster").addEventListener("click",e=>{if(swiped){e.preventDefault();e.stopImmediatePropagation();} },true);
 function setView(value){mode=value;theater.hidden=mode!=="screening";projects.hidden=mode==="screening";switcher.querySelectorAll("button").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.videoView===mode)));dispatchEvent(new Event("resize"));}
 toolbar.addEventListener("click",e=>{const b=e.target.closest("[data-video-view]");if(b)setView(b.dataset.videoView);});
 document.querySelectorAll("[data-video-filter]").forEach(b=>b.addEventListener("click",()=>{render();setView(mode);}));
 // Keep the selected still in sync when the higher-resolution YouTube image arrives.
 items.forEach((li,i)=>new MutationObserver(()=>{if(i===active)theater.querySelector(".screening-poster>img").src=li.querySelector("img").src;}).observe(li.querySelector("img"),{attributes:true,attributeFilter:["src"]}));
 render();setView("screening");
 // A small constellation burst accompanies the existing interactive orb.
 document.getElementById("orbPulse").addEventListener("click",e=>{
   if(window.WORLD?.paused)return;
   const r=e.currentTarget.getBoundingClientRect(),x=r.left+r.width/2,y=r.top;
   for(let i=0;i<12;i++){
     const star=document.createElement("i");star.className="orb-spark";star.style.left=x+"px";star.style.top=y+"px";
     star.style.setProperty("--dx",Math.cos(i*Math.PI/6)*(70+Math.random()*90)+"px");
     star.style.setProperty("--dy",(-60+Math.sin(i*Math.PI/6)*100)+"px");
     document.body.append(star);star.addEventListener("animationend",()=>star.remove(),{once:true});setTimeout(()=>star.remove(),1500);
   }
 });
})();
