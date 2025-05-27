/**
 * Script para gerenciar a página de sugestões
 * Versão otimizada com melhorias de performance e manutenibilidade
 */

// Configurações globais
const CONFIG = {
    FEEDBACK_DURATION: 5000,
    BUTTON_RESTORE_DELAY: 2000,
    SCROLL_DELAY: 500,
    ARROW_ANIMATION_DELAY: 10,
    MAX_TITLE_LENGTH: 100,
    MAX_TEXT_LENGTH: 2000,
    MAX_COMMENT_LENGTH: 500
};

// Cache de elementos DOM
const DOM_CACHE = {
    suggestionForm: null,
    categoryFilter: null,
    suggestionsList: null,
    loadingIndicator: null,
    container: null
};

// Estado da aplicação
const APP_STATE = {
    isLoading: false,
    likedPrompts: new Set(),
    currentCategory: 'all'
};

/**
 * Inicialização principal
 */
document.addEventListener("DOMContentLoaded", () => {
    console.log("Página de sugestões carregada");
    
    try {
        initializeApp();
    } catch (error) {
        console.error("Erro na inicialização:", error);
        showFeedback("Erro ao carregar a página. Recarregue para tentar novamente.", "danger");
    }
});

/**
 * Inicializa a aplicação
 */
function initializeApp() {
    // Cache elementos DOM
    cacheElements();
    
    // Carregar estado do localStorage
    loadAppState();
    
    // Inicializar componentes
    initForm();
    initCategoryFilter();
    initSearchFunctionality();
    loadApprovedPrompts();
    
    // Verificar hash na URL
    handleUrlHash();
    
    // Adicionar listeners globais
    addGlobalListeners();
}

/**
 * Cache elementos DOM para melhor performance
 */
function cacheElements() {
    DOM_CACHE.suggestionForm = document.getElementById("suggestion-form");
    DOM_CACHE.categoryFilter = document.getElementById('category-filter');
    DOM_CACHE.suggestionsList = document.querySelector('.suggestions-list');
    DOM_CACHE.loadingIndicator = document.getElementById('loading-indicator');
    DOM_CACHE.container = document.querySelector('.container');
}

/**
 * Carrega estado da aplicação do localStorage
 */
function loadAppState() {
    const likedPrompts = JSON.parse(localStorage.getItem('likedPrompts') || '[]');
    APP_STATE.likedPrompts = new Set(likedPrompts);
}

/**
 * Salva estado da aplicação no localStorage
 */
function saveAppState() {
    localStorage.setItem('likedPrompts', JSON.stringify([...APP_STATE.likedPrompts]));
}

/**
 * Inicializa o formulário de envio de sugestões
 */
function initForm() {
    if (!DOM_CACHE.suggestionForm) return;

    // Adicionar validação em tempo real
    addFormValidation();
    
    DOM_CACHE.suggestionForm.addEventListener("submit", handleFormSubmit);
}

/**
 * Adiciona validação em tempo real ao formulário
 */
function addFormValidation() {
    const titleInput = document.getElementById("prompt-title");
    const textInput = document.getElementById("prompt-text");
    const commentInput = document.getElementById("prompt-comment");

    if (titleInput) {
        titleInput.addEventListener('input', () => validateField(titleInput, CONFIG.MAX_TITLE_LENGTH));
    }
    
    if (textInput) {
        textInput.addEventListener('input', () => validateField(textInput, CONFIG.MAX_TEXT_LENGTH));
    }
    
    if (commentInput) {
        commentInput.addEventListener('input', () => validateField(commentInput, CONFIG.MAX_COMMENT_LENGTH));
    }
}

/**
 * Valida campo individual
 */
function validateField(field, maxLength) {
    const value = field.value.trim();
    const isValid = value.length <= maxLength;
    
    field.classList.toggle('is-invalid', !isValid);
    field.classList.toggle('is-valid', isValid && value.length > 0);
    
    // Atualizar contador de caracteres se existir
    const counter = field.parentElement.querySelector('.char-counter');
    if (counter) {
        counter.textContent = `${value.length}/${maxLength}`;
        counter.classList.toggle('text-danger', !isValid);
    }
}

