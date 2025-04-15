document.addEventListener('DOMContentLoaded', function () {
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

    window.addEventListener('scroll', function () {
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

    // ✅ Acordeon funcionando com base no CSS e HTML
    const accordionItems = document.querySelectorAll('.accordion-item');
    accordionItems.forEach(item => {
        const header = item.querySelector('.accordion-header');
        header.addEventListener('click', () => {
            item.classList.toggle('active');
            accordionItems.forEach(otherItem => {
                if (otherItem !== item) {
                    otherItem.classList.remove('active');
                }
            });
        });
    });

    // Mostrar/esconder lista de boas práticas
    const boasPraticasSection = document.getElementById('boasPraticasSection');
    const boasPraticasTitle = boasPraticasSection.querySelector('h2');
    const boasPraticasList = boasPraticasSection.querySelector('.boas-praticas-list');
    const expandIndicator = boasPraticasSection.querySelector('.expand-indicator');
    const boasPraticasItems = boasPraticasList.querySelectorAll('li');

    boasPraticasList.classList.add('hidden');

    boasPraticasTitle.addEventListener('click', function () {
        boasPraticasList.classList.toggle('hidden');
        boasPraticasList.classList.toggle('expanded');

        if (boasPraticasList.classList.contains('hidden')) {
            expandIndicator.textContent = "Saiba Mais";
            boasPraticasItems.forEach(item => item.classList.add('hidden'));
        } else {
            expandIndicator.textContent = "Recolher";
            boasPraticasItems.forEach(item => item.classList.remove('hidden'));
        }
    });

    // Pop-up com opção "Não mostrar novamente"
    const popup = document.getElementById('popup');
    const okButton = document.getElementById('ok-btn');
    const dontShowAgain = document.getElementById('dontShowAgain');

    if (localStorage.getItem('hidePopup') === 'true') {
        popup.style.display = 'none';
    } else {
        popup.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }

    okButton.addEventListener('click', function () {
        popup.classList.add('fechar');
        document.body.style.overflow = 'auto';
        setTimeout(() => {
            popup.style.display = 'none';
            if (dontShowAgain && dontShowAgain.checked) {
                localStorage.setItem('hidePopup', 'true');
            }
        }, 500);
    });

    // Mostrar e ocultar pesquisa
    const pesquisaSection = document.getElementById('pesquisaSection');
    const surveyTrigger = document.getElementById('survey-trigger');
    pesquisaSection.style.display = 'none';

    surveyTrigger.addEventListener('click', () => {
        if (pesquisaSection.style.display === 'block') {
            pesquisaSection.style.display = 'none';
        } else {
            pesquisaSection.style.display = 'block';
            pesquisaSection.scrollIntoView({ behavior: 'smooth' });
        }
    });

    // Armazenar avaliação
    let selectedRating = null;
    document.querySelectorAll('.rating-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            document.querySelectorAll('.rating-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            selectedRating = btn.getAttribute('data-value');
        });
    });

    // Envio do formulário
    const submitSurvey = document.getElementById('submit-survey');
    const feedbackField = document.getElementById('feedback');
    const nomeField = document.getElementById('nome');
    const emailField = document.getElementById('email');

    submitSurvey.addEventListener('click', function () {
        if (selectedRating === null) {
            alert('Por favor, selecione uma nota de 0 a 10.');
            return;
        }

        if (feedbackField.value.trim() !== "" && (nomeField.value.trim() === "" || emailField.value.trim() === "")) {
            alert('Para enviar um feedback, preencha os campos de nome e e-mail.');
            return;
        }

        const surveyData = {
            rating: selectedRating,
            feedback: feedbackField.value,
            nome: nomeField.value,
            email: emailField.value
        };

        emailjs.send('service_nt3i72o', 'template_pjjg7o5', surveyData)
            .then(function () {
                alert('Obrigado por sua avaliação!');
                selectedRating = null;
                feedbackField.value = '';
                nomeField.value = '';
                emailField.value = '';
                document.querySelectorAll('.rating-btn').forEach(b => b.classList.remove('selected'));
                document.getElementById('pesquisaSection').style.display = 'none';
            }, function (error) {
                alert('Ocorreu um erro ao enviar sua avaliação. Tente novamente.');
                console.error('Erro ao enviar:', error);
            });
    });

    emailjs.init("Ck08OM3INTYwm8nQ5");

    document.getElementById('survey-trigger').addEventListener('click', () => {
        const surveyModal = document.querySelector('.satisfaction-survey');
        if (surveyModal) {
            surveyModal.style.display = 'block';
            surveyModal.scrollIntoView({ behavior: 'smooth' });
        }
    });

    document.getElementById('closeSurvey').addEventListener('click', () => {
        const surveyModal = document.querySelector('.satisfaction-survey');
        if (surveyModal) {
            surveyModal.style.display = 'none';
        }
    });
});


