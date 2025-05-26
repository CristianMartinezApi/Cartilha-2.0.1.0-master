/**
 * Script para gerenciar a página de sugestões
 */
document.addEventListener("DOMContentLoaded", () => {
    console.log("Página de sugestões carregada");

    // Inicializar componentes
    initForm();
    initCategoryFilter();
    loadApprovedPrompts();

    // Verificar se há um hash na URL para rolagem automática
    if (window.location.hash) {
        const targetElement = document.querySelector(window.location.hash);
        if (targetElement) {
            setTimeout(() => {
                targetElement.scrollIntoView({ behavior: 'smooth' });
            }, 500);
        }
    }
});

/**
 * Inicializa o formulário de envio de sugestões
 */
function initForm() {
    const suggestionForm = document.getElementById("suggestion-form");

    if (!suggestionForm) return;

    suggestionForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const submitButton = suggestionForm.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Enviando...';

        const title = document.getElementById("prompt-title").value.trim();
        const comment = document.getElementById("prompt-comment").value.trim();
        const category = document.getElementById("prompt-category").value;
        const text = document.getElementById("prompt-text").value.trim();

        // Verificar se os campos obrigatórios estão preenchidos
        if (!title || !category || !text) {
            showFeedback("Por favor, preencha todos os campos obrigatórios.", "danger");
            submitButton.disabled = false;
            submitButton.innerHTML = 'Enviar Prompt';
            return;
        }

        // Criar objeto de sugestão
        const suggestion = {
            title: title,
            comment: comment || "Sem comentário",
            category: category,
            text: text,
            status: "pending", // Aguardando aprovação
            date: firebase.firestore.FieldValue.serverTimestamp(),
            likes: 0,
            views: 0
        };

        try {
            // Enviar para o Firestore
            await window.db.collection("sugestoes").add(suggestion);

            showFeedback("Sua sugestão foi enviada e está aguardando aprovação. Obrigado pela contribuição!", "success");

            // Limpar o formulário
            suggestionForm.reset();
        } catch (error) {
            console.error("Erro ao enviar sugestão:", error);
            showFeedback("Erro ao enviar sugestão. Tente novamente.", "danger");
        } finally {
            submitButton.disabled = false;
            submitButton.innerHTML = 'Enviar Prompt';
        }
    });
}

/**
 * Inicializa o filtro de categorias
 */
function initCategoryFilter() {
    const categoryFilter = document.getElementById('category-filter');

    if (!categoryFilter) return;

    categoryFilter.addEventListener('change', () => {
        loadApprovedPrompts();
    });
}

/**
 * Função para carregar e exibir os prompts aprovados
 */
