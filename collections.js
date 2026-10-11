/* Layered sketchbook: progressive enhancement of the original accessible gallery. */
(() => {
  const grid = document.getElementById("artGrid");
  const switcher = document.querySelector(".view-switch");
  const originals = [...grid.querySelectorAll("[data-art]")];
  const previews = originals.map(a => a.querySelector("img").getAttribute("src"));
  const decoded = new Map();
  function prepare(index) {
    if (!decoded.has(index)) {
      const img = new Image(); img.decoding = "async";
      img.src = previews[index].replace("-thumb.webp", "-large.webp");
      decoded.set(index, img.decode().then(() => img.src).catch(() => previews[index]));
    }
    return decoded.get(index);
  }
  const stage = document.createElement("div");
  stage.className = "collage";
  stage.innerHTML = '<div class="collage-stage" role="group" aria-label="Layered artwork collection"></div><div class="collage-footer"><div><span class="mono">THE SKETCHBOOK / <span class="collage-count"></span></span><h3 class="collage-title"></h3></div><div class="collage-controls"><button type="button" class="collage-prev" aria-label="Previous artwork">&#8592;</button><button type="button" class="collage-open">View artwork &#8599;</button><button type="button" class="collage-next" aria-label="Next artwork">&#8594;</button></div></div><p class="collage-hint mono">Choose a layer to bring it forward · Swipe or use the arrows to explore</p><span class="sr-only collage-status" role="status"></span>';
  grid.before(stage);
  const canvas = stage.querySelector(".collage-stage");
  const backdrop = document.createElement("img");
  backdrop.className = "collage-backdrop"; backdrop.alt = ""; backdrop.setAttribute("aria-hidden", "true");
  canvas.prepend(backdrop);
  const caption = document.createElement("p");
  caption.className = "collage-description";
  stage.querySelector(".collage-title").after(caption);
  const rail = document.createElement("div");
  rail.className = "art-rail"; rail.setAttribute("role", "group"); rail.setAttribute("aria-label", "Choose an artwork");
  stage.querySelector(".collage-footer").after(rail);
  const railButtons = originals.map((a, index) => {
    const b = document.createElement("button"); b.type = "button";
    b.className = "art-rail-item";
    const img = a.querySelector("img").cloneNode(); img.alt = ""; img.loading = "lazy";
    const name = document.createElement("span"); name.textContent = a.querySelector("h3").textContent;
    b.append(img, name); b.setAttribute("aria-label", "Select " + name.textContent);
    b.addEventListener("click", () => { active = index; render(); });
    rail.append(b); return b;
  });
  const button = document.createElement("button");
  button.type = "button"; button.dataset.view = "collage"; button.textContent = "Collage";
  switcher.prepend(button);
  let active = 1, displayed = 1, renderTicket = 0, mode = "collage";
  const available = () => originals.filter(a => !a.closest(".art-card").hidden);
  const layers = originals.map((a, index) => {
    const b = document.createElement("button");
    b.type = "button"; b.className = "collage-layer"; b.dataset.index = index;
    b.dataset.slot = "off"; b.inert = true;
    const image = a.querySelector("img").cloneNode();
    image.removeAttribute("width"); image.removeAttribute("height"); image.loading = "eager"; image.decoding = "async"; image.draggable = false;
    b.append(image);
    const title = a.querySelector("h3").textContent;
    b.setAttribute("aria-label", title + " — bring forward");
    b.addEventListener("click", () => {
      if (active === index) openArt(b);
      else { active = index; render(); }
    });
    canvas.append(b); return b;
  });
  function openArt(opener) {
    originals[displayed].click();
    const dialog = document.getElementById("artViewer");
    if (dialog.open) dialog.addEventListener("close", () => opener.focus({preventScroll:true}), {once:true});
  }
  async function render() {
    const ticket = ++renderTicket;
    const list = available().map(a => originals.indexOf(a));
    if (!list.includes(active)) active = list[0];
    const requested = active;
    await layers[requested].querySelector("img").decode().catch(() => {});
    if (ticket !== renderTicket) return;
    displayed = requested;
    const center = list.indexOf(active);
    layers.forEach(b => { b.dataset.slot = "off"; b.inert = true; b.setAttribute("aria-hidden", "true"); });
    // Largest layers sit furthest back; smaller portraits overlap at the center.
    const offsets = list.length >= 5 ? [-2,-1,1,2,0] : list.length >= 3 ? [-1,1,0] : list.length === 2 ? [1,0] : [0];
    offsets.forEach(offset => {
      const index = list[(center + offset + list.length) % list.length];
      const b = layers[index]; b.hidden = false; b.dataset.slot = offset; b.inert = false; b.removeAttribute("aria-hidden");
      b.setAttribute("aria-label", originals[index].querySelector("h3").textContent + (offset === 0 ? " — open artwork" : " — bring forward"));
    });
    const title = originals[active].querySelector("h3").textContent;
    stage.querySelector(".collage-title").textContent = title;
    const selectedIndex = active;
    const selectedImage = layers[selectedIndex].querySelector("img");
    // Keep the decoded thumbnail painted while its sharper replacement loads.
    prepare(selectedIndex).then(src => {
      if (selectedImage.getAttribute("src") !== src) selectedImage.src = src;
    });
    const background = new Image(); background.src = previews[selectedIndex];
    background.decode().then(() => { if (active === selectedIndex) backdrop.src = background.src; }).catch(() => {});
    for (const delta of [-1, 1]) prepare(list[(center + delta + list.length) % list.length]);
    caption.textContent = originals[active].closest(".art-card").dataset.artCategory === "study" ? "Detail study / Digital art" : "Character illustration / Digital art";
    stage.style.setProperty("--collection-progress", (center + 1) / list.length);
    railButtons.forEach((b, i) => {
      b.hidden = !list.includes(i); b.setAttribute("aria-pressed", String(i === active));
    });
    const selected = railButtons[active];
    rail.scrollTo({left: Math.max(0, selected.offsetLeft - rail.offsetLeft - rail.clientWidth / 2 + selected.offsetWidth / 2), behavior: window.WORLD?.paused ? "instant" : "smooth"});
    stage.querySelector(".collage-count").textContent = String(center + 1).padStart(2,"0") + " / " + String(list.length).padStart(2,"0");
    stage.querySelector(".collage-status").textContent = title + ", artwork " + (center+1) + " of " + list.length;
  }
  function step(delta) {
    const list = available().map(a => originals.indexOf(a));
    active = list[(list.indexOf(active) + delta + list.length) % list.length]; render();
  }
  stage.querySelector(".collage-prev").addEventListener("click", () => step(-1));
  stage.querySelector(".collage-next").addEventListener("click", () => step(1));
  stage.querySelector(".collage-open").addEventListener("click", e => openArt(e.currentTarget));
  stage.addEventListener("keydown", e => {
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") { e.preventDefault(); step(e.key === "ArrowRight" ? 1 : -1); stage.querySelector(e.key === "ArrowRight" ? ".collage-next" : ".collage-prev").focus({preventScroll:true}); }
  });
  let touch, swiped = false;
  let tiltFrame = 0, lean = "0deg";
  canvas.addEventListener("pointermove", e => {
    if (e.pointerType !== "mouse" || window.WORLD?.paused) return;
    const r = canvas.getBoundingClientRect();
    lean = ((e.clientX - r.left) / r.width - .5) * 5 + "deg";
    if (!tiltFrame) tiltFrame = requestAnimationFrame(() => { canvas.style.setProperty("--lean", lean); tiltFrame = 0; });
  }, {passive:true});
  canvas.addEventListener("pointerleave", () => { lean = "0deg"; canvas.style.setProperty("--lean", lean); });
  canvas.addEventListener("touchstart", e => { touch = e.touches.length === 1 ? {x:e.touches[0].clientX,y:e.touches[0].clientY}:null; swiped=false; }, {passive:true});
  canvas.addEventListener("touchend", e => {
    if (!touch) return;
    const dx=e.changedTouches[0].clientX-touch.x,dy=e.changedTouches[0].clientY-touch.y;
    if(Math.abs(dx)>50 && Math.abs(dx)>Math.abs(dy)*1.5){swiped=true;step(dx<0?1:-1);}
    touch=null;
  },{passive:true});
  canvas.addEventListener("click",e=>{if(swiped){e.preventDefault();e.stopPropagation();swiped=false;}},true);
  function setView(view) {
    mode=view; grid.hidden=view==="collage"; stage.hidden=view!=="collage";
    grid.classList.toggle("compact",view==="compact");
    switcher.querySelectorAll("[data-view]").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.view===view)));
    dispatchEvent(new Event("resize"));
  }
  switcher.addEventListener("click",e=>{const b=e.target.closest("[data-view]");if(b)setView(b.dataset.view);});
  document.querySelectorAll("[data-art-filter]").forEach(b=>b.addEventListener("click",()=>{render();setView(mode);}));
  render();setView("collage");
})();
