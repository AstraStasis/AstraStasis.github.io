/* Cinema is an alternative presentation of the same playable project links. */
(() => {
  const projects = document.getElementById("projects");
  const filters = document.querySelector(".video-filters");
  const toolbar = document.createElement("div");
  toolbar.className = "video-layout-toolbar";
  toolbar.innerHTML = '<span class="mono">THE MOTION ARCHIVE <span class="archive-count">11 FILMS</span></span><div class="view-switch" role="group" aria-label="Video layout"><button type="button" data-video-view="cinema" aria-pressed="true">Cinema</button></div>';
  filters.after(toolbar);
  const categories = {motion:"Motion graphics", dance:"Dance films", logos:"Logo reveals", education:"Stories & ideas"};
  const items = [...projects.children];
  items.forEach((li, i) => {
    const a = li.querySelector(".project");
    const detail = document.createElement("span");
    detail.className = "cinema-detail";
    const genre = document.createElement("span"); genre.textContent = categories[li.dataset.videoCategory];
    const action = document.createElement("span"); action.textContent = "WATCH FILM";
    detail.append(genre, action); a.append(detail);
    a.style.setProperty("--film-accent", ["#ff8057","#c8b8ff","#a4d5c9","#e8c18d"][i%4]);
    // Use larger stills when YouTube has them; retain the reliable original otherwise.
    const img = a.querySelector(".p-thumb"), original = img.src;
    const probe = new Image();
    probe.onload = () => { if (probe.naturalWidth > 500) img.src = probe.src; };
    const observer = new IntersectionObserver(entries => {
      if(entries.some(e=>e.isIntersecting)){probe.src="https://img.youtube.com/vi/"+a.dataset.video+"/maxresdefault.jpg";observer.disconnect();}
    },{rootMargin:"300px"});
    observer.observe(a);
    img.addEventListener("error",()=>{if(img.src!==original)img.src=original;},{once:true});
  });
  function arrange() {
    const visible = items.filter(li=>!li.hidden);
    items.forEach(li=>li.classList.remove("cinema-lead","cinema-wide"));
    visible.forEach((li,i)=>{li.classList.toggle("cinema-lead",i===0);li.classList.toggle("cinema-wide",i>0&&i%5===0);});
    toolbar.querySelector(".archive-count").textContent = String(visible.length).padStart(2,"0")+" FILMS";
  }
  toolbar.addEventListener("click",e=>{
    const b=e.target.closest("[data-video-view]");if(!b)return;
    projects.classList.toggle("cinema-wall",b.dataset.videoView==="cinema");
    toolbar.querySelectorAll("button").forEach(other=>other.setAttribute("aria-pressed",String(other===b)));
    dispatchEvent(new Event("resize"));
  });
  document.querySelectorAll("[data-video-filter]").forEach(b=>b.addEventListener("click",arrange));
  projects.classList.add("cinema-wall");arrange();
})();