function loadApprovedPrompts() {
    const suggestionsList = document.querySelector('.suggestions-list');
    const loadingIndicator = document.getElementById('loading-indicator');

    if (!suggestionsList) {
        console.error("Container de sugestões não encontrado!");
        return;
    }

    // Mostrar indicador de carregamento
    if (loadingIndicator) {
        loadingIndicator.style.display = 'block';
    }

    // Filtrar por categoria se houver um filtro ativo
    let query = window.db.collection("sugestoes")
        .where("status", "==", "approved")
        .orderBy("date", "desc");

    const categoryFilter = document.getElementById('category-filter');
    if (categoryFilter && categoryFilter.value !== 'all') {
        query = query.where("category", "==", categoryFilter.value);
    }

    // Obter os prompts que o usuário já curtiu
    const likedPrompts = JSON.parse(localStorage.getItem('likedPrompts') || '[]');

    query.get()
        .then((querySnapshot) => {
            // Esconder indicador de carregamento
            if (loadingIndicator) {
                loadingIndicator.style.display = 'none';
            }

            // Limpar lista atual e configurar como acordeão
            suggestionsList.innerHTML = "";
            suggestionsList.setAttribute('id', 'suggestions-accordion');

            if (querySnapshot.empty) {
                suggestionsList.innerHTML = `
                    <div class="text-center py-4">
                        <i class="fas fa-info-circle fa-2x text-muted mb-3"></i>
                        <p>Nenhum prompt encontrado. Seja o primeiro a contribuir!</p>
                    </div>
                `;
                return;
            }

            // Adicionar cada prompt à lista
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                const formattedDate = data.date ? new Date(data.date.toDate()).toLocaleDateString('pt-BR') : 'Data desconhecida';
                const uniqueId = doc.id; // Usar o ID único do documento

                // Verificar se o usuário já curtiu este prompt
                const userLiked = likedPrompts.includes(doc.id);

                // Definir classes e atributos com base no estado de curtida
                const likeButtonClass = userLiked ? 'btn-danger' : 'btn-outline-danger';
                const likeButtonDisabled = userLiked ? 'disabled' : '';

                const suggestionElement = document.createElement('div');
                suggestionElement.className = 'suggestion-item accordion-item';

                suggestionElement.innerHTML = `
                    <div class="card mb-2">
                        <!-- Cabeçalho clicável do acordeão -->
                        <div class="card-header p-0">
                            <button class="btn btn-link w-100 p-3 text-decoration-none accordion-toggle border-0" 
                                    type="button" 
                                    data-bs-toggle="collapse" 
                                    data-bs-target="#prompt-${uniqueId}" 
                                    aria-expanded="false" 
                                    aria-controls="prompt-${uniqueId}"
                                    style="text-align: left !important;">
                                <div class="d-flex justify-content-between align-items-center w-100">
                                    <div class="text-start flex-grow-1">
                                        <h6 class="mb-1 text-dark fw-bold text-start">
                                            <i class="fas fa-lightbulb me-2 text-warning"></i>
                                            ${data.title || 'Sem título'}
                                        </h6>
                                        <div class="d-flex align-items-center text-start">
                                            <small class="text-muted me-3">📋 Finalidade do Prompt</small>
                                            <span class="badge bg-primary">${data.category || 'Não categorizado'}</span>
                                        </div>
                                    </div>
                                    <div class="text-end">
                                        <i class="fas fa-chevron-down accordion-arrow transition-all"></i>
                                    </div>
                                </div>
                            </button>
                        </div>
                        
                        <!-- Conteúdo expansível -->
                        <div id="prompt-${uniqueId}" class="collapse" data-bs-parent="#suggestions-accordion">
                            <div class="card-body">
                                <div class="mb-3">
                                    <h6 class="text-primary mb-2">
                                        <i class="fas fa-pen me-1"></i> Texto do Prompt:
                                    </h6>
                                    <div class="prompt-text bg-light p-3 rounded border" style="font-family: 'Courier New', monospace; font-size: 16px; text-align: justify;">
    ${data.text || 'Sem conteúdo'}
</div>

                                </div>
                                ${data.comment && data.comment !== 'Sem comentário' ? `
                                <div class="mb-3">
                                    <h6 class="text-info mb-2">
                                        <i class="fas fa-comment me-1"></i> Comentário:
                                    </h6>
                                    <p class="card-text text-muted bg-info bg-opacity-10 p-3 rounded">
                                        ${data.comment}
                                    </p>
                                </div>
                                ` : ''}
                            </div>
                            <div class="card-footer d-flex justify-content-between align-items-center">
                                <div>
                                    <small class="text-muted">Publicado em ${formattedDate}</small>
                                    <small class="ms-2 text-secondary">
                                        <i class="fas fa-eye me-1"></i>${data.views || 0} visualizações
                                    </small>
                                </div>
                                <div>
                                    <button class="btn btn-sm ${likeButtonClass} like-btn" 
                                        data-id="${doc.id}" title="Curtir" ${likeButtonDisabled}>
                                        <i class="fas fa-heart"></i> 
                                        <span class="like-count">${data.likes || 0}</span>
                                    </button>
                                    <button class="btn btn-sm btn-outline-primary copy-btn" 
                                        data-id="${doc.id}" title="Copiar prompt">
                                        <i class="fas fa-copy"></i> Copiar
                                    </button>
                                    <button class="btn btn-sm btn-outline-secondary share-btn" 
                                        data-id="${doc.id}" title="Compartilhar">
                                        <i class="fas fa-share-alt"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                `;

                suggestionsList.appendChild(suggestionElement);

                // Incrementar visualizações apenas quando o prompt for expandido
                const collapseElement = suggestionElement.querySelector(`#prompt-${uniqueId}`);
                collapseElement.addEventListener('shown.bs.collapse', () => {
                    window.db.collection("sugestoes").doc(doc.id).update({
                        views: firebase.firestore.FieldValue.increment(1)
                    }).catch(err => console.log("Erro ao atualizar visualizações:", err));
                });
            });

            // Adicionar event listeners aos botões
            document.querySelectorAll('.copy-btn').forEach(btn => {
                btn.addEventListener('click', handleCopyPrompt);
            });

            document.querySelectorAll('.like-btn').forEach(btn => {
                btn.addEventListener('click', handleLikePrompt);
            });

            document.querySelectorAll('.share-btn').forEach(btn => {
                btn.addEventListener('click', handleSharePrompt);
            });

            // Adicionar animação para as setas do acordeão
            document.querySelectorAll('.accordion-toggle').forEach(toggle => {
                toggle.addEventListener('click', function () {
                    const arrow = this.querySelector('.accordion-arrow');
                    setTimeout(() => {
                        const isExpanded = this.getAttribute('aria-expanded') === 'true';
                        arrow.style.transform = isExpanded ? 'rotate(180deg)' : 'rotate(0deg)';
                    }, 10);
                });
            });
        })
        .catch((error) => {
            console.error("Erro ao carregar prompts:", error);

            if (loadingIndicator) {
                loadingIndicator.style.display = 'none';
            }

            suggestionsList.innerHTML = `
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    Erro ao carregar prompts. Por favor, tente novamente mais tarde.
                </div>
            `;
        });
}



