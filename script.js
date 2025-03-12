document.addEventListener('DOMContentLoaded', function() {
    // Manipulação do Cabeçalho (Header)
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

    document.addEventListener('DOMContentLoaded', function() {
        const boasPraticasSection = document.getElementById('boasPraticasSection');
        const boasPraticasTitle = boasPraticasSection.querySelector('h2');
        const boasPraticasList = boasPraticasSection.querySelector('.boas-praticas-list');
        const expandIndicator = boasPraticasSection.querySelector('.expand-indicator');
        const boasPraticasItems = boasPraticasList.querySelectorAll('li');

        // Inicializa com a lista oculta
        boasPraticasList.classList.add('hidden');
        boasPraticasItems.forEach(item => item.classList.add('hidden'));

        boasPraticasTitle.addEventListener('click', function() {
            // Toggle das classes
            boasPraticasList.classList.toggle('hidden');
            boasPraticasList.classList.toggle('expanded');

            // Atualiza o texto e visibilidade dos itens
            if (boasPraticasList.classList.contains('hidden')) {
                expandIndicator.textContent = "Saiba Mais";
                boasPraticasItems.forEach(item => item.classList.add('hidden'));
            } else {
                expandIndicator.textContent = "Saiba Menos";
                boasPraticasItems.forEach(item => {
                    item.classList.remove('hidden');
                    item.style.display = 'block';
                });
            }
        });
    });
    // Pop-up (Unificado)
    const popup = document.getElementById('popup');
    const okBtn = document.getElementById('ok-btn');
    const dontShowAgain = document.getElementById('dontShowAgain');
    const pdfLink = document.getElementById('pdf-link');

    function showPopup() {
        if (localStorage.getItem('hidePopup') !== 'true') {
            popup.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }
    }

    function hidePopup() {
        popup.style.display = 'none';
        document.body.style.overflow = 'auto';
        if (dontShowAgain.checked) {
            try {
                localStorage.setItem('hidePopup', 'true');
            } catch (error) {
                console.error('Erro ao acessar localStorage:', error);
            }
        }
    }

    showPopup();
    okBtn.addEventListener('click', hidePopup);
    pdfLink.addEventListener('click', function() {
        window.open('./materia.pdf', '_blank');
    });

    // Pesquisa de Satisfação
    const pesquisaSection = document.getElementById('pesquisaSection');
    pesquisaSection.style.display = 'none';

    const surveyTrigger = document.getElementById('survey-trigger');
    const surveyContainer = document.querySelector('.satisfaction-survey');
    const ratingButtons = document.querySelectorAll('.rating-btn');
    const submitButton = document.getElementById('submit-survey'); // Corrigido o seletor
    let selectedRating = null;

    surveyTrigger.addEventListener('click', function(e) {
        e.stopPropagation();
        
        if (pesquisaSection.style.display === 'block') {
            pesquisaSection.style.display = 'none';
            surveyContainer.classList.remove('active');
        } else {
            pesquisaSection.style.display = 'block';
            surveyContainer.classList.add('active');
        }
    });

    ratingButtons.forEach((button, index) => {
        button.addEventListener('click', () => {
            selectedRating = index + 1;
            ratingButtons.forEach(btn => btn.classList.remove('selected'));
            button.classList.add('selected');
        });
    });

    submitButton.addEventListener('click', function(e) {
        e.preventDefault();
        const feedback = document.getElementById('feedback').value;

        if (selectedRating) {
            sendFeedback(selectedRating, feedback);
        } else {
            alert('Por favor, selecione uma nota antes de enviar.');
        }
    });

    document.addEventListener('click', function(e) {
        if (!surveyContainer.contains(e.target) && e.target !== surveyTrigger) {
            surveyContainer.classList.remove('active');
            pesquisaSection.style.display = 'none';
        }
    });

    surveyContainer.addEventListener('click', function(e) {
        e.stopPropagation();
    });

    const EMAIL_SERVICE = "service_ckmb1vc";
    const EMAIL_TEMPLATE = "template_yvfmqhb";

    function sendFeedback(rating, feedback) {
        const templateParams = {
            rating: rating,
            feedback: feedback,
            date: new Date().toLocaleDateString('pt-BR'),
            time: new Date().toLocaleTimeString('pt-BR'),
            pageUrl: window.location.href
        };

        emailjs.send(EMAIL_SERVICE, EMAIL_TEMPLATE, templateParams)
            .then(response => {
                console.log("Feedback enviado com sucesso", response.status);
                alert("Agradecemos seu feedback! Sua opinião é muito importante para nós.");
                resetSurvey();
            })
            .catch(error => {
                console.error("Erro no envio", error);
                alert("Não foi possível enviar seu feedback. Por favor, tente novamente mais tarde.");
            });
    }
    function resetSurvey() {
        surveyContainer.classList.remove('active');
        ratingButtons.forEach(btn => btn.classList.remove('selected'));
        document.getElementById('feedback').value = '';
        selectedRating = null;
        pesquisaSection.style.display = 'none';
    }});



    document.addEventListener('DOMContentLoaded', function() {
    // Garante que o código seja executado somente após o DOM (estrutura HTML) estar completamente carregado.

    const header = document.querySelector('header');
    // Seleciona o elemento <header> do documento.

    if (!header) return;
    // Se não houver um elemento <header>, a função é encerrada.

    let lastScrollY = window.scrollY;
    // Armazena a posição vertical inicial da barra de rolagem.

    let ticking = false;
    // Variável para controlar se a função onScroll está em execução (para otimizar o desempenho).

    function onScroll() {
        // Função chamada quando a barra de rolagem é movida.
        if (window.scrollY > lastScrollY) {
            // Se a posição atual da barra de rolagem for maior que a anterior (rolando para baixo)...
            header.classList.add('header-small');
            // ...adiciona a classe 'header-small' ao <header>, provavelmente para reduzir seu tamanho.
        } else {
            // Caso contrário (rolando para cima)...
            header.classList.remove('header-small');
            // ...remove a classe 'header-small' do <header>, restaurando seu tamanho original.
        }
        lastScrollY = window.scrollY;
        // Atualiza a posição anterior da barra de rolagem.
        ticking = false;
        // Permite que a função onScroll seja executada novamente.
    }

    window.addEventListener('scroll', function() {
        // Adiciona um ouvinte de evento para o evento 'scroll' na janela.
        if (!ticking) {
            // Se a função onScroll não estiver em execução...
            window.requestAnimationFrame(onScroll);
            // ...agenda a execução da função onScroll no próximo quadro de animação (otimização).
            ticking = true;
            // Indica que a função onScroll está em execução.
        }
        if (window.scrollY > 50) {
            // Se a posição da barra de rolagem for maior que 50 pixels...
            header.classList.add('header-hidden');
            // ...adiciona a classe 'header-hidden' ao <header>, provavelmente para ocultá-lo.
        } else {
            // Caso contrário...
            header.classList.remove('header-hidden');
            // ...remove a classe 'header-hidden' do <header>, exibindo-o novamente.
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
            boasPraticasItems.forEach(item => item.classList.add('hidden')); // Oculta os itens <li>
        } else {
            expandIndicator.textContent = "Saiba Menos";
            boasPraticasItems.forEach(item => item.classList.remove('hidden')); // Exibe os itens <li>
        }
    });

    // Pop-up com a mensagem e link para o PDF
    const popup = document.getElementById('popup');
    const okButton = document.getElementById('ok-btn');
    const pdfLink = document.getElementById('pdf-link');

    popup.style.display = 'flex';

    okButton.addEventListener('click', function() {
        popup.style.display = 'none';
        document.body.style.overflow = 'auto';
    });

    pdfLink.addEventListener('click', function() {
        window.open('./materia.pdf', '_blank');
    });

    if (popup.style.display === 'flex') {
        document.body.style.overflow = 'hidden';
    }
});
document.addEventListener('DOMContentLoaded', function() {
    const popup = document.getElementById('popup');
    const okButton = document.getElementById('ok-btn');
    const dontShowAgain = document.getElementById('dontShowAgain');

    // Verifica localStorage ao carregar
    if (localStorage.getItem('hidePopup') === 'true') {
        popup.style.display = 'none';
        document.body.style.overflow = 'auto'; // Garante que a rolagem esteja ativa
    } else {
        popup.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }

    okButton.addEventListener('click', function() {
        popup.style.display = 'none';
        document.body.style.overflow = 'auto'; // Habilita a rolagem ao fechar
        
        if (dontShowAgain.checked) {
            localStorage.setItem('hidePopup', 'true');
        }
    });
});