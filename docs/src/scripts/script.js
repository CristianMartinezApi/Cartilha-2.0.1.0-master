document.addEventListener('DOMContentLoaded', function () {
    const header = document.querySelector('header');
    if (!header) {
        console.warn('Elemento header não encontrado. Continuando a execução sem header.');
    }
    let lastScrollY = window.scrollY;
    let ticking = false;
    function onScroll() {
        if (header) {
            if (window.scrollY > lastScrollY) {
                header.classList.add('header-small');
            } else {
                header.classList.remove('header-small');
            }
        }
        lastScrollY = window.scrollY;
        ticking = false;
    }
    window.addEventListener('scroll', function () {
        if (!ticking) {
            window.requestAnimationFrame(onScroll);
            ticking = true;
        }
        if (header) {
            if (window.scrollY > 50) {
                header.classList.add('header-hidden');
            } else {
                header.classList.remove('header-hidden');
            }
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
    if (boasPraticasSection) {
        const expandIndicator = boasPraticasSection.querySelector('.expand-indicator');
        const boasPraticasList = boasPraticasSection.querySelector('.boas-praticas-list');
        const boasPraticasItems = boasPraticasList ? boasPraticasList.querySelectorAll('li') : [];

        // Inicia a lista oculta
        if (boasPraticasList) {
            boasPraticasList.classList.add('hidden');

            // Adiciona o listener ao botão
            if (expandIndicator) {
                expandIndicator.addEventListener('click', function () {
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
            }
        }
    }

    // Adiciona funcionalidade ao link de boas práticas
    const boasPraticasLink = document.querySelector('a[href="#boasPraticasSection"]');
    if (boasPraticasLink) {
        boasPraticasLink.addEventListener('click', (e) => {
            e.preventDefault();
            // Seleciona o botão expand-indicator dentro da seção Boas Práticas
            const expandBtn = document.querySelector('#boasPraticasSection .expand-indicator');
            if (expandBtn) {
                expandBtn.click(); // simula o clique para alternar o estado de aberto/fechado
                // Opcional: rolagem suave até a seção
                document.getElementById('boasPraticasSection').scrollIntoView({ behavior: "smooth" });
            }
        });
    }

    // Pop-up com opção "Não mostrar novamente"
    const popup = document.getElementById('popup');
    if (popup) {
        const okButton = document.getElementById('ok-btn');
        const dontShowAgain = document.getElementById('dontShowAgain');
        if (localStorage.getItem('hidePopup') === 'true') {
            popup.style.display = 'none';
        } else {
            popup.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }

        if (okButton) {
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
        }
    }

    // CORREÇÃO: Mostrar e ocultar pesquisa
    const pesquisaSection = document.getElementById('pesquisaSection');
    const feedbackNavLink = document.querySelector('a[href="#pesquisaSection"]');

    // Verificar se os elementos existem e logar informações para debug
    console.log("Elementos para toggle de pesquisa:", {
        pesquisaSection: pesquisaSection ? "encontrado" : "não encontrado",
        feedbackNavLink: feedbackNavLink ? "encontrado" : "não encontrado"
    });

    // Função melhorada para alternar a visibilidade da seção de pesquisa
    function togglePesquisa(e) {
        if (e) e.preventDefault();

        if (!pesquisaSection) {
            console.error("Elemento pesquisaSection não encontrado");
            return;
        }

        // Alternar a classe hidden
        pesquisaSection.classList.toggle('hidden');

        // Logar o estado atual para debug
        console.log("Toggle executado. Estado atual:",
            pesquisaSection.classList.contains('hidden') ? "escondido" : "visível");

        // Se a seção estiver visível, rolar até ela
        if (!pesquisaSection.classList.contains('hidden')) {
            pesquisaSection.scrollIntoView({ behavior: 'smooth' });
        }
    }

    // Adicionar o evento de clique ao link FEEDBACK
    if (feedbackNavLink) {
        // Remover qualquer listener existente para evitar duplicação
        const newFeedbackNavLink = feedbackNavLink.cloneNode(true);
        feedbackNavLink.parentNode.replaceChild(newFeedbackNavLink, feedbackNavLink);

        // Adicionar o novo listener
        newFeedbackNavLink.addEventListener('click', togglePesquisa);
        console.log("Evento de clique adicionado ao link FEEDBACK");
    } else {
        console.error("Link FEEDBACK não encontrado");
    }
});

// Funcionalidades de armazenamento local para o espaço colaborativo e dos formulários de feedback, perguntas e sugestões
document.addEventListener('DOMContentLoaded', function () {
    // Funcionalidade das tabs
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    if (tabBtns.length > 0) {
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                // Remove a classe active de todos os botões e conteúdos
                tabBtns.forEach(b => b.classList.remove('active'));
                tabContents.forEach(c => c.classList.remove('active'));
                // Adiciona a classe active ao botão clicado
                btn.classList.add('active');
                // Mostra o conteúdo correspondente
                const tabId = btn.getAttribute('data-tab');
                document.getElementById(`${tabId}-tab`).classList.add('active');
            });
        });
    }

    // Função para atualizar a lista de feedbacks recentes
    function updateRecentFeedbacks() {
        const feedbackList = document.querySelector('.feedback-list');
        if (feedbackList) {
            // Limpar lista atual
            feedbackList.innerHTML = '';
            // Obter feedbacks do localStorage
            const feedbacks = JSON.parse(localStorage.getItem('feedbacks') || '[]');
            // Mostrar os últimos 5 feedbacks
            const recentFeedbacks = feedbacks.slice(-5).reverse();
            if (recentFeedbacks.length > 0) {
                recentFeedbacks.forEach(feedback => {
                    const feedbackItem = document.createElement('div');
                    feedbackItem.className = 'feedback-item';
                    feedbackItem.innerHTML = `
                        <div class="feedback-rating">Avaliação: ${feedback.rating}/10</div>
                        <p>"${feedback.text}"</p>
                        <span class="feedback-date">${feedback.date}</span>
                    `;
                    feedbackList.appendChild(feedbackItem);
                });
            } else {
                feedbackList.innerHTML = '<p>Nenhum feedback enviado ainda.</p>';
            }
        }
    }

    // Chamar a função para atualizar feedbacks quando a página carrega
    updateRecentFeedbacks();

    // ===== PERGUNTAS =====
    const submitQuestionBtn = document.getElementById('submit-question');
    if (submitQuestionBtn) {
        submitQuestionBtn.addEventListener('click', async () => {
            const questionText = document.getElementById("question-text");
            const question = questionText.value.trim();
            if (!question) {
                alert("Por favor, digite uma pergunta.");
                return;
            }
            // Exibe um indicador temporário na própria textarea (opcional)
            questionText.disabled = true;
            submitQuestionBtn.textContent = "Processando...";
            let responses = JSON.parse(localStorage.getItem("iaResponses") || "{}");
            if (responses[question]) {
                // Se já houver resposta armazenada, salva e atualiza a lista
                salvarPergunta(question, responses[question]);
                updateQuestionsList();
                questionText.value = "";
                questionText.disabled = false;
                submitQuestionBtn.textContent = "Enviar Pergunta";
                return;
            }
            try {
                const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                    method: "POST",
                    headers: {
                        "Authorization": "Bearer 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", // Substitua pela sua chave
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        model: "openai/gpt-3.5-turbo",
                        messages: [{ role: "user", content: question }]
                    })
                });
                const data = await response.json();
                const content = data.choices?.[0]?.message?.content || "Não foi possível gerar uma resposta.";
                // Armazena a resposta no objeto e salva no localStorage
                responses[question] = content;
                localStorage.setItem("iaResponses", JSON.stringify(responses));
                // Salva a pergunta e resposta na lista de perguntas
                salvarPergunta(question, content);
                updateQuestionsList();
            } catch (error) {
                alert("Erro ao obter resposta da IA. Tente novamente mais tarde.");
                console.error(error);
            } finally {
                questionText.value = "";
                questionText.disabled = false;
                submitQuestionBtn.textContent = "Enviar Pergunta";
            }
        });
    }

    // Função para salvar a pergunta e a resposta no localStorage (chave "questions")
    function salvarPergunta(question, answer) {
        let questionsArray = JSON.parse(localStorage.getItem("questions") || "[]");
        // Cria um objeto para a pergunta
        const novaPergunta = {
            text: question,
            answer: answer,
            answered: true,
            date: new Date().toLocaleDateString(),
            answerDate: new Date().toLocaleDateString() // Ajuste para incluir o horário, se desejar
        };
        questionsArray.push(novaPergunta);
        localStorage.setItem("questions", JSON.stringify(questionsArray));
    }

    // Função para atualizar a lista de perguntas
    function updateQuestionsList() {
        const questionsList = document.querySelector('.questions-list');
        if (questionsList) {
            // Limpar lista atual
            questionsList.innerHTML = '';
            // Obter perguntas do localStorage
            const questions = JSON.parse(localStorage.getItem('questions') || '[]');
            // Mostrar as perguntas (mais recentes primeiro)
            const recentQuestions = [...questions].reverse();
            if (recentQuestions.length > 0) {
                recentQuestions.forEach(question => {
                    const questionItem = document.createElement('div');
                    questionItem.className = 'question-item';
                    let answerHTML = '';
                    if (question.answered) {
                        answerHTML = `
                            <div class="answer">
                                <p>${question.answer}</p>
                                <span class="answer-author">Equipe EPPE</span>
                                <span class="answer-date">${question.answerDate}</span>
                            </div>
                        `;
                    } else {
                        answerHTML = `
                            <div class="answer pending">
                                <p>Aguardando resposta...</p>
                            </div>
                        `;
                    }
                    questionItem.innerHTML = `
                        <div class="question">
                            <h4>${question.text}</h4>
                            <span class="question-date">${question.date}</span>
                        </div>
                        ${answerHTML}
                    `;
                    questionsList.appendChild(questionItem);
                });
            } else {
                questionsList.innerHTML = '<p>Nenhuma pergunta enviada ainda.</p>';
            }
        }
    }

    // Chamar a função para atualizar perguntas quando a página carrega
    updateQuestionsList();
});