/**
 * Função para lidar com a cópia de prompts
 */
function handleCopyPrompt(e) {
    e.preventDefault();

    try {
        // Obter o texto do prompt diretamente do elemento clicado
        const button = e.currentTarget;
        const card = button.closest('.card'); // Encontrar o card pai

        if (!card) {
            throw new Error('Não foi possível encontrar o card pai');
        }

        // Encontrar o elemento que contém o texto do prompt
        const promptElement = card.querySelector('.prompt-text');

        if (!promptElement) {
            throw new Error('Não foi possível encontrar o elemento com o texto do prompt');
        }

        const textToCopy = promptElement.textContent.trim();

        // Criar um elemento temporário para a cópia
        const textarea = document.createElement('textarea');
        textarea.value = textToCopy;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'absolute';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);

        // Selecionar e copiar o texto
        textarea.select();
        const successful = document.execCommand('copy');
        document.body.removeChild(textarea);

        if (successful) {
            // Feedback visual de sucesso
            const originalText = button.innerHTML;
            button.innerHTML = '<i class="fas fa-check"></i> Copiado!';
            button.classList.add('btn-success');
            button.classList.remove('btn-outline-primary');

            // Restaurar o botão após 2 segundos
            setTimeout(() => {
                button.innerHTML = originalText;
                button.classList.remove('btn-success');
                button.classList.add('btn-outline-primary');
            }, 2000);
        } else {
            throw new Error('Falha ao copiar com execCommand');
        }
    } catch (err) {
        console.error('Erro ao copiar texto:', err);

        // Tentar método alternativo com a API Clipboard
        try {
            const card = e.currentTarget.closest('.card');
            if (!card) {
                throw new Error('Não foi possível encontrar o card pai');
            }

            const promptElement = card.querySelector('.prompt-text');
            if (!promptElement) {
                throw new Error('Não foi possível encontrar o elemento com o texto do prompt');
            }

            const textToCopy = promptElement.textContent.trim();

            navigator.clipboard.writeText(textToCopy)
                .then(() => {
                    const button = e.currentTarget;
                    const originalText = button.innerHTML;
                    button.innerHTML = '<i class="fas fa-check"></i> Copiado!';
                    button.classList.add('btn-success');
                    button.classList.remove('btn-outline-primary');

                    setTimeout(() => {
                        button.innerHTML = originalText;
                        button.classList.remove('btn-success');
                        button.classList.add('btn-outline-primary');
                    }, 2000);
                })
                .catch(clipErr => {
                    console.error('Erro ao copiar com Clipboard API:', clipErr);
                    alert("Não foi possível copiar o texto. Tente novamente.");
                });
        } catch (finalErr) {
            console.error('Erro final ao tentar copiar:', finalErr);
            alert("Não foi possível copiar o texto. Tente novamente.");
        }
    }
}

