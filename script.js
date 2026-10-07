/* Lightweight interactions; the portfolio itself remains readable without JavaScript. */
(() => {
  'use strict';

  // Some YouTube videos reject numeric-IP referrers even though embedding is enabled.
  // Keep the local preview on a hostname; the published GitHub Pages URL is unchanged.
  if (location.protocol === 'http:' && location.hostname === '127.0.0.1') {
    const previewUrl = new URL(location.href);
    previewUrl.hostname = 'localhost';
    location.replace(previewUrl.href);
    return;
  }

  const root = document.documentElement;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const themeButton = document.querySelector('.theme-toggle');
  const themeMeta = document.querySelector('meta[name="theme-color"]');

  function setTheme(theme) {
    root.dataset.theme = theme;
    themeButton.setAttribute('aria-label', 'Switch to ' + (theme === 'dark' ? 'light' : 'dark') + ' theme');
    themeMeta.content = theme === 'dark' ? '#141413' : '#f0eee7';
  }
  try {
    const savedTheme = localStorage.getItem('andreig-theme');
    if (savedTheme === 'light' || savedTheme === 'dark') setTheme(savedTheme);
  } catch { /* Storage may be unavailable in private browsing. */ }
  themeButton.hidden = false;
  themeButton.addEventListener('click', () => {
    const theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
    setTheme(theme);
    try { localStorage.setItem('andreig-theme', theme); } catch { /* Keep the in-session theme. */ }
  });

  // Mobile navigation remains independent of the video dialog.
  const menuButton = document.querySelector('.menu-toggle');
  const mobileNav = document.querySelector('.mobile-nav');
  const mobileLayout = window.matchMedia('(max-width: 760px)');
  function closeMenu(restoreFocus = false) {
    mobileNav.hidden = true;
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', 'Open navigation');
    if (restoreFocus) menuButton.focus();
  }
  menuButton.hidden = false;
  document.body.classList.add('js-ready');
  menuButton.addEventListener('click', () => {
    const open = menuButton.getAttribute('aria-expanded') !== 'true';
    mobileNav.hidden = !open;
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
  });
  mobileNav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => closeMenu()));
  document.addEventListener('click', event => {
    if (!mobileNav.hidden && !event.target.closest('.site-header')) closeMenu();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !mobileNav.hidden) closeMenu(true);
  });
  document.addEventListener('focusin', event => {
    if (!mobileNav.hidden && !event.target.closest('.site-header')) closeMenu();
  });
  mobileLayout.addEventListener('change', () => {
    if (!mobileLayout.matches) {
      const focusWasInMenu = mobileNav.contains(document.activeElement);
      closeMenu();
      if (focusWasInMenu) document.querySelector('.desktop-nav a').focus();
    }
  });

  // The timeline is a selector for four real projects, not simulated video playback.
  const scenes = [
    { id: 'iizK6iHbyCE', title: 'Motion 01 — Showreel', words: ['MAKE', 'IT MOVE.'], caption: 'Motion graphics / Showreel', name: 'Motion', image: 'bg.jpg' },
    { id: '2Ih-mQE52qs', title: 'Dance Edit 01 — Choreography', words: ['FIND', 'THE BEAT.'], caption: 'Dance / Choreography', name: 'Dance', image: 'https://img.youtube.com/vi/2Ih-mQE52qs/hqdefault.jpg' },
    { id: 'WhWOab40MEs', title: 'Reveal 01 — 3D Animation', words: ['LEAVE', 'A MARK.'], caption: 'Logo reveals / 3D Animation', name: 'Logos', image: 'https://img.youtube.com/vi/WhWOab40MEs/hqdefault.jpg' },
    { id: '5RN1kKo25L0', title: 'Commentary 01 — Deep Dive', words: ['TELL', 'THE STORY.'], caption: 'Educational / Deep Dive', name: 'Stories', image: 'https://img.youtube.com/vi/5RN1kKo25L0/hqdefault.jpg' }
  ];
  const stage = document.querySelector('.editor-stage');
  const stageTitle = document.querySelector('.stage-title');
  const stageImage = document.querySelector('.stage-image');
  const tracks = [...document.querySelectorAll('.track')];
  tracks.forEach((track, index) => {
    track.addEventListener('click', () => {
      const scene = scenes[index];
      tracks.forEach(button => {
        const selected = button === track;
        button.classList.toggle('active', selected);
        button.setAttribute('aria-pressed', String(selected));
      });
      stage.dataset.scene = String(index);
      stage.dataset.video = scene.id;
      stage.dataset.title = scene.title;
      stage.href = 'https://www.youtube.com/watch?v=' + scene.id;
      stage.setAttribute('aria-label', 'Watch ' + scene.title);
      stageTitle.replaceChildren(document.createTextNode(scene.words[0]), document.createElement('br'));
      const secondLine = document.createElement('span');
      secondLine.textContent = scene.words[1];
      stageTitle.append(secondLine);
      stageImage.src = scene.image;
      document.querySelector('.stage-caption').textContent = scene.caption;
      document.querySelector('.stage-number').textContent = '0' + (index + 1) + ' — 04';
      document.querySelector('.timeline-status').textContent = '0' + (index + 1) + ' / ' + scene.name;
    });
  });
  stage.addEventListener('pointermove', event => {
    if (!finePointer.matches || reducedMotion.matches) return;
    const bounds = stage.getBoundingClientRect();
    stage.style.setProperty('--art-x', ((event.clientY - bounds.top) / bounds.height - .5) * -7 + 'deg');
    stage.style.setProperty('--art-y', ((event.clientX - bounds.left) / bounds.width - .5) * 7 + 'deg');
  });
  function resetStage() {
    stage.style.setProperty('--art-x', '0deg');
    stage.style.setProperty('--art-y', '0deg');
  }
  stage.addEventListener('pointerleave', resetStage);
  reducedMotion.addEventListener('change', resetStage);

  // Native buttons and hidden cards keep filtering accessible to keyboard users.
  const filters = [...document.querySelectorAll('.filter')];
  const projects = [...document.querySelectorAll('.project-card')];
  const grid = document.querySelector('.projects-grid');
  const resultCount = document.querySelector('.results-count');
  document.querySelector('.filters').hidden = false;
  filters.forEach(filter => filter.addEventListener('click', () => {
    const category = filter.dataset.filter;
    let count = 0;
    filters.forEach(button => {
      const selected = button === filter;
      button.classList.toggle('active', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
    projects.forEach(project => {
      const matches = category === 'all' || project.dataset.category === category;
      project.hidden = !matches;
      if (matches) count++;
    });
    grid.classList.toggle('is-filtered', category !== 'all');
    resultCount.textContent = 'Showing ' + count + ' project' + (count === 1 ? '' : 's');
    updateScroll();
  }));

  // Native dialog supplies focus trapping and Escape handling.
  const dialog = document.querySelector('.video-modal');
  const videoContainer = document.querySelector('.video-container');
  let videoOpener = null;
  if (typeof dialog.showModal === 'function') {
    document.querySelectorAll('[data-video]').forEach(link => {
      link.addEventListener('click', event => {
        if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0) return;
        event.preventDefault();
        const id = link.dataset.video;
        if (!/^[a-zA-Z0-9_-]{11}$/.test(id)) return;
        videoOpener = link;
        document.querySelector('#video-title').textContent = link.dataset.title;
        document.querySelector('.youtube-link').href = 'https://www.youtube.com/watch?v=' + id;
        const frame = document.createElement('iframe');
        frame.src = 'https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&rel=0';
        frame.title = link.dataset.title;
        frame.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
        frame.allowFullscreen = true;
        frame.referrerPolicy = 'strict-origin-when-cross-origin';
        if (location.protocol === 'file:') {
          // File URLs cannot send the HTTP referrer required by YouTube (Error 153).
          const notice = document.createElement('div');
          notice.setAttribute('role', 'status');
          notice.style.cssText = 'height:100%;display:flex;flex-direction:column;overflow:auto;gap:16px;padding:20px;text-align:center;font-size:13px;color:#eeede7;background:#141413';
          const explanation = document.createElement('p');
          explanation.textContent = 'To play videos here, open preview.cmd in the portfolio folder or use VS Code Live Server. YouTube cannot play embedded videos from a directly opened HTML file.';
          const watchLink = document.createElement('a');
          watchLink.href = link.href;
          watchLink.target = '_blank';
          watchLink.rel = 'noopener noreferrer';
          watchLink.textContent = 'Watch this video on YouTube ↗';
          watchLink.style.textDecoration = 'underline';
          notice.append(explanation, watchLink);
          videoContainer.replaceChildren(notice);
        } else {
          videoContainer.replaceChildren(frame);
        }
        dialog.showModal();
        document.body.classList.add('modal-open');
        document.querySelector('.modal-close').focus();
      });
    });
    document.querySelector('.modal-close').addEventListener('click', () => dialog.close());
    let backdropPointerDown = false;
    const outsideDialog = event => {
      const bounds = dialog.getBoundingClientRect();
      return event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom;
    };
    dialog.addEventListener('pointerdown', event => { backdropPointerDown = event.target === dialog && outsideDialog(event); });
    dialog.addEventListener('click', event => {
      if (backdropPointerDown && event.target === dialog && outsideDialog(event)) dialog.close();
      backdropPointerDown = false;
    });
    dialog.addEventListener('close', () => {
      videoContainer.replaceChildren();
      document.body.classList.remove('modal-open');
      if (videoOpener?.isConnected) videoOpener.focus({ preventScroll: true });
    });
  }

  // Recover gracefully when a remote video thumbnail cannot load.
  document.querySelectorAll('.project-image img, .stage-image').forEach(img => {
    const fallback = () => {
      const source = img.getAttribute('src');
      if (source.includes('/maxresdefault.jpg')) img.src = source.replace('/maxresdefault.jpg', '/hqdefault.jpg');
      else if (source !== 'bg.jpg') img.src = 'bg.jpg';
    };
    img.addEventListener('error', fallback);
    if (img.complete && img.naturalWidth === 0) fallback();
  });

  const progress = document.querySelector('.scroll-progress');
  const navLinks = [...document.querySelectorAll('.desktop-nav .nav-link')];
  const sections = navLinks.map(link => document.querySelector(link.getAttribute('href')));
  let scrollQueued = false;
  function updateScroll() {
    const height = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.transform = 'scaleX(' + (height > 0 ? Math.min(1, Math.max(0, window.scrollY / height)) : 0) + ')';
    let current = -1;
    sections.forEach((section, index) => {
      if (section.getBoundingClientRect().top <= window.innerHeight * .4) current = index;
    });
    navLinks.forEach((link, index) => {
      link.classList.toggle('active', index === current);
      if (index === current) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
    scrollQueued = false;
  }
  function queueScroll() {
    if (!scrollQueued) {
      scrollQueued = true;
      requestAnimationFrame(updateScroll);
    }
  }
  window.addEventListener('scroll', queueScroll, { passive: true });
  window.addEventListener('resize', queueScroll, { passive: true });
  window.addEventListener('load', updateScroll);
  document.querySelectorAll('details').forEach(details => details.addEventListener('toggle', queueScroll));
  updateScroll();

  if ('IntersectionObserver' in window && !reducedMotion.matches) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: .12 });
    document.querySelectorAll('.reveal').forEach(element => {
      element.classList.add('will-reveal');
      observer.observe(element);
    });
  }

  const copyButton = document.querySelector('.copy-number');
  const toast = document.querySelector('.toast');
  let toastTimer;
  function notify(message) {
    clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.add('visible');
    toastTimer = setTimeout(() => toast.classList.remove('visible'), 4500);
  }
  if (navigator.clipboard?.writeText) {
    copyButton.hidden = false;
    copyButton.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText('+63 993 924 1678');
        notify('Phone number copied. Let’s talk!');
      } catch {
        notify('Copy manually: +63 993 924 1678');
      }
    });
  }
  document.querySelector('#year').textContent = new Date().getFullYear();
})();