/**
 * Manipula envio do formulário
 */
async function handleFormSubmit(e) {
    e.preventDefault();
    
    if (APP_STATE.isLoading) return;
    
    const submitButton = DOM_CACHE.suggestionForm.querySelector('button[type="submit"]');
    const formData = getFormData();
    
    // Validar dados
    const validation = validateFormData(formData);
    if (!validation.isValid) {
        showFeedback(validation.message, "danger");
        return;
    }
    
    // Mostrar loading
    setSubmitButtonState(submitButton, true);
    APP_STATE.isLoading = true;
    
    try {
        const suggestion = createSuggestionObject(formData);
        await window.db.collection("sugestoes").add(suggestion);
        
        showFeedback("Sua sugestão foi enviada e está aguardando aprovação. Obrigado pela contribuição!", "success");
        DOM_CACHE.suggestionForm.reset();
        clearFormValidation();
        
    } catch (error) {
        console.error("Erro ao enviar sugestão:", error);
        showFeedback("Erro ao enviar sugestão. Tente novamente.", "danger");
    } finally {
        setSubmitButtonState(submitButton, false);
        APP_STATE.isLoading = false;
    }
}

/**
 * Obtém dados do formulário
 */
function getFormData() {
    return {
        title: document.getElementById("prompt-title")?.value.trim() || '',
        comment: document.getElementById("prompt-comment")?.value.trim() || '',
        category: document.getElementById("prompt-category")?.value || '',
        text: document.getElementById("prompt-text")?.value.trim() || ''
    };
}

/**
 * Valida dados do formulário
 */
function validateFormData(data) {
    if (!data.title || !data.category || !data.text) {
        return { isValid: false, message: "Por favor, preencha todos os campos obrigatórios." };
    }
    
    if (data.title.length > CONFIG.MAX_TITLE_LENGTH) {
        return { isValid: false, message: `O título deve ter no máximo ${CONFIG.MAX_TITLE_LENGTH} caracteres.` };
    }
    
    if (data.text.length > CONFIG.MAX_TEXT_LENGTH) {
        return { isValid: false, message: `O texto deve ter no máximo ${CONFIG.MAX_TEXT_LENGTH} caracteres.` };
    }
    
    if (data.comment.length > CONFIG.MAX_COMMENT_LENGTH) {
        return { isValid: false, message: `O comentário deve ter no máximo ${CONFIG.MAX_COMMENT_LENGTH} caracteres.` };
    }
    
    return { isValid: true };
}

/**
 * Cria objeto de sugestão
 */
function createSuggestionObject(data) {
    return {
        title: data.title,
        comment: data.comment || "Sem comentário",
        category: data.category,
        text: data.text,
        status: "pending",
        date: firebase.firestore.FieldValue.serverTimestamp(),
        likes: 0,
        views: 0,
        author: generateAnonymousId() // ID anônimo para tracking
    };
}

/**
 * Gera ID anônimo para o autor
 */
function generateAnonymousId() {
    return 'anon_' + Math.random().toString(36).substr(2, 9);
}

/**
 * Define estado do botão de envio
 */
function setSubmitButtonState(button, isLoading) {
    if (!button) return;
    
    button.disabled = isLoading;
    button.innerHTML = isLoading 
        ? '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Enviando...'
        : 'Enviar Prompt';
}

/**
 * Limpa validação do formulário
 */
function clearFormValidation() {
    const fields = DOM_CACHE.suggestionForm.querySelectorAll('.form-control');
    fields.forEach(field => {
        field.classList.remove('is-valid', 'is-invalid');
    });
}

/**
 * Inicializa filtro de categorias
 */
function initCategoryFilter() {
    if (!DOM_CACHE.categoryFilter) return;

    DOM_CACHE.categoryFilter.addEventListener('change', debounce(() => {
        APP_STATE.currentCategory = DOM_CACHE.categoryFilter.value;
        loadApprovedPrompts();
    }, 300));
}

/**
 * Inicializa funcionalidade de busca
 */
