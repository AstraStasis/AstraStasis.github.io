/* Progressive enhancements: content and destination links work without JavaScript. */
(() => {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const W = window.WORLD = { pointer: { x: 0, y: 0, nx: 0, ny: 0 }, scroll: 0, hue: null, hueShift: 0, pulse: 0, blobHover: false, modal: false, sceneReady: false, paused: reduced.matches };
  if (location.protocol === "http:" && location.hostname === "127.0.0.1") {
    const url = new URL(location.href); url.hostname = "localhost"; location.replace(url.href); return;
  }
  const resumeScene = () => dispatchEvent(new Event("portfolio:resume"));
  const loader = $("loader"); loader.hidden = false;
  const start = performance.now();
  const loading = setInterval(() => {
    const elapsed = performance.now() - start;
    const done = (W.sceneReady && elapsed > 650) || elapsed > 2400;
    const n = done ? 100 : Math.min(94, Math.round(elapsed / 25));
    $("loaderCount").textContent = String(n).padStart(3, "0");
    $("loaderBar").style.setProperty("--p", n / 100);
    if (done) { clearInterval(loading); loader.classList.add("done"); setTimeout(() => { loader.hidden = true; }, 500); }
  }, 80);
  $("year").textContent = new Date().getFullYear();
  const clock = () => { $("clock").textContent = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Manila", hour: "2-digit", minute: "2-digit" }).format(new Date()); };
  clock(); setInterval(clock, 60000);
  const motion = $("motionToggle"); motion.hidden = false;
  function setMotion(paused) {
    W.paused = paused; document.body.classList.toggle("motion-paused", paused);
    motion.textContent = paused ? "Resume motion" : "Pause motion"; motion.setAttribute("aria-pressed", String(paused)); resumeScene();
  }
  motion.addEventListener("click", () => setMotion(!W.paused));
  reduced.addEventListener("change", e => setMotion(e.matches)); setMotion(W.paused);
  const menu = $("menu"), menuToggle = $("menuToggle"); menuToggle.hidden = false;
  function closeMenu() { menu.hidden = true; menuToggle.setAttribute("aria-expanded", "false"); document.body.classList.remove("menu-open"); }
  menuToggle.addEventListener("click", () => {
    const open = menu.hidden; menu.hidden = !open; menuToggle.setAttribute("aria-expanded", String(open)); document.body.classList.toggle("menu-open", open);
  });
  menu.addEventListener("click", e => { if (e.target.closest("a")) closeMenu(); });
  document.addEventListener("keydown", e => {
    if (e.key === "Escape" && !menu.hidden) { closeMenu(); menuToggle.focus(); }
    if (e.key === "Tab" && !menu.hidden) {
      const links = [...menu.querySelectorAll("a")], last = links.at(-1);
      if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); menuToggle.focus(); }
      else if (e.shiftKey && document.activeElement === menuToggle) { e.preventDefault(); last.focus(); }
    }
  });
  addEventListener("resize", () => { if (innerWidth > 760) closeMenu(); });
  const sections = [...document.querySelectorAll("[data-section]")];
  let scrollPending = false;
  function updateScroll() {
    scrollPending = false;
    const y = scrollY + innerHeight * .25;
    let i = 0; while (i < sections.length - 1 && sections[i + 1].offsetTop <= y) i++;
    const next = sections[i + 1];
    W.scroll = i + (next ? Math.max(0, Math.min(1, (y - sections[i].offsetTop) / (next.offsetTop - sections[i].offsetTop))) : 0);
    $("secIndex").textContent = String(i + 1).padStart(2, "0");
    document.querySelector(".scroll-progress").style.transform = "scaleX(" + (scrollY / Math.max(1, document.documentElement.scrollHeight - innerHeight)) + ")";
    document.querySelectorAll(".hud-nav a").forEach(a => { if (a.hash === "#" + sections[i].id) a.setAttribute("aria-current", "location"); else a.removeAttribute("aria-current"); });
  }
  addEventListener("scroll", () => { if (!scrollPending) { scrollPending = true; requestAnimationFrame(updateScroll); } }, { passive: true });
  addEventListener("resize", updateScroll); updateScroll();
  const cursor = $("cursor"), preview = $("preview");
  const fine = matchMedia("(hover: hover) and (pointer: fine)");
  document.addEventListener("pointermove", e => {
    W.pointer = { x: e.clientX, y: e.clientY, nx: e.clientX / innerWidth * 2 - 1, ny: 1 - e.clientY / innerHeight * 2 };
    if (!fine.matches || W.paused || W.modal) { cursor.classList.remove("active"); preview.hidden = true; return; }
    const target = e.target.closest("[data-cursor]");
    cursor.classList.toggle("active", !!target);
    cursor.classList.toggle("cursor-gd", target?.dataset.cursor === "Jump!");
    if (target) { $("cursorLabel").textContent = target.dataset.cursor; cursor.style.transform = "translate(" + (e.clientX - 32) + "px," + (e.clientY - 32) + "px)"; }
    const project = e.target.closest(".project");
    preview.hidden = !project;
    if (project) {
      const src = "https://img.youtube.com/vi/" + project.dataset.video + "/hqdefault.jpg";
      if ($("previewImage").getAttribute("src") !== src) $("previewImage").src = src;
      $("previewTitle").textContent = project.dataset.title;
      preview.style.left = Math.max(8, Math.min(innerWidth - 300, e.clientX + 30)) + "px";
      preview.style.top = Math.max(8, Math.min(innerHeight - 240, e.clientY - 100)) + "px";
    }
  }, { passive: true });
  document.documentElement.addEventListener("pointerleave", () => { cursor.classList.remove("active"); preview.hidden = true; });
  $("orbPulse").hidden = false;
  $("orbPulse").addEventListener("click", () => { if (!W.paused) W.pulse = 1; });
  let audioContext, soundOn = false;
  const sound = $("soundBtn"); sound.hidden = false;
  async function syncAudio() {
    if (!audioContext) return;
    try { if (soundOn && !W.modal && !document.hidden) await audioContext.resume(); else await audioContext.suspend(); } catch {}
  }
  sound.addEventListener("click", async () => {
    try {
      if (!audioContext) {
        const Audio = window.AudioContext || window.webkitAudioContext;
        audioContext = new Audio();
        const gain = audioContext.createGain(); gain.gain.value = .015; gain.connect(audioContext.destination);
        [110, 164.81, 220].forEach((frequency, i) => { const osc = audioContext.createOscillator(); osc.type = "sine"; osc.frequency.value = frequency; osc.detune.value = i * 3; osc.connect(gain); osc.start(); });
      }
      soundOn = !soundOn; await syncAudio();
      sound.setAttribute("aria-pressed", String(soundOn)); $("soundLabel").textContent = soundOn ? "Sound on" : "Sound off";
    } catch { toast("Sound is unavailable in this browser."); }
  });
  document.addEventListener("visibilitychange", () => { syncAudio(); resumeScene(); });
  const openers = new Map();
  function showDialog(dialog, opener) {
    closeMenu(); openers.set(dialog, opener); dialog.showModal();
    W.modal = true; document.body.classList.add("modal-open"); cursor.classList.remove("active"); preview.hidden = true; syncAudio();
  }
  document.querySelectorAll("dialog").forEach(dialog => {
    dialog.addEventListener("close", () => {
      if (dialog.id === "videoViewer") $("videoContainer").replaceChildren();
      W.modal = false; document.body.classList.remove("modal-open"); resumeScene(); syncAudio();
      openers.get(dialog)?.focus({ preventScroll: true });
    });
    dialog.addEventListener("click", e => { if (e.target === dialog) { const r = dialog.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) dialog.close(); } });
  });
  document.querySelectorAll("[data-close]").forEach(b => b.addEventListener("click", () => $(b.dataset.close).close()));
  const modified = e => e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey;
  const artworks = [{"slug":"reze","title":"Reze","category":"illustration","source":"Reze FINAL.png","alt":"Purple-haired character with green eyes and a teal shirt.","width":5120,"height":5120},{"slug":"ado","title":"Ado","category":"illustration","source":"ADO FINAL.png","alt":"Blue-toned portrait with bright cyan eyes and dramatic lighting.","width":5120,"height":5120},{"slug":"ai-hoshino","title":"Ai Hoshino","category":"illustration","source":"Ai Hoshino FINAL.png","alt":"Violet-haired character with luminous starry eyes.","width":5120,"height":5120},{"slug":"ryo-yamada","title":"Ryo Yamada","category":"illustration","source":"Ryo Yamada FINAL.png","alt":"Blue-haired character in a dark collared shirt.","width":5120,"height":5120},{"slug":"raiden","title":"Raiden","category":"illustration","source":"Raiden FINAL.png","alt":"Purple-haired character surrounded by vivid violet light.","width":5120,"height":5120},{"slug":"artoria-pendragon","title":"Artoria Pendragon","category":"illustration","source":"Artoria Pendragon.jpg","alt":"Golden-haired character with green eyes and blue armor.","width":5120,"height":5120},{"slug":"makima","title":"Makima","category":"illustration","source":"makima FINAL.png","alt":"Red-haired character with golden eyes, half-lit against deep shadows.","width":5120,"height":5120},{"slug":"tachyon","title":"Tachyon","category":"illustration","source":"TACHYON FINAL.png","alt":"Brown-haired character with red eyes and a white coat.","width":5120,"height":5120},{"slug":"raining-after-all","title":"Raining After All","category":"illustration","source":"Raining after all FINAL.jpg","alt":"Blue-lit character carrying an umbrella in the rain.","width":5120,"height":5120},{"slug":"eye-gaze","title":"Eye Gaze","category":"study","source":"EYE GAZE FINAL.jpg","alt":"Close study of a luminous violet eye with sparkling reflections.","width":5938,"height":2940},{"slug":"eye-study","title":"Eye Study","category":"study","source":"close up eye august to blur.jpg","alt":"Close-up of two bright violet eyes framed by pale hair.","width":2560,"height":1536}];
  const cards = [...document.querySelectorAll(".art-card")];
  let artIndex = 0;
  const visibleArt = () => cards.filter(c => !c.hidden).map(c => Number(c.querySelector("[data-art]").dataset.art));
  function zoom(reset = false) {
    const enabled = !reset && !$("artStage").classList.contains("zoomed");
    $("artStage").classList.toggle("zoomed", enabled); $("artZoom").setAttribute("aria-pressed", String(enabled)); $("artZoom").textContent = enabled ? "Fit image" : "Zoom in";
    $("artStage").scrollTo(0, 0);
  }
  function displayArt(index) {
    artIndex = index; const art = artworks[index], list = visibleArt(); zoom(true);
    $("fullArtwork").src = "assets/artworks/" + art.slug + "-large.webp"; $("fullArtwork").alt = art.alt;
    $("artViewerTitle").textContent = art.title; $("artViewerCategory").textContent = art.category === "study" ? "Digital art · Detail study" : "Digital illustration";
    $("artViewerIndex").textContent = String(list.indexOf(index) + 1).padStart(2, "0") + " / " + String(list.length).padStart(2, "0");
    $("artOriginal").href = "assets/artworks/" + art.slug + "-large.webp";
  }
  function stepArt(delta) { const list = visibleArt(); displayArt(list[(list.indexOf(artIndex) + delta + list.length) % list.length]); }
  document.querySelectorAll("[data-art]").forEach(a => a.addEventListener("click", e => {
    if (modified(e) || !$("artViewer").showModal) return; e.preventDefault(); displayArt(Number(a.dataset.art)); showDialog($("artViewer"), a);
  }));
  $("artPrev").addEventListener("click", () => stepArt(-1)); $("artNext").addEventListener("click", () => stepArt(1)); $("artZoom").addEventListener("click", () => zoom());
  $("artViewer").addEventListener("keydown", e => { if (e.key === "ArrowRight" || e.key === "ArrowLeft") { e.preventDefault(); stepArt(e.key === "ArrowRight" ? 1 : -1); } });
  let touchStart;
  $("artStage").addEventListener("touchstart", e => { touchStart = e.touches.length === 1 ? { x: e.touches[0].clientX, y: e.touches[0].clientY } : null; }, { passive: true });
  $("artStage").addEventListener("touchend", e => {
    if (!touchStart || $("artStage").classList.contains("zoomed")) return;
    const dx = e.changedTouches[0].clientX - touchStart.x, dy = e.changedTouches[0].clientY - touchStart.y;
    if (Math.abs(dx) > 65 && Math.abs(dx) > Math.abs(dy) * 1.5) stepArt(dx < 0 ? 1 : -1);
    touchStart = null;
  }, { passive: true });
  document.querySelectorAll("[data-art-filter]").forEach(b => {
    b.closest("[hidden]")?.removeAttribute("hidden");
    b.addEventListener("click", () => {
      document.querySelectorAll("[data-art-filter]").forEach(other => other.setAttribute("aria-pressed", String(other === b)));
      cards.forEach(c => { c.hidden = b.dataset.artFilter !== "all" && c.dataset.artCategory !== b.dataset.artFilter; });
      $("artGrid").classList.toggle("is-filtered", b.dataset.artFilter !== "all");
      $("artCount").textContent = visibleArt().length + " artworks shown"; updateScroll();
    });
  });
  document.querySelectorAll("[data-view]").forEach(b => {
    b.closest("[hidden]")?.removeAttribute("hidden");
    b.addEventListener("click", () => { $("artGrid").classList.toggle("compact", b.dataset.view === "compact"); document.querySelectorAll("[data-view]").forEach(other => other.setAttribute("aria-pressed", String(other === b))); updateScroll(); });
  });
  document.querySelectorAll("[data-video-filter]").forEach(b => {
    b.closest("[hidden]")?.removeAttribute("hidden");
    b.addEventListener("click", () => {
      document.querySelectorAll("[data-video-filter]").forEach(other => other.setAttribute("aria-pressed", String(other === b)));
      const projects = [...document.querySelectorAll("[data-video-category]")];
      projects.forEach(p => { p.hidden = b.dataset.videoFilter !== "all" && p.dataset.videoCategory !== b.dataset.videoFilter; });
      $("videoCount").textContent = projects.filter(p => !p.hidden).length + " videos shown"; preview.hidden = true; updateScroll();
    });
  });
  document.querySelectorAll("[data-video]").forEach(a => a.addEventListener("click", e => {
    if (modified(e) || !$("videoViewer").showModal) return; e.preventDefault();
    $("videoTitle").textContent = a.dataset.title; $("videoSubtitle").textContent = a.dataset.subtitle;
    $("youtubeLink").href = "https://www.youtube.com/watch?v=" + a.dataset.video;
    const container = $("videoContainer"); container.replaceChildren();
    if (location.protocol === "file:") {
      const note = document.createElement("p"); note.className = "player-notice";
      note.textContent = "YouTube needs a website address to play embedded videos. Open this portfolio with preview.cmd (localhost), or use Watch on YouTube below. The player also works when the site is hosted on GitHub Pages.";
      container.append(note);
    } else {
      const iframe = document.createElement("iframe");
      iframe.title = a.dataset.title + " — YouTube video";
      iframe.referrerPolicy = "strict-origin-when-cross-origin";
      iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"; iframe.allowFullscreen = true;
      iframe.src = "https://www.youtube-nocookie.com/embed/" + a.dataset.video + "?autoplay=1&rel=0&playsinline=1";
      container.append(iframe);
    }
    showDialog($("videoViewer"), a);
  }));
  document.querySelectorAll("[data-tool]").forEach((b, i) => {
    b.setAttribute("aria-pressed", String(i === 0));
    b.addEventListener("click", () => {
      document.querySelectorAll("[data-tool]").forEach(other => other.setAttribute("aria-pressed", String(other === b)));
      $("readoutName").textContent = b.dataset.tool; $("readoutDetail").textContent = b.dataset.detail;
      W.hue = i / 8; W.pulse = .5;
    });
  });
  let toastTimer;
  function toast(message) { clearTimeout(toastTimer); $("toast").textContent = message; $("toast").classList.add("show"); toastTimer = setTimeout(() => $("toast").classList.remove("show"), 3500); }
  $("copyNumber").hidden = false;
  $("copyNumber").addEventListener("click", async () => {
    try { await navigator.clipboard.writeText("+639939241678"); toast("Number copied."); } catch { toast("Copy this number: +63 993 924 1678"); }
  });
})();
