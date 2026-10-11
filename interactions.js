/* Small identity details, reversible scroll reveals, and a finite universe burst. */
(() => {
  const W=window.WORLD, reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const off=()=>W.paused||reduced.matches;
  const logo=document.querySelector('.hud-logo');
  logo.innerHTML='<span class="logo-word" aria-hidden="true"><b>A</b><span class="logo-middle">'+[...'ndrei'].map((c,i)=>`<i style="--letter:${i}">${c}</i>`).join('')+'</span><b>G</b></span>';
  const brand=document.createElement('div');brand.className='brand-lockup';logo.before(brand);brand.append(logo);
  let logoTimer;
  function playLogo(){
    if(off()||logo.classList.contains('logo-intro'))return;
    clearTimeout(logoTimer);
    void logo.offsetWidth;logo.classList.add('logo-intro');
    logoTimer=setTimeout(()=>logo.classList.remove('logo-intro'),4700);
  }
  logo.addEventListener('click',playLogo);
  const loader=document.getElementById('loader');
  const loaded=new MutationObserver(()=>{if(loader.hidden){loaded.disconnect();playLogo();}});
  if(loader.hidden)playLogo();else loaded.observe(loader,{attributes:true,attributeFilter:['hidden']});

  // Only update on scroll/resize. Progress is reversible and does not hide content.
  const entries=[...document.querySelectorAll('[data-section]')].flatMap(section=>[...section.children]).filter(e=>!e.hidden);
  entries.forEach(e=>e.classList.add('scroll-entry'));
  let scrollFrame=0;
  function reveal(){
    scrollFrame=0;
    const distance=innerWidth<761?18:42;
    const readings=entries.map(e=>e.getBoundingClientRect().top-(Number(e.dataset.entryShift)||0));
    entries.forEach((e,i)=>{
      const p=off()?1:Math.max(0,Math.min(1,(innerHeight-readings[i])/(innerHeight*.42)));
      const eased=p*p*(3-2*p),shift=(1-eased)*distance;
      e.style.setProperty('--entry-opacity',.18+.82*eased);e.style.setProperty('--entry-y',shift+'px');e.dataset.entryShift=shift;
    });
  }
  function queueReveal(){if(!scrollFrame)scrollFrame=requestAnimationFrame(reveal);}
  addEventListener('scroll',queueReveal,{passive:true});addEventListener('resize',queueReveal);
  new ResizeObserver(queueReveal).observe(document.getElementById('main'));reveal();

  const trigger=document.getElementById('orbPulse');
  trigger.querySelector('span').innerHTML='<svg class="universe-symbol" viewBox="0 0 32 32"><circle cx="16" cy="16" r="7"/><ellipse cx="16" cy="16" rx="15" ry="5" transform="rotate(-30 16 16)"/><circle cx="26" cy="7" r="1"/></svg>';
  const canvas=document.createElement('canvas');canvas.className='universe-burst';canvas.setAttribute('aria-hidden','true');canvas.hidden=true;document.body.append(canvas);
  const ctx=canvas.getContext('2d');
  const main=document.getElementById('main');
  let burstFrame=0,started=0,stars=[],width=0,height=0;
  function stopBurst(){
    cancelAnimationFrame(burstFrame);burstFrame=0;W.universeBoost=0;canvas.hidden=true;
    main.style.removeProperty('translate');main.style.removeProperty('rotate');
    document.body.classList.remove('universe-active');trigger.setAttribute('aria-pressed','false');
  }
  function burst(now){
    if(off()||document.hidden||W.modal){stopBurst();return;}
    const t=(now-started)/1000;
    if(t>=6.5){stopBurst();return;}
    const attack=Math.min(1,t/1.1),release=Math.max(0,1-Math.max(0,t-1.1)/5.4);
    const strength=attack*release*release;
    W.universeBoost=strength;
    ctx.clearRect(0,0,width,height);
    const cx=width*.57,cy=height*.42,range=Math.hypot(width,height)*.7;
    ctx.globalCompositeOperation='lighter';ctx.lineCap='round';
    stars.forEach(s=>{
      const progress=(s.offset+t*.28)%1,r=progress*progress*range;
      const angle=s.angle+t*.12*strength;
      const tail=r*(.025+strength*.16);
      ctx.strokeStyle=`rgba(${s.color},${Math.sin(progress*Math.PI)*strength*.65})`;
      ctx.lineWidth=s.size;
      ctx.beginPath();ctx.moveTo(cx+Math.cos(angle)*(r-tail),cy+Math.sin(angle)*(r-tail));ctx.lineTo(cx+Math.cos(angle)*r,cy+Math.sin(angle)*r);ctx.stroke();
    });
    for(let i=0;i<3;i++){
      const p=(t*.3+i/3)%1;ctx.strokeStyle=`rgba(125,190,255,${(1-p)*strength*.25})`;ctx.lineWidth=1;
      ctx.beginPath();ctx.ellipse(cx,cy,Math.max(1,p*range),Math.max(1,p*range*.48),-.3+t*.08,0,Math.PI*2);ctx.stroke();
    }
    const mobile=width<761;
    main.style.translate=`0 ${Math.sin(t*3)*strength*(mobile?2:7)}px`;
    main.style.rotate=`${Math.sin(t*2)*strength*(mobile?.04:.12)}deg`;
    burstFrame=requestAnimationFrame(burst);
  }
  trigger.setAttribute('aria-pressed','false');
  trigger.addEventListener('click',()=>{
    if(off()||!ctx)return;
    stopBurst();width=innerWidth;height=innerHeight;
    const ratio=Math.min(devicePixelRatio,1.5);canvas.width=Math.round(width*ratio);canvas.height=Math.round(height*ratio);ctx.setTransform(ratio,0,0,ratio,0,0);
    stars=Array.from({length:width<761?36:100},()=>({angle:Math.random()*Math.PI*2,offset:Math.random(),size:Math.random()*1.3+.5,color:Math.random()>.5?'130,191,255':'255,161,123'}));
    started=performance.now();canvas.hidden=false;document.body.classList.add('universe-active');trigger.setAttribute('aria-pressed','true');burstFrame=requestAnimationFrame(burst);
  });
  function sync(){
    if(off()||W.modal||document.hidden){stopBurst();clearTimeout(logoTimer);logo.classList.remove('logo-intro');}
    logo.setAttribute('aria-disabled',String(off()));logo.title=off()?'Resume motion to replay the logo':'Replay logo animation';queueReveal();
  }
  addEventListener('portfolio:resume',sync);reduced.addEventListener('change',sync);document.addEventListener('visibilitychange',sync);
  addEventListener('resize',stopBurst);document.addEventListener('keydown',e=>{if(e.key==='Escape')stopBurst();});sync();
})();