function initSearchFunctionality() {
    const searchInput = document.getElementById('search-input');
    if (!searchInput) return;
    
    searchInput.addEventListener('input', debounce((e) => {
        const searchTerm = e.target.value.trim().toLowerCase();
        filterDisplayedPrompts(searchTerm);
    }, 300));
}

/**
 * Filtra prompts exibidos por termo de busca
 */
function filterDisplayedPrompts(searchTerm) {
    if (!DOM_CACHE.suggestionsList) return;
    
    const promptCards = DOM_CACHE.suggestionsList.querySelectorAll('.suggestion-item');
    
    promptCards.forEach(card => {
        const title = card.querySelector('h6')?.textContent.toLowerCase() || '';
        const text = card.querySelector('.prompt-text')?.textContent.toLowerCase() || '';
        const category = card.querySelector('.badge')?.textContent.toLowerCase() || '';
        
        const matches = !searchTerm || 
            title.includes(searchTerm) || 
            text.includes(searchTerm) || 
            category.includes(searchTerm);
        
        card.style.display = matches ? 'block' : 'none';
    });
}

/**
 * Carrega e exibe prompts aprovados
 */
async function loadApprovedPrompts() {
    if (!DOM_CACHE.suggestionsList) {
        console.error("Container de sugestões não encontrado!");
        return;
    }
    
    if (APP_STATE.isLoading) return;
    
    APP_STATE.isLoading = true;
    showLoadingIndicator(true);
    
    try {
        const query = buildQuery();
        const querySnapshot = await query.get();
        
        renderPrompts(querySnapshot);
        
    } catch (error) {
        console.error("Erro ao carregar prompts:", error);
        renderErrorState();
    } finally {
        showLoadingIndicator(false);
        APP_STATE.isLoading = false;
    }
}

/**
 * Constrói query do Firestore
 */
function buildQuery() {
    let query = window.db.collection("sugestoes")
        .where("status", "==", "approved")
        .orderBy("date", "desc")
        .limit(50); // Limitar para melhor performance
    
    if (APP_STATE.currentCategory !== 'all') {
        query = query.where("category", "==", APP_STATE.currentCategory);
    }
    
    return query;
}

/**
 * Renderiza prompts na interface
 */
function renderPrompts(querySnapshot) {
    DOM_CACHE.suggestionsList.innerHTML = "";
    DOM_CACHE.suggestionsList.setAttribute('id', 'suggestions-accordion');
    
    if (querySnapshot.empty) {
        renderEmptyState();
        return;
    }
    
    const fragment = document.createDocumentFragment();
    
    querySnapshot.forEach((doc) => {
        const promptElement = createPromptElement(doc);
        fragment.appendChild(promptElement);
    });
    
    DOM_CACHE.suggestionsList.appendChild(fragment);
    attachEventListeners();
}

/**
 * Cria elemento de prompt
 */
function createPromptElement(doc) {
    const data = doc.data();
    const formattedDate = formatDate(data.date);
    const uniqueId = doc.id;
    const userLiked = APP_STATE.likedPrompts.has(doc.id);
    
    const suggestionElement = document.createElement('div');
    suggestionElement.className = 'suggestion-item accordion-item';
    suggestionElement.innerHTML = generatePromptHTML(data, uniqueId, userLiked, doc.id);
    
    // Adicionar listener para views
    const collapseElement = suggestionElement.querySelector(`#prompt-${uniqueId}`);
    collapseElement.addEventListener('shown.bs.collapse', () => {
        incrementViews(doc.id);
    }, { once: true }); // Executar apenas uma vez
    
    return suggestionElement;
}

/**
 * Gera HTML do prompt
 */
