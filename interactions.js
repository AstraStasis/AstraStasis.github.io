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
  function sync(){
    if(off()||W.modal||document.hidden){clearTimeout(logoTimer);logo.classList.remove('logo-intro');}
    logo.setAttribute('aria-disabled',String(off()));logo.title=off()?'Resume motion to replay the logo':'Replay logo animation';queueReveal();
  }
  addEventListener('portfolio:resume',sync);reduced.addEventListener('change',sync);document.addEventListener('visibilitychange',sync);
  sync();
})();
