document.addEventListener('DOMContentLoaded', () => {
    // Theme Toggle
    const toggleSwitch = document.querySelector('.toggle-switch input[type="checkbox"]');
    if (toggleSwitch) {
        toggleSwitch.addEventListener('change', () => {
            document.body.classList.toggle('dark-theme', toggleSwitch.checked);
        });
    } else {
        console.error('Toggle switch not found.');
    }

    // Boas Práticas Expansion
    const toggleBoasButton = document.getElementById('toggle-boas-praticas');
    const boasContent = document.querySelector('.boas-content');

    if (toggleBoasButton && boasContent) {
        toggleBoasButton.addEventListener('click', () => {
            boasContent.classList.toggle('expanded');
            const expanded = boasContent.classList.contains('expanded');
            toggleBoasButton.textContent = expanded ? 'Recolher' : 'Expandir';
            toggleBoasButton.setAttribute('aria-expanded', expanded); // Accessibility
        });
        toggleBoasButton.setAttribute('aria-expanded', boasContent.classList.contains('expanded') ? 'true' : 'false');
    } else {
        console.error('Toggle boas práticas button or content not found.');
    }

    // Fixed Navbar
    const navbar = document.querySelector('.navbar');
    const header = document.querySelector('.site-header');

    if (navbar && header) {
        window.addEventListener('scroll', () => {
            const headerHeight = header.offsetHeight;
            if (window.pageYOffset >= headerHeight) {
                navbar.classList.add('fixed-navbar');
            } else {
                navbar.classList.remove('fixed-navbar');
            }
        });
    } else {
        console.error('Navbar or header not found.');
    }

    // Smooth Scrolling
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();

            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);

            if (targetElement) {
                const navbar = document.querySelector('.navbar');
                const navbarHeight = navbar ? navbar.offsetHeight : 0; // Handle case where navbar is null
                const targetOffset = targetElement.offsetTop - navbarHeight;

                window.scrollTo({
                    top: targetOffset,
                    behavior: 'smooth'
                });
            }
        });
    });
});