function generatePromptHTML(data, uniqueId, userLiked, docId) {
    const likeButtonClass = userLiked ? 'btn-danger' : 'btn-outline-danger';
    const likeButtonDisabled = userLiked ? 'disabled' : '';
    
    return `
        <div class="card mb-2">
            <div class="card-header p-0">
                <button class="btn btn-link w-100 p-3 text-decoration-none accordion-toggle border-0" 
                        type="button" 
                        data-bs-toggle="collapse" 
                        data-bs-target="#prompt-${uniqueId}" 
                        aria-expanded="false" 
                        aria-controls="prompt-${uniqueId}">
                    <div class="d-flex justify-content-between align-items-center w-100">
                        <div class="text-start flex-grow-1">
                            <h6 class="mb-1 text-dark fw-bold">
                                <i class="fas fa-file-alt text-primary"></i>
                                ${escapeHtml(data.title || 'Sem título')}
                            </h6>
                        </div>
                        <div class="d-flex align-items-center gap-2">
                            <span class="badge bg-primary">${escapeHtml(data.category || 'Não categorizado')}</span>
                            <i class="fas fa-chevron-down accordion-arrow transition-all"></i>
                        </div>
                    </div>
                </button>
            </div>
            
            <div id="prompt-${uniqueId}" class="collapse" data-bs-parent="#suggestions-accordion">
                <div class="card-body">
                    <div class="mb-3">
                        <h6 class="text-primary mb-2">
                            <i class="fas fa-pen me-1"></i> Texto do Prompt:
                        </h6>
                        <div class="prompt-text bg-light p-3 rounded border" style="font-family: 'Courier New', monospace; font-size: 16
px; text-align: justify; white-space: pre-wrap;">
${escapeHtml(data.text || 'Sem conteúdo')}
                        </div>
                    </div>
                    ${data.comment && data.comment !== 'Sem comentário' ? `
                    <div class="mb-3">
                        <h6 class="text-info mb-2">
                            <i class="fas fa-comment me-1"></i> Comentário:
                        </h6>
                        <p class="card-text text-muted bg-info bg-opacity-10 p-3 rounded">
                            ${escapeHtml(data.comment)}
                        </p>
                    </div>
                    ` : ''}
                </div>
                <div class="card-footer d-flex justify-content-between align-items-center flex-wrap">
                    <div class="mb-2 mb-md-0">
                        <small class="text-muted">Publicado em ${data.date ? formatDate(data.date) : 'Data desconhecida'}</small>
                        <small class="ms-2 text-secondary">
                            <i class="fas fa-eye me-1"></i><span class="view-count">${data.views || 0}</span> visualizações
                        </small>
                    </div>
                    <div class="btn-group" role="group">
                        <button class="btn btn-sm ${likeButtonClass} like-btn" 
                            data-id="${docId}" title="Curtir" ${likeButtonDisabled}>
                            <i class="fas fa-heart"></i> 
                            <span class="like-count">${data.likes || 0}</span>
                        </button>
                        <button class="btn btn-sm btn-outline-primary copy-btn" 
                            data-id="${docId}" title="Copiar prompt">
                            <i class="fas fa-copy"></i> <span class="d-none d-md-inline">Copiar</span>
                        </button>
                        <button class="btn btn-sm btn-outline-secondary share-btn" 
                            data-id="${docId}" title="Compartilhar">
                            <i class="fas fa-share-alt"></i> <span class="d-none d-md-inline">Compartilhar</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

/**
 * Anexa event listeners aos elementos
 */
function attachEventListeners() {
    // Event delegation para melhor performance
    if (DOM_CACHE.suggestionsList) {
        DOM_CACHE.suggestionsList.addEventListener('click', handlePromptActions);
    }
    
    // Animação das setas do acordeão
    document.querySelectorAll('.accordion-toggle').forEach(toggle => {
        toggle.addEventListener('click', handleAccordionToggle);
    });
}

/**
 * Manipula ações dos prompts (delegação de eventos)
 */
function handlePromptActions(e) {
    const target = e.target.closest('button');
    if (!target) return;
    
    if (target.classList.contains('copy-btn')) {
        handleCopyPrompt(e);
    } else if (target.classList.contains('like-btn')) {
        handleLikePrompt(e);
    } else if (target.classList.contains('share-btn')) {
        handleSharePrompt(e);
    }
}

/**
 * Manipula toggle do acordeão
 */
function handleAccordionToggle() {
    const arrow = this.querySelector('.accordion-arrow');
    if (!arrow) return;
    
    setTimeout(() => {
        const isExpanded = this.getAttribute('aria-expanded') === 'true';
        arrow.style.transform = isExpanded ? 'rotate(180deg)' : 'rotate(0deg)';
    }, CONFIG.ARROW_ANIMATION_DELAY);
}

/**
 * Incrementa visualizações do prompt
 */
async function incrementViews(promptId) {
    try {
        await window.db.collection("sugestoes").doc(promptId).update({
            views: firebase.firestore.FieldValue.increment(1)
        });
        
        // Atualizar contador visual
        const viewCountElement = document.querySelector(`[data-id="${promptId}"]`)
            ?.closest('.card')
            ?.querySelector('.view-count');
        
        if (viewCountElement) {
            const currentViews = parseInt(viewCountElement.textContent) || 0;
            viewCountElement.textContent = currentViews + 1;
        }
    } catch (error) {
        console.log("Erro ao atualizar visualizações:", error);
    }
}

/**
 * Manipula cópia de prompts (versão otimizada)
 */
async function handleCopyPrompt(e) {
    e.preventDefault();
    
    const button = e.currentTarget;
    const card = button.closest('.card');
    
    if (!card) {
        showFeedback("Erro ao localizar o prompt.", "danger");
        return;
    }
    
    const promptElement = card.querySelector('.prompt-text');
    if (!promptElement) {
        showFeedback("Texto do prompt não encontrado.", "danger");
        return;
    }
    
    const textToCopy = promptElement.textContent.trim();
    
    try {
        // Tentar API moderna primeiro
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(textToCopy);
        } else {
            // Fallback para navegadores antigos
            await fallbackCopyText(textToCopy);
        }
        
        showCopySuccess(button);
        
    } catch (error) {
        console.error('Erro ao copiar:', error);
        showFeedback("Não foi possível copiar o texto. Tente novamente.", "danger");
    }
}

/**
 * Fallback para cópia em navegadores antigos
 */
function fallbackCopyText(text) {
    return new Promise((resolve, reject) => {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        textarea.style.top = '-9999px';
        
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        
        try {
            const successful = document.execCommand('copy');
            document.body.removeChild(textarea);
            
            if (successful) {
                resolve();
            } else {
                reject(new Error('execCommand failed'));
            }
        } catch (err) {
            document.body.removeChild(textarea);
            reject(err);
        }
    });
}

/**
 * Mostra feedback visual de cópia bem-sucedida
 */
function showCopySuccess(button) {
    const originalHTML = button.innerHTML;
    const originalClasses = button.className;
    
    button.innerHTML = '<i class="fas fa-check"></i> <span class="d-none d-md-inline">Copiado!</span>';
    button.className = button.className.replace('btn-outline-primary', 'btn-success');
    button.disabled = true;
    
    setTimeout(() => {
        button.innerHTML = originalHTML;
        button.className = originalClasses;
        button.disabled = false;
    }, CONFIG.BUTTON_RESTORE_DELAY);
}

/**
 * Manipula curtidas em prompts (versão otimizada)
 */
async function handleLikePrompt(e) {
    e.preventDefault();
    
    const likeButton = e.currentTarget;
    const promptId = likeButton.getAttribute('data-id');
    const likeCountElement = likeButton.querySelector('.like-count');
    
    if (!promptId || !likeCountElement) {
        showFeedback("Erro ao processar curtida.", "danger");
        return;
    }
    
    // Verificar se já curtiu
    if (APP_STATE.likedPrompts.has(promptId)) {
        showFeedback("Você já curtiu este prompt!", "warning");
        return;
    }
    
    // Desabilitar botão
    likeButton.disabled = true;
    
    try {
        // Atualizar no Firestore
        await window.db.collection("sugestoes").doc(promptId).update({
            likes: firebase.firestore.FieldValue.increment(1)
        });
        
        // Atualizar estado local
        APP_STATE.likedPrompts.add(promptId);
        saveAppState();
        
        // Atualizar interface
        updateLikeButton(likeButton, likeCountElement);
        showFeedback("Obrigado por curtir este prompt!", "success");
        
    } catch (error) {
        console.error('Erro ao curtir prompt:', error);
        showFeedback("Erro ao curtir. Tente novamente.", "danger");
        likeButton.disabled = false;
    }
}

/**
 * Atualiza botão de curtida
 */
function updateLikeButton(button, countElement) {
    const currentCount = parseInt(countElement.textContent) || 0;
    countElement.textContent = currentCount + 1;
    
    button.classList.remove('btn-outline-danger');
    button.classList.add('btn-danger');
    button.disabled = true;
}

/**
 * Manipula compartilhamento de prompts (versão otimizada)
 */
async function handleSharePrompt(e) {
    e.preventDefault();
    
    const button = e.currentTarget;
    const promptId = button.getAttribute('data-id');
    const card = button.closest('.card');
    
    if (!card || !promptId) {
        showFeedback("Erro ao compartilhar prompt.", "danger");
        return;
    }
    
    const titleElement = card.querySelector('h6');
    const title = titleElement?.textContent?.trim() || 'Prompt compartilhado';
    const shareUrl = `${window.location.origin}${window.location.pathname}#prompt-${promptId}`;
    
    try {
        if (navigator.share && /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
            // API nativa de compartilhamento (mobile)
            await navigator.share({
                title: title,
                text: 'Confira este prompt útil para IA:',
                url: shareUrl
            });
        } else {
            // Fallback: copiar link
            await navigator.clipboard.writeText(shareUrl);
            showFeedback("Link copiado para a área de transferência!", "success");
        }
    } catch (error) {
        console.error('Erro ao compartilhar:', error);
        
        // Fallback final
        try {
            await fallbackCopyText(shareUrl);
            showFeedback("Link copiado para a área de transferência!", "success");
        } catch (fallbackError) {
            showFeedback("Erro ao compartilhar. Tente novamente.", "danger");
        }
    }
}

