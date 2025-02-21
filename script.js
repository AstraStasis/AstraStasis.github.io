// Global variable to store scroll offset
let scrollOffset = 0;

document.addEventListener('DOMContentLoaded', function () {
  // Initialize particles.js with a star-shaped configuration
  particlesJS("particles-js", {
    "particles": {
      "number": {
        "value": 100,
        "density": {
          "enable": true,
          "value_area": 800
        }
      },
      "color": {
        "value": "#ffffff"
      },
      "shape": {
        "type": "star",
        "stroke": {
          "width": 0,
          "color": "#000000"
        },
        "polygon": {
          "nb_sides": 5
        }
      },
      "opacity": {
        "value": 0.8,
        "random": false
      },
      "size": {
        "value": 3,
        "random": true
      },
      "line_linked": {
        "enable": true,
        "distance": 150,
        "color": "#ffffff",
        "opacity": 0.4,
        "width": 1
      },
      "move": {
        "enable": true,
        "speed": 2,
        "direction": "none",
        "random": false,
        "straight": false,
        "out_mode": "out",
        "bounce": false
      }
    },
    "interactivity": {
      "detect_on": "canvas",
      "events": {
        "onhover": {
          "enable": true,
          "mode": "repulse"
        },
        "onclick": {
          "enable": true,
          "mode": "push"
        },
        "resize": true
      },
      "modes": {
        "repulse": {
          "distance": 150,
          "duration": 0.4
        },
        "push": {
          "particles_nb": 4
        }
      }
    },
    "retina_detect": true
  });

  // Intersection Observer to animate elements on scroll
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

  // Combined mousemove effect for AE logo and particles background
  const heroSection = document.querySelector('.hero');
  const aeLogo = document.getElementById('aftereffects-logo');
  heroSection.addEventListener('mousemove', function(e) {
    const rect = heroSection.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const offsetX = e.clientX - centerX;
    const offsetY = e.clientY - centerY;
    // AE logo: apply a subtle translation
    const logoFactor = 0.05;
    const logoMoveX = offsetX * logoFactor;
    const logoMoveY = offsetY * logoFactor;
    aeLogo.style.transform = `translate(${logoMoveX}px, ${logoMoveY}px)`;
    // Particles background: combine current scroll parallax and mouse offset
    const starFactor = 0.03;
    const starMoveX = offsetX * starFactor;
    const starMoveY = offsetY * starFactor;
    document.getElementById('particles-js').style.transform =
      `translateY(${scrollOffset * 0.3}px) translate(${starMoveX}px, ${starMoveY}px)`;
  });
  heroSection.addEventListener('mouseleave', function() {
    aeLogo.style.transform = `translate(0px, 0px)`;
    document.getElementById('particles-js').style.transform =
      `translateY(${scrollOffset * 0.3}px)`;
  });
});

// Update scroll offset and particles parallax on scroll
window.addEventListener('scroll', function() {
  scrollOffset = window.scrollY;
  // Update particles transform with current scroll offset; mousemove events will override on hover.
  document.getElementById('particles-js').style.transform =
    `translateY(${scrollOffset * 0.3}px)`;
});
