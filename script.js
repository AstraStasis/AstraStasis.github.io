/**
 * ANDREI.G HYBRID ENGINE
 * Handles Background Canvas, Theme, Interactions, and Carousels
 */

/* =========================================
   1. -BACKGROUND PARALLAX ENGINE
   ========================================= */
const canvas = document.getElementById('bg-canvas');
const ctx = canvas.getContext('2d');

let width, height;
let particles = [];
let scrollY = 0;

// Theme Colors
const THEMES = {
    dark: { shape: 'rgba(56, 189, 248, 0.05)', line: 'rgba(148, 163, 184, 0.03)' },
    light: { shape: 'rgba(249, 115, 22, 0.05)', line: 'rgba(28, 25, 23, 0.03)' }
};
let currentTheme = 'dark';

function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    initParticles();
}

class Particle {
    constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height * 1.5; 
        this.size = Math.random() * 80 + 20;
        this.speedX = Math.random() * 0.5 - 0.25;
        this.speedY = Math.random() * 0.5 - 0.25;
        this.type = Math.random() > 0.5 ? 'circle' : 'rect';
        this.depth = Math.random() * 0.5 + 0.1; 
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        if (this.x > width + 100) this.x = -100;
        if (this.x < -100) this.x = width + 100;
        if (this.y - (scrollY * this.depth) > height + 100) this.y -= (height + 200);
        if (this.y - (scrollY * this.depth) < -200) this.y += (height + 200);
    }

    draw() {
        const parallaxY = this.y - (scrollY * this.depth); 
        ctx.fillStyle = THEMES[currentTheme].shape;
        ctx.strokeStyle = THEMES[currentTheme].shape;
        ctx.lineWidth = 2;
        ctx.beginPath();
        if (this.type === 'circle') {
            ctx.arc(this.x, parallaxY, this.size, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.rect(this.x, parallaxY, this.size, this.size);
            ctx.stroke();
        }
    }
}

function initParticles() {
    particles = [];
    const count = Math.floor((width * height) / 20000); 
    for (let i = 0; i < count; i++) {
        particles.push(new Particle());
    }
}

function animateBackground() {
    ctx.clearRect(0, 0, width, height);
    ctx.strokeStyle = THEMES[currentTheme].line;
    ctx.lineWidth = 1;
    const gridSize = 100;
    const gridOffsetY = (scrollY * 0.2) % gridSize; 

    for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
    }
    for (let y = -gridOffsetY; y < height; y += gridSize) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
    }

    particles.forEach(p => {
        p.update();
        p.draw();
    });
    requestAnimationFrame(animateBackground);
}

window.addEventListener('resize', resize);
window.addEventListener('scroll', () => { 
    scrollY = window.scrollY; 
    
    // Update Progress Bar
    const scrollTop = window.scrollY;
    const docHeight = document.body.scrollHeight - window.innerHeight;
    const scrollPercent = (scrollTop / docHeight) * 100;
    const progressBar = document.getElementById('scroll-progress');
    if(progressBar) progressBar.style.width = scrollPercent + '%';
});
resize();
animateBackground();


/* =========================================
   2. CUSTOM CURSOR
   ========================================= */
function initCursor() {
    const cursor = document.getElementById('cursor');
    const follower = document.getElementById('cursor-follower');
    if (!cursor || !follower) return; 

    let posX = 0, posY = 0, mouseX = 0, mouseY = 0;

    setInterval(() => {
        posX += (mouseX - posX) / 9;
        posY += (mouseY - posY) / 9;
        follower.style.left = posX + 'px';
        follower.style.top = posY + 'px';
        cursor.style.left = mouseX + 'px';
        cursor.style.top = mouseY + 'px';
    }, 10);

    document.addEventListener('mousemove', e => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });

    const targets = document.querySelectorAll('.hover-target, a, button, .carousel-card');
    targets.forEach(target => {
        target.addEventListener('mouseenter', () => document.body.classList.add('hovered'));
        target.addEventListener('mouseleave', () => document.body.classList.remove('hovered'));
    });
}
if(window.innerWidth > 768) {
    initCursor();
}


/* =========================================
   3. TEXT INTERACTIVITY (UPDATED)
   ========================================= */
