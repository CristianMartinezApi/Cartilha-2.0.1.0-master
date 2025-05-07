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
    const expandIndicator = boasPraticasSection.querySelector('.expand-indicator');
    const boasPraticasList = boasPraticasSection.querySelector('.boas-praticas-list');
    const boasPraticasItems = boasPraticasList.querySelectorAll('li');
    
    // Inicia a lista oculta
    boasPraticasList.classList.add('hidden');
    
    // Remove o listener do h2, se existente
    // boasPraticasSection.querySelector('h2').removeEventListener(...);
    
    // Adiciona o listener ao botão
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
});


// Funcionalidades de armazenamento local para o espaço colaborativo e dos formulários de feedback, perguntas e sugestões
document.addEventListener('DOMContentLoaded', function() {
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

    // ===== FEEDBACK =====
   /*  const submitFeedbackBtn = document.getElementById('submit-survey');
    if (submitFeedbackBtn) {
        submitFeedbackBtn.addEventListener('click', () => {
            const feedbackText = document.getElementById('feedback').value;
            let rating = null;

            // Obter o valor da avaliação selecionada
            const activeRatingBtn = document.querySelector('.rating-btn.active');
            if (activeRatingBtn) {
                rating = activeRatingBtn.getAttribute('data-value');
            }

            if (feedbackText.trim() !== '') {
                if (rating === null) {
                    alert('Por favor, selecione uma avaliação de 0 a 10.');
                    return;
                }

                // Criar objeto de feedback
                const feedback = {
                    text: feedbackText,
                    rating: rating,
                    date: new Date().toLocaleDateString()
                };

                // Obter feedbacks existentes ou iniciar array vazio
                const feedbacks = JSON.parse(localStorage.getItem('feedbacks') || '[]');

                // Adicionar novo feedback
                feedbacks.push(feedback);

                // Salvar no localStorage
                localStorage.setItem('feedbacks', JSON.stringify(feedbacks));

                alert('Feedback enviado com sucesso! Obrigado pela sua contribuição.');
                document.getElementById('feedback').value = '';
                document.querySelectorAll('.rating-btn').forEach(btn => btn.classList.remove('active'));

                // Atualizar a lista de feedbacks recentes
                updateRecentFeedbacks();
            } else {
                alert('Por favor, escreva seu feedback antes de enviar.');
            }
        });

        // Adicionar classe 'active' ao botão de avaliação clicado
        const ratingBtns = document.querySelectorAll('.rating-btn');
        ratingBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                ratingBtns.forEach(b => b.classList.remove('active'));
                this.classList.add('active');
            });
        });
    } */

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

    // ===== SUGESTÕES =====
    // Remova ou comente essa parte para evitar conflito com o suggestions.js
    /*
    const submitSuggestionBtn = document.getElementById('submit-suggestion');
    if (submitSuggestionBtn) {
        submitSuggestionBtn.addEventListener('click', () => {
            const suggestionText = document.getElementById('suggestion-text').value;

            if (suggestionText.trim() !== '') {
                // Criar objeto de sugestão
                const suggestion = {
                    text: suggestionText,
                    date: new Date().toLocaleDateString(),
                    votes: 0
                };

                // Obter sugestões existentes ou iniciar array vazio
                const suggestions = JSON.parse(localStorage.getItem('suggestions') || '[]');

                // Adicionar nova sugestão
                suggestions.push(suggestion);

                // Salvar no localStorage
                localStorage.setItem('suggestions', JSON.stringify(suggestions));

                alert('Sua sugestão foi enviada! Obrigado pela contribuição.');
                document.getElementById('suggestion-text').value = '';

                // Atualizar a lista de sugestões
                updateSuggestionsList();
            } else {
                alert('Por favor, escreva sua sugestão antes de enviar.');
            }
        });
    }

    function updateSuggestionsList() {
        const suggestionsList = document.querySelector('.suggestions-list');
        if (suggestionsList) {
            // Limpar lista atual
            suggestionsList.innerHTML = '';

            // Obter sugestões do localStorage
            const suggestions = JSON.parse(localStorage.getItem('suggestions') || '[]');

            // Ordenar por número de votos (mais votadas primeiro)
            const sortedSuggestions = [...suggestions].sort((a, b) => b.votes - a.votes);

            if (sortedSuggestions.length > 0) {
                sortedSuggestions.forEach((suggestion, index) => {
                    const suggestionItem = document.createElement('div');
                    suggestionItem.className = 'suggestion-item';
                    suggestionItem.innerHTML = `
                        <p>"${suggestion.text}"</p>
                        <div class="suggestion-votes">
                            <button class="vote-btn" data-index="${index}">👍 <span>${suggestion.votes}</span></button>
                        </div>
                        <span class="suggestion-date">${suggestion.date}</span>
                    `;
                    suggestionsList.appendChild(suggestionItem);
                });

                // Adicionar funcionalidade de voto aos botões (opcional)
                const voteBtns = suggestionsList.querySelectorAll('.vote-btn');
                voteBtns.forEach(btn => {
                    btn.addEventListener('click', function() {
                        const index = this.getAttribute('data-index');
                        const suggestions = JSON.parse(localStorage.getItem('suggestions') || '[]');

                        suggestions[index].votes += 1;
                        localStorage.setItem('suggestions', JSON.stringify(suggestions));
                        const voteCount = this.querySelector('span');
                        voteCount.textContent = suggestions[index].votes;
                        this.disabled = true;
                        this.style.opacity = '0.7';
                    });
                });
            } else {
                suggestionsList.innerHTML = '<p>Nenhuma sugestão enviada ainda.</p>';
            }
        }
    }

    // Carregar dados existentes ao carregar a página
    updateRecentFeedbacks();
    updateQuestionsList();
    updateSuggestionsList();
    */
});