/**
 * Renderiza estado vazio
 */
function renderEmptyState() {
    DOM_CACHE.suggestionsList.innerHTML = `
        <div class="text-center py-5">
            <i class="fas fa-info-circle fa-3x text-muted mb-3"></i>
            <h5 class="text-muted">Nenhum prompt encontrado</h5>
            <p class="text-muted">Seja o primeiro a contribuir com esta categoria!</p>
            <button class="btn btn-primary" onclick="document.getElementById('suggestion-form')?.scrollIntoView({behavior: 'smooth'})">
                <i class="fas fa-plus me-2"></i>Adicionar Prompt
            </button>
        </div>
    `;
}

/**
 * Renderiza estado de erro
 */
function renderErrorState() {
    DOM_CACHE.suggestionsList.innerHTML = `
        <div class="alert alert-danger text-center">
            <i class="fas fa-exclamation-triangle fa-2x mb-3"></i>
            <h5>Erro ao carregar prompts</h5>
            <p>Por favor, verifique sua conexão e tente novamente.</p>
            <button class="btn btn-outline-danger" onclick="loadApprovedPrompts()">
                <i class="fas fa-redo me-2"></i>Tentar Novamente
            </button>
        </div>
    `;
}

/**
 * Controla indicador de carregamento
 */
function showLoadingIndicator(show) {
    if (DOM_CACHE.loadingIndicator) {
        DOM_CACHE.loadingIndicator.style.display = show ? 'block' : 'none';
    }
}

