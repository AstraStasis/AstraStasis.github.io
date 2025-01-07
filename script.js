// Add this to your existing script.js

window.addEventListener('scroll', function() {
    const scrollPosition = window.scrollY;
    const heroContent = document.querySelector('.hero-content');
    const scaleValue = Math.max(1 - scrollPosition / 500, 0.7); // Adjust the divisor to control the speed of shrinking
    heroContent.style.transform = `scale(${scaleValue})`;
});