/**
 * Função para lidar com curtidas em prompts
 */
function handleLikePrompt(e) {
    e.preventDefault();

    const likeButton = e.currentTarget;
    const promptId = likeButton.getAttribute('data-id');
    const likeCountElement = likeButton.querySelector('.like-count');

    // Desabilitar o botão imediatamente para evitar múltiplos cliques
    likeButton.disabled = true;

    // Verificar se o usuário já curtiu (usando localStorage)
    const likedPrompts = JSON.parse(localStorage.getItem('likedPrompts') || '[]');

    if (likedPrompts.includes(promptId)) {
        showFeedback("Você já curtiu este prompt!", "warning");
        return;
    }

    // Atualizar contagem de curtidas no Firestore
    window.db.collection("sugestoes").doc(promptId).update({
        likes: firebase.firestore.FieldValue.increment(1)
    })
        .then(() => {
            // Atualizar visualmente
            const currentCount = parseInt(likeCountElement.textContent);
            likeCountElement.textContent = currentCount + 1;

            // Adicionar classe visual para indicar que foi curtido
            likeButton.classList.remove('btn-outline-danger');
            likeButton.classList.add('btn-danger');

            // Salvar no localStorage
            likedPrompts.push(promptId);
            localStorage.setItem('likedPrompts', JSON.stringify(likedPrompts));

            showFeedback("Obrigado por curtir este prompt!", "success");
        })
        .catch(err => {
            console.error('Erro ao curtir prompt:', err);
            showFeedback("Erro ao curtir. Tente novamente.", "danger");

            // Reativar o botão em caso de erro
            likeButton.disabled = false;
        });
}


/**
 * Função para lidar com compartilhamento de prompts
 */
function handleSharePrompt(e) {
    e.preventDefault();

    const promptId = e.currentTarget.getAttribute('data-id');
    const card = e.currentTarget.closest('.card');

    if (!card) {
        console.error('Não foi possível encontrar o card pai');
        return;
    }

    const titleElement = card.querySelector('.card-header h5');
    const title = titleElement ? titleElement.textContent : 'Prompt compartilhado';

    // Criar URL para compartilhamento
    const shareUrl = `${window.location.origin}${window.location.pathname}?prompt=${promptId}`;

    // Verificar se a API de compartilhamento está disponível
    if (navigator.share) {
        navigator.share({
            title: title,
            text: 'Confira este prompt útil para IA:',
            url: shareUrl
        })
            .then(() => console.log('Compartilhado com sucesso'))
            .catch(err => console.error('Erro ao compartilhar:', err));
    } else {
        // Fallback: copiar link para a área de transferência
        navigator.clipboard.writeText(shareUrl)
            .then(() => {
                showFeedback("Link copiado para a área de transferência!", "success");
            })
            .catch(err => {
                console.error('Erro ao copiar link:', err);
                showFeedback("Erro ao copiar link. Tente novamente.", "danger");
            });
    }
}

/**
 * Função para exibir feedback ao usuário
 */
function showFeedback(message, type = "info") {
    // Verificar se já existe um alerta
    const existingAlert = document.querySelector('.alert');
    if (existingAlert) {
        existingAlert.remove();
    }

    const alertElement = document.createElement('div');
    alertElement.className = `alert alert-${type} alert-dismissible fade show`;
    alertElement.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Fechar"></button>
    `;

    // Inserir no topo da página
    const container = document.querySelector('.container');
    container.insertBefore(alertElement, container.firstChild);

    // Rolar para o topo para garantir que o alerta seja visto
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Remover automaticamente após 5 segundos
    setTimeout(() => {
        alertElement.classList.remove('show');
        setTimeout(() => alertElement.remove(), 300);
    }, 5000);
}