/**
 * Manipula hash da URL
 */
function handleUrlHash() {
    if (!window.location.hash) return;
    
    const targetElement = document.querySelector(window.location.hash);
    if (targetElement) {
        setTimeout(() => {
            targetElement.scrollIntoView({ behavior: 'smooth' });
            
            // Se for um prompt, expandir automaticamente
            if (window.location.hash.startsWith('#prompt-')) {
                const collapseElement = targetElement;
                if (collapseElement && collapseElement.classList.contains('collapse')) {
                    const bsCollapse = new bootstrap.Collapse(collapseElement, { show: true });
                }
            }
        }, CONFIG.SCROLL_DELAY);
    }
}

/**
 * Adiciona listeners globais
 */
function addGlobalListeners() {
    // Listener para mudanças de hash
    window.addEventListener('hashchange', handleUrlHash);
    
    // Listener para visibilidade da página (pausar operações quando não visível)
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            // Página não está visível - pausar operações pesadas
            APP_STATE.isLoading = false;
        }
    });
    
    // Listener para erros globais
    window.addEventListener('error', (e) => {
        console.error('Erro global capturado:', e.error);
    });
}

/**
 * Exibe feedback ao usuário (versão otimizada)
 */
function showFeedback(message, type = "info") {
    // Remover alertas existentes
    const existingAlerts = document.querySelectorAll('.alert-feedback');
    existingAlerts.forEach(alert => alert.remove());
    
    const alertElement = document.createElement('div');
    alertElement.className = `alert alert-${type} alert-dismissible fade show alert-feedback`;
    alertElement.setAttribute('role', 'alert');
    alertElement.innerHTML = `
        <div class="d-flex align-items-center">
            <i class="fas fa-${getAlertIcon(type)} me-2"></i>
            <span>${escapeHtml(message)}</span>
        </div>
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Fechar"></button>
    `;
    
    // Inserir no container
    if (DOM_CACHE.container) {
        DOM_CACHE.container.insertBefore(alertElement, DOM_CACHE.container.firstChild);
    } else {
        document.body.insertBefore(alertElement, document.body.firstChild);
    }
    
    // Rolar para o topo suavemente
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Auto-remover após tempo configurado
    setTimeout(() => {
        if (alertElement.parentNode) {
            alertElement.classList.remove('show');
            setTimeout(() => {
                if (alertElement.parentNode) {
                    alertElement.remove();
                }
            }, 300);
        }
    }, CONFIG.FEEDBACK_DURATION);
}