document.addEventListener('DOMContentLoaded', function () {
    // Corrigir o comportamento de todos os dropdowns na navegação
    const dropdownLinks = document.querySelectorAll('.nav-item.dropdown > a');

    dropdownLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            // Verificar se o dropdown está visível
            const dropdown = this.nextElementSibling;
            const isVisible = window.getComputedStyle(dropdown).display === 'block';

            // Prevenir o comportamento padrão do link
            e.preventDefault();

            if (!isVisible) {
                // Fechar todos os outros dropdowns primeiro
                document.querySelectorAll('.nav-item.dropdown').forEach(item => {
                    if (item !== this.parentElement) {
                        item.classList.remove('show-dropdown');
                    }
                });

                // Mostrar o dropdown atual
                this.parentElement.classList.add('show-dropdown');

                // Configurar um ouvinte de clique global para fechar o dropdown quando clicar fora
                // Configurar um ouvinte de clique global para fechar o dropdown quando clicar fora
                setTimeout(() => {
                    document.addEventListener('click', function closeDropdown(event) {
                        if (!link.parentElement.contains(event.target)) {
                            link.parentElement.classList.remove('show-dropdown');
                            document.removeEventListener('click', closeDropdown);
                        }
                    });
                }, 0);
            } else {
                // Se já estiver visível, fechar o dropdown e navegar para o link se tiver href
                this.parentElement.classList.remove('show-dropdown');

                // Se o link tem um href válido, navegar para ele
                if (this.getAttribute('href') && this.getAttribute('href') !== '#') {
                    const href = this.getAttribute('href');

                    // Se for um link para uma seção na mesma página
                    if (href.startsWith('#')) {
                        const targetElement = document.querySelector(href);
                        if (targetElement) {
                            // Rolar para a seção após um pequeno atraso para garantir que o dropdown fechou
                            setTimeout(() => {
                                targetElement.scrollIntoView({ behavior: 'smooth' });
                            }, 100);
                        }
                    } else {
                        // Se for um link externo ou para outra página
                        window.location.href = href;
                    }
                }
            }
        });
    });
});

