/* A few recurring visual details, built from the portfolio's own work. */
(() => {
  const about=document.querySelector('#about .about-bottom');
  const desk=document.createElement('div');desk.className='creative-desk';
  desk.innerHTML=`
    <a class="desk-sketch" href="#artworks" aria-label="Explore my drawings">
      <span class="desk-eyebrow">01 / A FIRST LINE</span>
      <div class="desk-paper"><img src="assets/sketches/reze-thumb.webp" alt="My Reze drawing in its sketch stage" loading="lazy" decoding="async"><img class="desk-finish" src="assets/artworks/reze-thumb.webp" alt="" loading="lazy" decoding="async"></div>
      <span class="desk-caption">Something takes shape. <b aria-hidden="true">&#8599;</b></span>
    </a>
    <a class="desk-edit" href="#portfolio" aria-label="Explore my video edits">
      <span class="desk-eyebrow">02 / FINDING THE RHYTHM</span>
      <div class="edit-monitor"><img src="https://img.youtube.com/vi/wf6TxDM7DSw/hqdefault.jpg" alt="Motion 02 video still" loading="lazy" decoding="async"><span>IN / OUT</span><i aria-hidden="true"></i></div>
      <div class="mini-timeline" aria-hidden="true"><div><i></i><i></i><i></i><i></i></div><div><i></i><i></i><i></i></div><div class="audio-track"></div><b></b></div>
      <span class="desk-caption">A feeling, frame by frame. <b aria-hidden="true">&#8599;</b></span>
    </a>
    <div class="desk-note"><span class="desk-eyebrow">THE PART I LIKE</span><p>A sketch.<br>A cut.<br><em>One more try.</em></p><svg viewBox="0 0 150 55" aria-hidden="true"><path d="M140 8C103 45 55 47 16 29m0 0 24-4m-24 4 12 17"/></svg><span>Following an idea<br>just to see where it goes.</span></div>`;
  about.before(desk);
  const destinations=['portfolio','artworks','toolkit','contact'];
  const bridges=destinations.map((id,i)=>{
    const el=document.createElement('div');el.className='chapter-bridge';el.setAttribute('aria-hidden','true');
    el.innerHTML=`<span>0${i+2}</span><svg viewBox="0 0 1000 160" preserveAspectRatio="none"><path class="bridge-base" d="M-80 130C160 -50 400 210 650 75S850 0 1080 100"/><path class="bridge-trace" d="M-80 130C160 -50 400 210 650 75S850 0 1080 100" pathLength="1"/><circle class="bridge-planet-halo" r="17"/><circle class="bridge-planet" r="5"/></svg>`;
    document.getElementById(id).before(el);return el;
  });
  let frame=0;
  function trace(){frame=0;const paused=window.WORLD?.paused||matchMedia('(prefers-reduced-motion: reduce)').matches;bridges.forEach(el=>{const p=paused?1:Math.max(0,Math.min(1,(innerHeight-el.getBoundingClientRect().top)/innerHeight));el.style.setProperty('--journey',p);const svg=el.querySelector('svg'),w=el.clientWidth,h=el.clientHeight;svg.setAttribute('viewBox',`0 0 ${w} ${h}`);const d=`M${-40} ${h*.7} C${w*.22} ${h*.05} ${w*.4} ${h*.96} ${w*.65} ${h*.47} S${w*.86} ${h*.12} ${w+40} ${h*.6}`;el.querySelectorAll('path').forEach(path=>path.setAttribute('d',d));const path=el.querySelector('.bridge-base'),point=path.getPointAtLength(path.getTotalLength()*(.04+p*.92));el.querySelectorAll('circle').forEach(c=>{c.setAttribute('cx',point.x);c.setAttribute('cy',point.y);});});}
  function queue(){if(!frame)frame=requestAnimationFrame(trace);}
  addEventListener('scroll',queue,{passive:true});addEventListener('resize',queue);addEventListener('portfolio:resume',queue);trace();
  const contact=document.getElementById('contact');
  const system=document.createElement('div');system.className='contact-system';system.setAttribute('aria-hidden','true');
  system.innerHTML='<span class="contact-sun"></span><div class="contact-orbit orbit-one"><i></i></div><div class="contact-orbit orbit-two"><i></i></div><div class="contact-orbit orbit-three"><i></i></div><span class="system-coordinate">STAY IN ORBIT</span>';
  contact.prepend(system);
  const observer=new IntersectionObserver(([entry])=>system.classList.toggle('in-view',entry.isIntersecting),{threshold:.1});observer.observe(system);
  document.addEventListener('visibilitychange',()=>system.classList.toggle('tab-hidden',document.hidden));
})();
