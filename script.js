// Global variable for vertical scroll offset
let scrollOffset = 0;
// Flag to indicate if scrolling is happening
let isScrolling = false;
let scrollTimeout;

// Global variables to store the last computed horizontal offsets from mousemove
let currentLogoX = 0, currentLogoY = 0;
let currentStarX = 0, currentStarY = 0;

document.addEventListener('DOMContentLoaded', function () {
  // 1. Initialize particles.js for the star background
  particlesJS("particles-js", {
    "particles": {
      "number": { "value": 150, "density": { "enable": true, "value_area": 800 } },
      "color": { "value": "#ffffff" },
      "shape": { "type": "star", "polygon": { "nb_sides": 5 } },
      "opacity": { "value": 0.8 },
      "size": { "value": 4, "random": true },
      "line_linked": { "enable": true, "distance": 150, "color": "#ffffff", "opacity": 0.4, "width": 1 },
      "move": { "enable": true, "speed": 2, "direction": "none", "out_mode": "out" }
    },
    "interactivity": {
      "detect_on": "canvas",
      "events": {
        "onhover": { "enable": true, "mode": "repulse" },
        "onclick": { "enable": true, "mode": "push" },
        "resize": true
      },
      "modes": {
        "repulse": { "distance": 150, "duration": 0.4 },
        "push": { "particles_nb": 4 }
      }
    },
    "retina_detect": true
  });

  // 2. Intersection Observer for reveal animations (unchanged)
  const animatedElements = document.querySelectorAll('.animate-on-scroll');
  const observerOptions = { threshold: 0.1 };
  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        obs.unobserve(entry.target);
      }
    });
  }, observerOptions);
  animatedElements.forEach(el => observer.observe(el));

  // 3. Mousemove effect for floating logos and particles background
  const heroSection = document.querySelector('.hero');
  const particlesEl = document.getElementById('particles-js');
  // Gather all floating logos into an array
  const floatingLogos = [
    document.getElementById('capcut-logo'),
    document.getElementById('davinci-logo'),
    document.getElementById('premiere-logo'),
    document.getElementById('aftereffects-logo')
  ];
  const logoFactor = 0.05;
  const starFactor = 0.03;

  heroSection.addEventListener('mousemove', function(e) {
    // Only update if not scrolling
    if (isScrolling) return;
    
    const rect = heroSection.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const offsetX = e.clientX - centerX;
    const offsetY = e.clientY - centerY;
    
    // Compute and store the horizontal offsets
    currentLogoX = offsetX * logoFactor;
    currentLogoY = offsetY * logoFactor;
    currentStarX = offsetX * starFactor;
    currentStarY = offsetY * starFactor;
    
    // Apply transforms to floating logos
    floatingLogos.forEach(logo => {
      logo.style.transform = `translate(${currentLogoX}px, ${currentLogoY}px)`;
    });
    // Apply transform to particles background (vertical component remains from scroll)
    particlesEl.style.transform =
      `translateY(${scrollOffset * 0.3}px) translate(${currentStarX}px, ${currentStarY}px)`;
  });

  // On mouse leave, animate logos and particles back to horizontal 0 offset (using CSS transitions)
  heroSection.addEventListener('mouseleave', function() {
    floatingLogos.forEach(logo => {
      logo.style.transform = 'translate(0, 0)';
      currentLogoX = 0;
      currentLogoY = 0;
    });
    particlesEl.style.transform = `translateY(${scrollOffset * 0.3}px) translate(0, 0)`;
    currentStarX = 0;
    currentStarY = 0;
  });

  // 4. Initialize all carousels (unchanged)
  document.querySelectorAll('.carousel').forEach(carousel => initCarousel(carousel));
});

// 5. Carousel initialization (unchanged)
function initCarousel(carousel) {
  const track = carousel.querySelector('.carousel-track');
  const items = Array.from(track.querySelectorAll('.carousel-item'));
  const btnLeft = carousel.querySelector('.arrow.left');
  const btnRight = carousel.querySelector('.arrow.right');

  let currentIndex = 0;

  btnLeft.addEventListener('click', () => {
    currentIndex = (currentIndex - 1 + items.length) % items.length;
    updatePositions();
  });
  btnRight.addEventListener('click', () => {
    currentIndex = (currentIndex + 1) % items.length;
    updatePositions();
  });

  function updatePositions() {
    const leftIndex = (currentIndex - 1 + items.length) % items.length;
    const rightIndex = (currentIndex + 1) % items.length;
    
    items.forEach((item, i) => {
      item.classList.remove('active', 'left', 'right');
      item.style.pointerEvents = 'none';
      if (i === currentIndex) {
        item.classList.add('active');
        item.style.pointerEvents = 'auto';
      } else if (i === leftIndex) {
        item.classList.add('left');
      } else if (i === rightIndex) {
        item.classList.add('right');
      }
    });
  }
  updatePositions();
}

// 6. On scroll, update vertical parallax and disable mouse-follow while scrolling
window.addEventListener('scroll', function() {
  scrollOffset = window.scrollY;
  // Set isScrolling flag and reset it after 200ms of no scroll events
  isScrolling = true;
  clearTimeout(scrollTimeout);
  scrollTimeout = setTimeout(() => { isScrolling = false; }, 200);
  
  // Update particles background vertical component while preserving current horizontal offset
  document.getElementById('particles-js').style.transform =
    `translateY(${scrollOffset * 0.3}px) translate(${currentStarX}px, ${currentStarY}px)`;
  
  const portfolioBgWrapper = document.querySelector('.portfolio-bg-wrapper');
  if (portfolioBgWrapper) {
    const offset = scrollOffset * 0.1;
    portfolioBgWrapper.style.transform = `translateY(${offset}px)`;
  }
});