document.addEventListener('DOMContentLoaded', function () {
    // Código existente para os dropdowns...

    // Adicionar comportamento específico para o ícone de administração
    const adminButton = document.querySelector('.admin-button');
    
if (adminButton) {
    // Detectar se é um dispositivo de toque
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    // Usar o evento apropriado com base no tipo de dispositivo
    const eventType = isTouchDevice ? 'touchstart' : 'click';
    
    adminButton.addEventListener(eventType, function (e) {
        e.preventDefault();
        e.stopPropagation(); // Impedir propagação do evento
        
        const adminIcon = this.closest('.admin-icon');
        if (!adminIcon) return;
        
        // Alternar a classe show-dropdown
        adminIcon.classList.toggle('show-dropdown');
        
        // Fechar ao tocar/clicar fora
        const closeDropdown = function (event) {
            // Para eventos de toque, verificar o primeiro toque
            const target = event.touches ? event.touches[0].target : event.target;
            
            if (!adminIcon.contains(target)) {
                adminIcon.classList.remove('show-dropdown');
                document.removeEventListener(eventType, closeDropdown);
            }
        };
        
        // Adicionar listener com pequeno atraso
        setTimeout(() => {
            document.addEventListener(eventType, closeDropdown);
        }, 10);
    });
    
    // Para dispositivos de toque, prevenir comportamento padrão no touchend
    if (isTouchDevice) {
        adminButton.addEventListener('touchend', function (e) {
            e.preventDefault();
        });
    }
}


    // Ajustar posição do dropdown em caso de rolagem ou redimensionamento
    window.addEventListener('resize', adjustDropdownPosition);
    window.addEventListener('scroll', adjustDropdownPosition);

    function adjustDropdownPosition() {
        const adminIcon = document.querySelector('.admin-icon');
        if (adminIcon && adminIcon.classList.contains('show-dropdown')) {
            const dropdown = adminIcon.querySelector('.dropdown-menu');
            const rect = adminIcon.getBoundingClientRect();

            // Verificar se o dropdown vai sair da tela
            if (window.innerWidth < rect.right + dropdown.offsetWidth) {
                dropdown.style.right = '0';
                dropdown.style.left = 'auto';
            }
        }
    }
});