// Manutenção da funcionalidade do link na navbar
(function() {
    window.addEventListener('load', function() {
        console.log("Página carregada, configurando link de feedback");

        var feedbackLink = document.querySelector('.main-navigation-bar a[href="#pesquisaSection"]');
        var pesquisaSection = document.getElementById('pesquisaSection');
        var surveyTriggerBtn = document.getElementById('survey-trigger');

        console.log("Elementos encontrados:", {
            feedbackLink: feedbackLink,
            pesquisaSection: pesquisaSection,
            surveyTriggerBtn: surveyTriggerBtn
        });

        if (feedbackLink && pesquisaSection && surveyTriggerBtn) {
            surveyTriggerBtn.style.opacity = '0';
            surveyTriggerBtn.style.pointerEvents = 'none';
            surveyTriggerBtn.style.position = 'absolute';
            surveyTriggerBtn.style.left = '-9999px';

            feedbackLink.addEventListener('click', function(e) {
                console.log("Link de feedback clicado");
                e.preventDefault();
                console.log("Simulando clique no botão flutuante");
                surveyTriggerBtn.click();
                return false;
            });

            console.log("Link de feedback configurado com sucesso");
        } else {
            console.error("Um ou mais elementos não foram encontrados");
        }
    });
})();

document.addEventListener('DOMContentLoaded', function() {
    // Seleciona todos os dropdowns do menu
    const dropdowns = document.querySelectorAll('.nav-item.dropdown');
    
    // Detecta se estamos em um dispositivo de toque
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    if (isTouchDevice) {
      // Desativa qualquer comportamento hover baseado em CSS para dispositivos de toque
      const style = document.createElement('style');
      style.innerHTML = `
        @media (max-width: 768px) {
          .nav-item.dropdown:hover .dropdown-menu {
            display: none !important;
          }
          .nav-item.dropdown .dropdown-menu {
            display: none !important;
          }
          .nav-item.dropdown.touch-active .dropdown-menu {
            display: block !important;
          }
        }
      `;
      document.head.appendChild(style);
    }
    
    // Adiciona manipuladores de eventos para cada dropdown
    dropdowns.forEach(dropdown => {
      const dropdownLink = dropdown.querySelector('a');
      const dropdownMenu = dropdown.querySelector('.dropdown-menu');
      
      // Função para posicionar o dropdown corretamente
      function positionDropdown() {
        const rect = dropdown.getBoundingClientRect();
        
        // Posiciona o dropdown abaixo do link pai
        dropdownMenu.style.top = (rect.bottom + 5) + 'px';
        
        // Ajusta o posicionamento horizontal com base no tamanho da tela
        if (window.innerWidth <= 480) {
          // Em telas muito pequenas, centraliza
          dropdownMenu.style.left = '50%';
          dropdownMenu.style.transform = 'translateX(-50%)';
          // Largura baseada na tela, mas com limites
          const width = Math.min(Math.max(window.innerWidth * 0.85, 180), 280);
          dropdownMenu.style.width = width + 'px';
        } else {
          // Em telas médias, alinha com o pai, mas com ajustes
          const leftPos = Math.max(10, Math.min(rect.left, window.innerWidth - 260));
          dropdownMenu.style.left = leftPos + 'px';
          dropdownMenu.style.width = 'auto';
          dropdownMenu.style.transform = 'none';
        }
      }
      
      // Manipulador para eventos de clique (funciona tanto para toque quanto para mouse)
      dropdownLink.addEventListener('click', function(e) {
        // Verifica se o dropdown já está aberto
        const isActive = dropdown.classList.contains('touch-active');
        
        // Fecha todos os outros dropdowns
        dropdowns.forEach(item => {
          if (item !== dropdown) {
            item.classList.remove('touch-active');
          }
        });
        
        // Se este dropdown não estava aberto, previne a navegação e abre o dropdown
        if (!isActive) {
          e.preventDefault();
          e.stopPropagation();
          
          // Posiciona o dropdown antes de mostrá-lo
          positionDropdown();
          
          // Mostra o dropdown
          dropdown.classList.add('touch-active');
        }
      });
      
      // Adiciona eventos para os links dentro do dropdown
      const dropdownMenuLinks = dropdownMenu.querySelectorAll('a');
      dropdownMenuLinks.forEach(link => {
        link.addEventListener('click', function(e) {
          // Não previne a navegação para links dentro do dropdown
          // Fecha o dropdown após clicar em um link interno
          setTimeout(() => {
            dropdown.classList.remove('touch-active');
          }, 100);
        });
      });
    });
    
    // Fecha os dropdowns quando clicar em qualquer lugar fora deles
    document.addEventListener('click', function(e) {
      if (!e.target.closest('.dropdown-menu') && !e.target.closest('.nav-item.dropdown > a')) {
        dropdowns.forEach(dropdown => {
          dropdown.classList.remove('touch-active');
        });
      }
    });
    
    // Fecha os dropdowns quando a página é rolada
    window.addEventListener('scroll', function() {
      dropdowns.forEach(dropdown => {
        dropdown.classList.remove('touch-active');
      });
    });
  });
  

