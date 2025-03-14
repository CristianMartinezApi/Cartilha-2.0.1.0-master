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
            expandIndicator.textContent = "Recolher";
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
        popup.classList.add('fechar'); // Adiciona a classe para ativar a animação
        document.body.style.overflow = 'auto';
    
        // Aguarda o fim da animação para ocultar completamente
        setTimeout(() => {
            popup.style.display = 'none';
            if (dontShowAgain && dontShowAgain.checked) {
                localStorage.setItem('hidePopup', 'true');
            }
        }, 500); // Tempo correspondente à duração da transição
    });
    
    

    // Pesquisa de satisfação - Mostrar e ocultar ao clicar no botão
    const pesquisaSection = document.getElementById('pesquisaSection');
    const surveyTrigger = document.getElementById('survey-trigger');
    
    // Garante que a pesquisa comece oculta
    pesquisaSection.style.display = 'none';
    
    surveyTrigger.addEventListener('click', () => {
        if (pesquisaSection.style.display === 'block') {
            // Se estiver aberta, fecha
            pesquisaSection.style.display = 'none';
        } else {
            // Se estiver fechada, abre e faz scroll suave até ela
            pesquisaSection.style.display = 'block';
            pesquisaSection.scrollIntoView({ behavior: 'smooth' });
        }
    });
    
    // Armazena o rating selecionado
    let selectedRating = null;

    // Seleciona todos os botões de avaliação e adiciona evento de clique
    document.querySelectorAll('.rating-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            // Remove a seleção dos botões anteriores (apenas visual)
            document.querySelectorAll('.rating-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            selectedRating = btn.getAttribute('data-value');
        });
    });

    const submitSurvey = document.getElementById('submit-survey');
    const feedbackField = document.getElementById('feedback');

    submitSurvey.addEventListener('click', function() {
        // Verifica se foi selecionado um rating
        if (selectedRating === null) {
            alert('Por favor, selecione uma nota de 0 a 10.');
            return;
        }
        
        // Cria os dados a serem enviados
        const surveyData = {
            rating: selectedRating,
            feedback: feedbackField.value
        };

        // Envia os dados via EmailJS (altere SERVICE_ID e TEMPLATE_ID para os corretos)
        emailjs.send('service_nt3i72o', 'template_pjjg7o5', surveyData)
            .then(function(response) {
                alert('Obrigado por sua avaliação!');
                // Opcional: Limpa o formulário
                selectedRating = null;
                feedbackField.value = '';
                document.querySelectorAll('.rating-btn').forEach(b => b.classList.remove('selected'));
                // Oculta a pesquisa após o envio, se desejar
                document.getElementById('pesquisaSection').style.display = 'none';
            }, function(error) {
                alert('Ocorreu um erro ao enviar sua avaliação. Tente novamente.');
                console.error('Erro ao enviar:', error);
            });
    });

    // Substitua 'YOUR_PUBLIC_KEY' pela sua chave pública válida
    emailjs.init("Ck08OM3INTYwm8nQ5");

    document.getElementById('survey-trigger').addEventListener('click', () => {
        const surveyModal = document.querySelector('.satisfaction-survey');
        if (surveyModal) {
            // Exibe a pesquisa se estiver oculta (por exemplo, definindo display:block)
            surveyModal.style.display = 'block';
            // Faz scroll suave até a pesquisa
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
