// Global variable for vertical scroll offset
let scrollOffset = 0;
// Flag to indicate if scrolling is active
let isScrolling = false;
let scrollTimeout = null;

// Global variables to store latest horizontal offsets from mousemove
let currentLogoX = 0, currentLogoY = 0;
let currentStarX = 0, currentStarY = 0;

document.addEventListener('DOMContentLoaded', function () {
  // 1. Function to initialize particles with a given color
  function initParticles(particleColor) {
    if (window.pJSDom && window.pJSDom.length) {
      window.pJSDom[0].pJS.fn.vendors.destroypJS();
      window.pJSDom = [];
    }
    particlesJS("particles-js", {
      "particles": {
        "number": { "value": 150, "density": { "enable": true, "value_area": 800 } },
        "color": { "value": particleColor },
        "shape": { "type": "star", "polygon": { "nb_sides": 5 } },
        "opacity": { "value": 0.8 },
        "size": { "value": 4, "random": true },
        "line_linked": { "enable": true, "distance": 150, "color": particleColor, "opacity": 0.4, "width": 1 },
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
  }
  
  // 2. Initialize particles with default dark mode color (white)
  initParticles("#ffffff");

  // 3. Intersection Observer for reveal animations (unchanged)
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

  // 4. Mousemove effect for floating logos and particles background
  const heroSection = document.querySelector('.hero');
  const particlesEl = document.getElementById('particles-js');
  const floatingLogos = [
    document.getElementById('capcut-logo'),
    document.getElementById('davinci-logo'),
    document.getElementById('premiere-logo'),
    document.getElementById('aftereffects-logo')
  ];
  const logoFactor = 0.05;
  const starFactor = 0.03;

  heroSection.addEventListener('mousemove', function(e) {
    if (isScrolling) return;
    
    const rect = heroSection.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const offsetX = e.clientX - centerX;
    const offsetY = e.clientY - centerY;
    
    currentLogoX = offsetX * logoFactor;
    currentLogoY = offsetY * logoFactor;
    currentStarX = offsetX * starFactor;
    currentStarY = offsetY * starFactor;
    
    floatingLogos.forEach(logo => {
      logo.style.transform = `translate(${currentLogoX}px, ${currentLogoY}px)`;
    });
    particlesEl.style.transform =
      `translateY(${scrollOffset * 0.3}px) translate(${currentStarX}px, ${currentStarY}px)`;
  });

  heroSection.addEventListener('mouseleave', function() {
    floatingLogos.forEach(logo => {
      logo.style.transform = 'translate(0, 0)';
      currentLogoX = 0;
      currentLogoY = 0;
    });
    particlesEl.style.transform =
      `translateY(${scrollOffset * 0.3}px) translate(0, 0)`;
    currentStarX = 0;
    currentStarY = 0;
  });

  // 5. Mode Toggle: Use sun/moon icon (light mode toggles class "light-mode" on body)
  const modeToggleBtn = document.getElementById('mode-toggle');
  modeToggleBtn.addEventListener('click', function() {
    document.body.classList.toggle('light-mode');
    if (document.body.classList.contains('light-mode')) {
      modeToggleBtn.innerHTML = '<i class="fas fa-sun"></i>';
      initParticles("#000000"); // In light mode, use black particles
    } else {
      modeToggleBtn.innerHTML = '<i class="fas fa-moon"></i>';
      initParticles("#ffffff");
    }
  });

  // 6. Initialize carousels (3-item overlapping carousel remains unchanged)
  document.querySelectorAll('.carousel').forEach(carousel => initCarousel(carousel));

  // 7. Split hero title text into individual letters for animation
  splitText(".hero-title");
});

// 8. Function to split text content of a selector into spans for each letter
function splitText(selector) {
  const element = document.querySelector(selector);
  if (!element) return;
  const text = element.textContent.trim();
  element.textContent = "";
  text.split("").forEach(letter => {
    const span = document.createElement("span");
    span.textContent = letter;
    span.classList.add("letter");
    // Add a random animation delay for each letter for a random reveal effect
    span.style.animationDelay = (Math.random() * 0.8) + "s";
    element.appendChild(span);
  });
}

// 9. Carousel initialization function (unchanged)
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

// 10. On scroll, update vertical parallax and disable mouse-follow while scrolling
window.addEventListener('scroll', function() {
  scrollOffset = window.scrollY;
  isScrolling = true;
  clearTimeout(scrollTimeout);
  scrollTimeout = setTimeout(() => { isScrolling = false; }, 200);
  
  document.getElementById('particles-js').style.transform =
    `translateY(${scrollOffset * 0.3}px) translate(${currentStarX}px, ${currentStarY}px)`;
  
  const portfolioBgWrapper = document.querySelector('.portfolio-bg-wrapper');
  if (portfolioBgWrapper) {
    const offset = scrollOffset * 0.1;
    portfolioBgWrapper.style.transform = `translateY(${offset}px)`;
  }
});