/**
 * Retorna ícone apropriado para o tipo de alerta
 */
function getAlertIcon(type) {
    const icons = {
        'success': 'check-circle',
        'danger': 'exclamation-triangle',
        'warning': 'exclamation-circle',
        'info': 'info-circle'
    };
    return icons[type] || 'info-circle';
}

/**
 * Escapa HTML para prevenir XSS
 */
function escapeHtml(text) {
    if (typeof text !== 'string') return text;
    
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    
    return text.replace(/[&<>"']/g, (m) => map[m]);
}

/**
 * Formata data para exibição
 */
function formatDate(timestamp) {
    if (!timestamp) return 'Data desconhecida';
    
    try {
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return new Intl.DateTimeFormat('pt-BR', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        }).format(date);
    } catch (error) {
        console.error('Erro ao formatar data:', error);
        return 'Data inválida';
    }
}

/**
 * Função debounce para otimizar performance
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Função throttle para limitar execução
 */
function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * Utilitário para lazy loading de imagens (se houver)
 */
function initLazyLoading() {
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.classList.remove('lazy');
                    imageObserver.unobserve(img);
                }
            });
        });

        document.querySelectorAll('img[data-src]').forEach(img => {
            imageObserver.observe(img);
        });
    }
}

/**
 * Função para exportar prompts (funcionalidade adicional)
 */
