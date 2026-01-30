document.addEventListener('DOMContentLoaded', () => {
    // Mobile nav toggle
    const toggle = document.getElementById('navToggle');
    const navLinks = document.getElementById('navLinks');
    if (toggle && navLinks) {
        toggle.addEventListener('click', () => {
            navLinks.classList.toggle('open');
        });
    }

    // Animate stats on scroll
    const stats = document.querySelectorAll('.stat');
    const animateStat = (el) => {
        const target = parseFloat(el.dataset.count);
        const isDecimal = target % 1 !== 0;
        let current = 0;
        const step = Math.ceil(target / 60);
        const tick = () => {
            current += step;
            if (current >= target) {
                el.textContent = isDecimal ? target.toFixed(1) : target.toLocaleString();
            } else {
                el.textContent = isDecimal ? current.toFixed(1) : current.toLocaleString();
                requestAnimationFrame(tick);
            }
        };
        tick();
    };
    const observer = new IntersectionObserver((entries, ob) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                animateStat(entry.target);
                ob.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });
    stats.forEach((stat) => observer.observe(stat));

    console.log('🌟 iLoveSPSR Nellore loaded');
});
