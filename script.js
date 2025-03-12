document.addEventListener('DOMContentLoaded', function() {
    const header = document.querySelector('header');
    if (!header) {
        console.error('Elemento header não encontrado.');
        return;
    }

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

    const boasPraticasSection = document.getElementById('boasPraticasSection');
    const boasPraticasTitle = boasPraticasSection.querySelector('h2');
    const boasPraticasList = boasPraticasSection.querySelector('.boas-praticas-list');
    const expandIndicator = boasPraticasSection.querySelector('.expand-indicator');
    const boasPraticasItems = boasPraticasList.querySelectorAll('li');

    boasPraticasList.classList.add('hidden');

    boasPraticasTitle.addEventListener('click', function() {
        boasPraticasList.classList.toggle('hidden');
        boasPraticasList.classList.toggle('expanded');

        if (boasPraticasList.classList.contains('hidden')) {
            expandIndicator.textContent = "Saiba Mais";
            boasPraticasItems.forEach(item => item.classList.add('hidden'));
        } else {
            expandIndicator.textContent = "Saiba Menos";
            boasPraticasItems.forEach(item => item.classList.remove('hidden'));
        }
    });

    // Manipulação do pop-up com opção de "Não mostrar novamente"
    const popup = document.getElementById('popup');
    const okButton = document.getElementById('ok-btn');
    const dontShowAgain = document.getElementById('dontShowAgain');

    if (localStorage.getItem('hidePopup') === 'true') {
        popup.style.display = 'none';
    } else {
        popup.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }

    okButton.addEventListener('click', function() {
        popup.style.display = 'none';
        document.body.style.overflow = 'auto';
        if (dontShowAgain && dontShowAgain.checked) {
            localStorage.setItem('hidePopup', 'true');
        }
    });

    // Pesquisa de satisfação - Mostrar e ocultar ao clicar no botão
const pesquisaSection = document.getElementById('pesquisaSection');
const surveyTrigger = document.getElementById('survey-trigger');

// Garante que a pesquisa inicie oculta
pesquisaSection.style.display = 'none';

surveyTrigger.addEventListener('click', function() {
    if (pesquisaSection.style.display === 'none' || pesquisaSection.style.display === '') {
        pesquisaSection.style.display = 'block';
    } else {
        pesquisaSection.style.display = 'none';
    }
});

});
