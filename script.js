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
        if (window.scrollY > 50) {
            header.classList.add('header-hidden');
        } else {
            header.classList.remove('header-hidden');
        }
    });

    const listItems = document.querySelectorAll('li');
    listItems.forEach(item => {
        item.addEventListener('click', function() {
            this.classList.toggle('expanded');
        });
    });

    const buttons = document.querySelectorAll('.show-more');
    buttons.forEach(button => {
        button.addEventListener('click', function(event) {
            event.stopPropagation();
            const moreContent = this.previousElementSibling;
            const listItem = this.closest('li');
            if (moreContent.style.display === 'none' || moreContent.style.display === '') {
                moreContent.style.display = 'block';
                this.textContent = 'Mostrar menos';
                listItem.classList.add('expanded');
            } else {
                moreContent.style.display = 'none';
                this.textContent = 'Mostrar mais';
                listItem.classList.remove('expanded');
            }
        });
    });

    const boasPraticasSection = document.getElementById('boasPraticasSection');
    const boasPraticasTitle = boasPraticasSection.querySelector('h2');
    const boasPraticasList = boasPraticasSection.querySelector('.boas-praticas-list');
    const expandIndicator = boasPraticasSection.querySelector('.expand-indicator');

    boasPraticasTitle.addEventListener('click', function() {
        boasPraticasList.classList.toggle('hidden');
        boasPraticasList.classList.toggle('expanded');
        if (boasPraticasList.classList.contains('hidden')){
            expandIndicator.textContent = "Saiba Mais";
        } else {
            expandIndicator.textContent = "Recolher";
        }
    });

    const pdfPopup = document.getElementById('pdf-popup');
    const confirmPdf = document.getElementById('confirm-pdf');

    pdfPopup.style.display = 'flex';

    confirmPdf.addEventListener('click', function() {
        pdfPopup.style.display = 'none';
    });
});