function exportPrompts() {
    const prompts = [];
    document.querySelectorAll('.suggestion-item').forEach(item => {
        const title = item.querySelector('h6')?.textContent?.trim();
        const text = item.querySelector('.prompt-text')?.textContent?.trim();
        const category = item.querySelector('.badge')?.textContent?.trim();
        
        if (title && text) {
            prompts.push({ title, text, category });
        }
    });
    
    const dataStr = JSON.stringify(prompts, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `prompts_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    showFeedback('Prompts exportados com sucesso!', 'success');
}

/**
 * Função para estatísticas (funcionalidade adicional)
 */
function getStatistics() {
    const stats = {
        totalPrompts: document.querySelectorAll('.suggestion-item').length,
        totalLikes: [...document.querySelectorAll('.like-count')]
            .reduce((sum, el) => sum + (parseInt(el.textContent) || 0), 0),
        totalViews: [...document.querySelectorAll('.view-count')]
            .reduce((sum, el) => sum + (parseInt(el.textContent) || 0), 0),
        categories: {}
    };
    
    document.querySelectorAll('.badge').forEach(badge => {
        const category = badge.textContent.trim();
        stats.categories[category] = (stats.categories[category] || 0) + 1;
    });
    
    return stats;
}

/**
 * Função para modo offline (funcionalidade adicional)
 */
function handleOfflineMode() {
    if (!navigator.onLine) {
        showFeedback('Você está offline. Algumas funcionalidades podem não estar disponíveis.', 'warning');
        
        // Desabilitar funcionalidades que requerem conexão
        const onlineButtons = document.querySelectorAll('.like-btn, .share-btn');
        onlineButtons.forEach(btn => {
            btn.disabled = true;
            btn.title = 'Funcionalidade indisponível offline';
        });
    }
}

/**
 * Listeners para eventos de conectividade
 */
window.addEventListener('online', () => {
    showFeedback('Conexão restaurada!', 'success');
    location.reload(); // Recarregar para restaurar funcionalidades
});

window.addEventListener('offline', handleOfflineMode);

/**
 * Função para analytics simples (opcional)
 */
function trackEvent(eventName, data = {}) {
    // Implementar analytics se necessário
    console.log(`Event: ${eventName}`, data);
    
    // Exemplo de implementação com localStorage para analytics básicas
    const events = JSON.parse(localStorage.getItem('analytics_events') || '[]');
    events.push({
        event: eventName,
        data: data,
        timestamp: new Date().toISOString(),
        url: window.location.href
    });
    
    // Manter apenas os últimos 100 eventos
    if (events.length > 100) {
        events.splice(0, events.length - 100);
    }
    
    localStorage.setItem('analytics_events', JSON.stringify(events));
}

/**
 * Função para limpar cache local (manutenção)
 */
function clearLocalCache() {
    try {
        localStorage.removeItem('likedPrompts');
        localStorage.removeItem('analytics_events');
        APP_STATE.likedPrompts.clear();
        showFeedback('Cache local limpo com sucesso!', 'success');
        loadApprovedPrompts(); // Recarregar prompts
    } catch (error) {
        console.error('Erro ao limpar cache:', error);
        showFeedback('Erro ao limpar cache local.', 'danger');
    }
}

/**
 * Função para verificar atualizações (service worker)
 */
function checkForUpdates() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then(registration => {
            registration.update();
        });
    }
}

/**
 * Inicialização de funcionalidades adicionais
 */
function initAdditionalFeatures() {
    // Verificar modo offline
    handleOfflineMode();
    
    // Inicializar lazy loading se houver imagens
    initLazyLoading();
    
    // Verificar atualizações
    checkForUpdates();
    
    // Adicionar atalhos de teclado
    initKeyboardShortcuts();
}

/**
 * Inicializa atalhos de teclado
 */
function initKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + K para focar na busca
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            const searchInput = document.getElementById('search-input');
            if (searchInput) {
                searchInput.focus();
            }
        }
        
        // Esc para fechar modais/alertas
        if (e.key === 'Escape') {
            const alerts = document.querySelectorAll('.alert-feedback');
            alerts.forEach(alert => alert.remove());
        }
    });
}

/**
 * Função para modo escuro (se implementado no CSS)
 */
function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('darkMode', isDark);
    
    // Atualizar ícone do botão se existir
    const darkModeBtn = document.getElementById('dark-mode-toggle');
    if (darkModeBtn) {
        const icon = darkModeBtn.querySelector('i');
        if (icon) {
            icon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
        }
    }
}

/**
 * Carregar preferência de modo escuro
 */
function loadDarkModePreference() {
    const isDark = localStorage.getItem('darkMode') === 'true';
    if (isDark) {
        document.body.classList.add('dark-mode');
    }
}

// Executar funcionalidades adicionais após carregamento
document.addEventListener("DOMContentLoaded", () => {
    setTimeout(() => {
        initAdditionalFeatures();
        loadDarkModePreference();
    }, 1000);
});

// Expor funções úteis globalmente para debug/console
if (typeof window !== 'undefined') {
    window.SugestoesDebug = {
        getStatistics,
        exportPrompts,
        clearLocalCache,
        toggleDarkMode,
        trackEvent,
        APP_STATE,
        CONFIG
    };
}