// Adicionar código para o botão de feedback na navbar
document.addEventListener('DOMContentLoaded', function () {
    console.log("Inicializando funcionalidade do botão FEEDBACK");

    // Obter referências aos elementos
    const feedbackButton = document.querySelector('a[href="#pesquisaSection"]');
    const pesquisaSection = document.getElementById('pesquisaSection');

    // Verificar se os elementos existem
    if (feedbackButton && pesquisaSection) {
        console.log("Elementos encontrados, configurando evento de clique");

        // Garantir que a seção inicie escondida (já tem a classe hidden no HTML)

        // Adicionar evento de clique ao botão de feedback
        feedbackButton.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation(); // Impedir propagação do evento

            // Alternar a visibilidade da seção
            pesquisaSection.classList.toggle('hidden');

            console.log("Botão FEEDBACK clicado. Estado da seção:",
                pesquisaSection.classList.contains('hidden') ? "escondida" : "visível");

            // Se a seção estiver visível, rolar até ela
            if (!pesquisaSection.classList.contains('hidden')) {
                pesquisaSection.scrollIntoView({ behavior: 'smooth' });
            }
        });

        // Adicionar evento de clique ao botão de envio de avaliação
        const submitSurveyBtn = document.getElementById('submit-survey');
        if (submitSurveyBtn) {
            submitSurveyBtn.addEventListener('click', function () {
                // Obter a avaliação selecionada
                const selectedRating = document.querySelector('.rating-btn.selected');
                const feedbackText = document.getElementById('feedback').value.trim();

                if (!selectedRating) {
                    alert("Por favor, selecione uma avaliação de 0 a 10.");
                    return;
                }

                if (!feedbackText) {
                    alert("Por favor, deixe um comentário sobre sua avaliação.");
                    return;
                }

                // Salvar o feedback no localStorage
                const rating = selectedRating.getAttribute('data-value');
                const feedback = {
                    rating: rating,
                    text: feedbackText,
                    date: new Date().toLocaleDateString()
                };

                let feedbacks = JSON.parse(localStorage.getItem('feedbacks') || '[]');
                feedbacks.push(feedback);
                localStorage.setItem('feedbacks', JSON.stringify(feedbacks));

                // Limpar o formulário
                document.querySelectorAll('.rating-btn').forEach(btn => btn.classList.remove('selected'));
                document.getElementById('feedback').value = '';

                // Atualizar a lista de feedbacks recentes
                updateRecentFeedbacks();

                // Mostrar mensagem de sucesso
                alert("Obrigado pelo seu feedback!");
            });
        }

        // Adicionar evento de clique aos botões de avaliação
        const ratingButtons = document.querySelectorAll('.rating-btn');
        ratingButtons.forEach(btn => {
            btn.addEventListener('click', function () {
                // Remover a classe 'selected' de todos os botões
                ratingButtons.forEach(b => b.classList.remove('selected'));
                // Adicionar a classe 'selected' ao botão clicado
                this.classList.add('selected');
            });
        });

        // Função para atualizar a lista de feedbacks recentes
        function updateRecentFeedbacks() {
            const feedbackList = document.querySelector('.feedback-list');
            if (feedbackList) {
                // Limpar lista atual
                feedbackList.innerHTML = '';
                // Obter feedbacks do localStorage
                const feedbacks = JSON.parse(localStorage.getItem('feedbacks') || '[]');
                // Mostrar os últimos 5 feedbacks
                const recentFeedbacks = feedbacks.slice(-5).reverse();
                if (recentFeedbacks.length > 0) {
                    recentFeedbacks.forEach(feedback => {
                        const feedbackItem = document.createElement('div');
                        feedbackItem.className = 'feedback-item';
                        feedbackItem.innerHTML = `
                            <div class="feedback-rating">Avaliação: ${feedback.rating}/10</div>
                            <p>"${feedback.text}"</p>
                            <span class="feedback-date">${feedback.date}</span>
                        `;
                        feedbackList.appendChild(feedbackItem);
                    });
                } else {
                    feedbackList.innerHTML = '<p>Nenhum feedback enviado ainda.</p>';
                }
            }
        }

        // Atualizar a lista de feedbacks quando a página carrega
        updateRecentFeedbacks();
    } else {
        console.error("Elementos necessários não encontrados:", {
            feedbackButton: feedbackButton ? "encontrado" : "não encontrado",
            pesquisaSection: pesquisaSection ? "encontrado" : "não encontrado"
        });
    }
});

