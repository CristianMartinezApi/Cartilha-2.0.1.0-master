document.addEventListener('DOMContentLoaded', function() {
    const header = document.querySelector('header');
    if (!header) return;

    let lastScrollY = window.scrollY;
    let ticking = false;

    function onScroll() {
        if (window.scrollY > lastScrollY) {
            header.classList.add('header-small');
        } else {
            header.classList.remove('header-small');
        }
        lastScrollY = window.scrollY;
        ticking = false;
    }

    window.addEventListener('scroll', function() {
        if (!ticking) {
            window.requestAnimationFrame(onScroll);
            ticking = true;
        }
    });
});

window.addEventListener('scroll', function() {
    const header = document.querySelector('header');
    if (window.scrollY > 50) {
        header.classList.add('header-hidden');
    } else {
        header.classList.remove('header-hidden');
    }
});