function initTextEffects() {
    const wrapChars = (node) => {
        if (node.nodeType === 3) { 
            const text = node.textContent;
            // Skip empty text nodes or just whitespace
            if (!text.trim()) return;

            const fragment = document.createDocumentFragment();
            text.split('').forEach((char, index) => {
                const span = document.createElement('span');
                if (char === ' ') {
                    span.innerHTML = '&nbsp;'; 
                } else {
                    span.textContent = char;
                }
                
                span.classList.add('letter'); // Base styles
                span.classList.add('char');   // Hover styles
                
                // ADDED: 'animating' class triggers the keyframe
                span.classList.add('animating'); 
                
                // ADDED: Remove the 'animating' class when done.
                // This stops the animation from "fighting" the hover effect.
                span.addEventListener('animationend', () => {
                    span.classList.remove('animating');
                });

                fragment.appendChild(span);
            });
            node.parentNode.replaceChild(fragment, node);
        } else if (node.nodeType === 1) { 
            Array.from(node.childNodes).forEach(child => wrapChars(child));
        }
    };

    const smallText = document.querySelector('.hero-text-small');
    if (smallText) wrapChars(smallText);
    
    const largeText = document.querySelector('.hero-text-large');
    if (largeText) wrapChars(largeText);
}
initTextEffects();


/* =========================================
   4. CAROUSEL LOGIC
   ========================================= */
function initCarousels() {
    const categories = document.querySelectorAll('.category-block');

    categories.forEach(category => {
        const track = category.querySelector('.carousel-track');
        const cards = Array.from(track.querySelectorAll('.carousel-card'));
        const nextBtn = category.querySelector('.nav-btn.next');
        const prevBtn = category.querySelector('.nav-btn.prev');
        
        if (!track || cards.length === 0) return;

        let currentIndex = 0;

        const updateCarousel = () => {
            cards.forEach((card, index) => {
                card.classList.remove('active', 'prev', 'next');
                card.style.transform = ''; 
                
                const len = cards.length;
                if (index === currentIndex) {
                    card.classList.add('active');
                } else if (index === (currentIndex - 1 + len) % len) {
                    card.classList.add('prev');
                } else if (index === (currentIndex + 1) % len) {
                    card.classList.add('next');
                }
            });
        };

        nextBtn.addEventListener('click', () => {
            currentIndex = (currentIndex + 1) % cards.length;
            updateCarousel();
        });

        prevBtn.addEventListener('click', () => {
            currentIndex = (currentIndex - 1 + cards.length) % cards.length;
            updateCarousel();
        });
        
        cards.forEach((card, index) => {
             card.addEventListener('click', (e) => {
                 if (card.classList.contains('prev')) {
                     e.stopPropagation();
                     currentIndex = (currentIndex - 1 + cards.length) % cards.length;
                     updateCarousel();
                 } else if (card.classList.contains('next')) {
                     e.stopPropagation();
                     currentIndex = (currentIndex + 1) % cards.length;
                     updateCarousel();
                 }
             });
        });

        updateCarousel();
    });
}
initCarousels();


/* =========================================
   5. UI INTERACTIONS
   ========================================= */

const observerOptions = { threshold: 0.1 };
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('active');
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);
document.querySelectorAll('.reveal-up').forEach(el => observer.observe(el));

const heroSection = document.querySelector('.hero');
const logos = document.querySelectorAll('.float-icon');
heroSection.addEventListener('mousemove', (e) => {
    const x = (e.clientX - window.innerWidth / 2) * 0.02;
    const y = (e.clientY - window.innerHeight / 2) * 0.02;
    logos.forEach(logo => {
        const speed = logo.getAttribute('data-speed');
        logo.style.transform = `translate(${x * speed}px, ${y * speed}px)`;
    });
});

const toggleBtn = document.getElementById('theme-toggle');
const icon = toggleBtn.querySelector('i');
toggleBtn.addEventListener('click', () => {
    document.body.classList.toggle('light-mode');
    if (document.body.classList.contains('light-mode')) {
        currentTheme = 'light';
        icon.classList.remove('fa-moon');
        icon.classList.add('fa-sun');
    } else {
        currentTheme = 'dark';
        icon.classList.remove('fa-sun');
        icon.classList.add('fa-moon');
    }
});

const modal = document.getElementById('video-modal');
const modalIframe = document.getElementById('modal-iframe');
const closeModalBtn = document.querySelector('.close-modal');

window.openModal = function(videoId) {
    modal.style.display = 'flex';
    modalIframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
    document.body.style.overflow = 'hidden';
}

closeModalBtn.addEventListener('click', () => {
    modal.style.display = 'none';
    modalIframe.src = '';
    document.body.style.overflow = 'auto';
});

window.onclick = function(event) {
    if (event.target == modal) {
        modal.style.display = "none";
        modalIframe.src = '';
        document.body.style.overflow = 'auto';
    }
}