// Adicione este código no final do seu arquivo JavaScript existente
// ou substitua a parte relacionada ao botão de feedback

document.addEventListener('DOMContentLoaded', function() {
    console.log("Inicializando funcionalidade do botão FEEDBACK - versão corrigida");
    
    // Obter referências aos elementos
    const feedbackButtons = document.querySelectorAll('a[href="#pesquisaSection"]');
    const pesquisaSection = document.getElementById('pesquisaSection');
    
    // Verificar se os elementos existem
    if (feedbackButtons.length > 0 && pesquisaSection) {
        console.log("Elementos encontrados, configurando eventos de clique para", feedbackButtons.length, "botões");
        
        // Função para lidar com o clique no botão de feedback
        function handleFeedbackClick(e) {
            e.preventDefault();
            e.stopPropagation();
            
            // Verificar o estado atual da seção
            const isHidden = pesquisaSection.classList.contains('hidden');
            console.log("Estado atual da seção antes do toggle:", isHidden ? "escondida" : "visível");
            
            // Alternar a visibilidade da seção
            if (isHidden) {
                pesquisaSection.classList.remove('hidden');
                console.log("Classe 'hidden' removida");
            } else {
                pesquisaSection.classList.add('hidden');
                console.log("Classe 'hidden' adicionada");
            }
            
            // Verificar o estado após o toggle
            console.log("Estado após toggle:", pesquisaSection.classList.contains('hidden') ? "escondida" : "visível");
            
            // Se a seção estiver visível agora, rolar até ela
            if (!pesquisaSection.classList.contains('hidden')) {
                setTimeout(() => {
                    pesquisaSection.scrollIntoView({ behavior: 'smooth' });
                    console.log("Rolando até a seção");
                }, 100);
            }
        }
        
        // Adicionar evento de clique a todos os botões de feedback encontrados
        feedbackButtons.forEach(button => {
            // Remover qualquer evento existente para evitar duplicação
            button.removeEventListener('click', handleFeedbackClick);
            // Adicionar o novo evento
            button.addEventListener('click', handleFeedbackClick);
            console.log("Evento de clique adicionado ao botão:", button);
        });
        
        // Verificar o CSS para garantir que a classe hidden funciona corretamente
        const hiddenStyle = window.getComputedStyle(pesquisaSection).display;
        console.log("Estilo de exibição atual da seção:", hiddenStyle);
        
        // Adicionar um estilo inline temporário para garantir que a classe hidden funcione
        if (hiddenStyle !== 'none' && pesquisaSection.classList.contains('hidden')) {
            console.log("Adicionando estilo inline para garantir que a seção fique escondida");
            const style = document.createElement('style');
            style.textContent = `
                #pesquisaSection.hidden {
                    display: none !important;
                }
            `;
            document.head.appendChild(style);
        }
    } else {
        console.error("Elementos necessários não encontrados:", {
            feedbackButtons: feedbackButtons.length > 0 ? `${feedbackButtons.length} encontrados` : "não encontrados",
            pesquisaSection: pesquisaSection ? "encontrado" : "não encontrado"
        });
    }
});



