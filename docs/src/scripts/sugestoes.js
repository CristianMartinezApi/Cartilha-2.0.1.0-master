/**
 * Script para gerenciar a página de sugestões
 * Versão otimizada com melhorias de performance e manutenibilidade
 * Inclui sistema de avaliação por estrelas
 */

// Configurações globais
const CONFIG = {
    FEEDBACK_DURATION: 5000,
    BUTTON_RESTORE_DELAY: 2000,
    SCROLL_DELAY: 500,
    ARROW_ANIMATION_DELAY: 10,
    MAX_TITLE_LENGTH: 100,
    MAX_TEXT_LENGTH: 2000,
    MAX_COMMENT_LENGTH: 500,
    // ✅ Adicionar IAs suportadas
    SUPPORTED_AIS: [
        'ChatGPT (OpenAI)',
        'Claude (Anthropic)', 
        'Google Gemini',
        'Microsoft Copilot',
        'Perplexity AI',
        'Meta AI (Llama)',
        'Outras'
    ]
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

// ✅ Variáveis de estado para avaliações
let isRating = false;
const ratingTimeouts = new Map();
/**
 * Captura a conta institucional logada no navegador
 * VERSÃO CORRIGIDA - Prioriza Firebase Auth
 */
async function captureUserInfo() {
    let userName = '';
    let userEmail = '';
    let captureMethod = 'Não identificado';
    
    try {
        // ✅ MÉTODO 1: Firebase Auth (PRIORIDADE MÁXIMA)
        if (typeof firebase !== 'undefined' && firebase.auth) {
            const currentUser = firebase.auth().currentUser;
            if (currentUser && currentUser.email) {
                userEmail = currentUser.email;
                userName = currentUser.displayName || currentUser.email.split('@')[0];
                captureMethod = 'Firebase Auth (' + (currentUser.providerData[0]?.providerId || 'unknown') + ')';
                
                console.log('✅ Dados capturados via Firebase Auth:', {
                    email: userEmail,
                    name: userName,
                    provider: currentUser.providerData[0]?.providerId
                });
                
                // Se conseguiu via Firebase, usar esses dados
                return {
                    userName: userName || 'Usuário Firebase',
                    userEmail: userEmail,
                    timestamp: new Date().toISOString(),
                    localTime: new Date().toLocaleString('pt-BR'),
                    domain: window.location.hostname,
                    sessionId: Date.now().toString(36) + Math.random().toString(36).substr(2),
                    captureMethod: captureMethod,
                    isInstitutional: userEmail ? userEmail.includes('pge.sc.gov.br') : false,
                    firebaseUID: currentUser.uid,
                    photoURL: currentUser.photoURL || null
                };
            }
        }
        
        // ✅ MÉTODO 2: SugestoesAuth (SEGUNDA PRIORIDADE)
        if (typeof SugestoesAuth !== 'undefined') {
            try {
                const auth = await SugestoesAuth.checkAuthentication();
                if (auth.isAuthenticated && auth.profile) {
                    userEmail = auth.profile.email;
                    userName = auth.profile.displayName;
                    captureMethod = 'SugestoesAuth (' + auth.profile.authProvider + ')';
                    
                    return {
                        userName: userName || 'Usuário SugestoesAuth',
                        userEmail: userEmail,
                        timestamp: new Date().toISOString(),
                        localTime: new Date().toLocaleString('pt-BR'),
                        domain: window.location.hostname,
                        sessionId: Date.now().toString(36) + Math.random().toString(36).substr(2),
                        captureMethod: captureMethod,
                        isInstitutional: auth.profile.isInstitutional,
                        department: auth.profile.department,
                        role: auth.profile.role
                    };
                }
            } catch (error) {
                console.log('⚠️ Erro ao usar SugestoesAuth:', error);
            }
        }
        
        // ✅ MÉTODOS 3-6: Fallbacks antigos (mantidos como backup)
        // ... (resto do código original como fallback)
        
    } catch (error) {
        console.error('Erro geral ao capturar conta do navegador:', error);
    }
    
    // Fallback final
    return {
        userName: 'Usuário não identificado',
        userEmail: 'Email não identificado',
        timestamp: new Date().toISOString(),
        localTime: new Date().toLocaleString('pt-BR'),
        domain: window.location.hostname,
        sessionId: Date.now().toString(36) + Math.random().toString(36).substr(2),
        captureMethod: 'Fallback - Nenhum método funcionou',
        isInstitutional: false
    };
}


/**
 * ✅ Inicialização principal - Versão atualizada
 */
document.addEventListener("DOMContentLoaded", () => {
    console.log("🚀 Página de sugestões carregada");
    
    try {
        // Inicializar variáveis de estado
        isRating = false;
        ratingTimeouts.clear();
        
        initializeApp();
    } catch (error) {
        console.error("❌ Erro na inicialização:", error);
        showFeedback("Erro ao carregar a página. Recarregue para tentar novamente.", "danger");
    }
});

/**
 * ✅ Inicializa a aplicação - Versão melhorada
 */
function initializeApp() {
    console.log('🚀 Inicializando aplicação de sugestões...');
    
    // Cache elementos DOM
    cacheElements();
    
    // Carregar estado do localStorage
    loadAppState();
    
    // Inicializar componentes
    initForm();
    initCategoryFilter();
    initSearchFunctionality();
    
    // ✅ Inicializar sistema de estrelas
    initStarRatingSystem();
    
    // Carregar prompts
    loadApprovedPrompts();
    
    // Verificar hash na URL
    handleUrlHash();
    
    // Adicionar listeners globais
    addGlobalListeners();
    
    console.log('✅ Aplicação inicializada com sucesso!');
}

/**
 * ✅ Nova função para inicializar sistema de estrelas
 */
function initStarRatingSystem() {
    console.log('⭐ Inicializando sistema de avaliação por estrelas...');
    
    // Adicionar efeitos de hover
    addStarHoverEffects();
    
    // Limpar timeouts antigos se existirem
    ratingTimeouts.forEach(timeout => clearTimeout(timeout));
    ratingTimeouts.clear();
    
    // Resetar estado
    isRating = false;
    
    console.log('✅ Sistema de estrelas inicializado!');
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
 * ✅ Adiciona validação em tempo real ao formulário
 */
function addFormValidation() {
    const titleInput = document.getElementById("prompt-title");
    const textInput = document.getElementById("prompt-text");
    const commentInput = document.getElementById("prompt-comment");
    // ✅ Adicionar campo IA
    const aiSelect = document.getElementById("prompt-ai");
    const aiOtherInput = document.getElementById("prompt-ai-other");

    if (titleInput) {
        titleInput.addEventListener('input', () => validateField(titleInput, CONFIG.MAX_TITLE_LENGTH));
    }
    
    if (textInput) {
        textInput.addEventListener('input', () => validateField(textInput, CONFIG.MAX_TEXT_LENGTH));
    }
    
    if (commentInput) {
        commentInput.addEventListener('input', () => validateField(commentInput, CONFIG.MAX_COMMENT_LENGTH));
    }

    // ✅ Listener para mostrar/ocultar campo "Outras"
    if (aiSelect && aiOtherInput) {
        aiSelect.addEventListener('change', () => {
            const isOther = aiSelect.value === 'Outras';
            aiOtherInput.style.display = isOther ? 'block' : 'none';
            aiOtherInput.required = isOther;
            if (!isOther) {
                aiOtherInput.value = '';
            }
        });
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
        const suggestion = await createSuggestionObject(formData);
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
 * ✅ Obtém dados do formulário
 */
function getFormData() {
    const aiSelect = document.getElementById("prompt-ai");
    const aiOther = document.getElementById("prompt-ai-other");
    
    let aiUsed = aiSelect?.value || '';
    if (aiUsed === 'Outras' && aiOther?.value.trim()) {
        aiUsed = aiOther.value.trim();
    }

    return {
        title: document.getElementById("prompt-title")?.value.trim() || '',
        comment: document.getElementById("prompt-comment")?.value.trim() || '',
        category: document.getElementById("prompt-category")?.value || '',
        text: document.getElementById("prompt-text")?.value.trim() || '',
        aiUsed: aiUsed // ✅ Adicionar IA utilizada
    };
}

/**
 * ✅ Valida dados do formulário
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
    
    // ✅ Validação da IA (opcional, mas se preenchido deve ser válido)
    if (data.aiUsed === 'Outras' && !document.getElementById("prompt-ai-other")?.value.trim()) {
        return { isValid: false, message: "Por favor, especifique qual IA foi utilizada." };
    }
    
    return { isValid: true };
}

/**
 * ✅ Cria objeto de sugestão
 */
async function createSuggestionObject(formData) {
    const userInfo = await captureUserInfo();
    
    return {
        title: formData.title,
        category: formData.category,
        text: formData.text,
        comment: formData.comment || "",
        aiUsed: formData.aiUsed || "Não informado", // ✅ Adicionar IA
        status: "pending",
        date: firebase.firestore.FieldValue.serverTimestamp(),
        likes: 0,
        // ✅ Adicionar campos de avaliação
        averageRating: 0,
        totalRatings: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        userInfo: userInfo
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
 * ✅ Cria elemento de prompt - VERSÃO ATUALIZADA
 */
function createPromptElement(doc) {
    const data = doc.data();
    const formattedDate = formatDate(data.date);
    const uniqueId = doc.id;
    const userLiked = APP_STATE.likedPrompts.has(doc.id);
    
    const suggestionElement = document.createElement('div');
    suggestionElement.className = 'suggestion-item accordion-item';
    suggestionElement.innerHTML = generatePromptHTML(data, uniqueId, userLiked, doc.id);
    
    // ✅ Listener para views (existente)
    const collapseElement = suggestionElement.querySelector(`#prompt-${uniqueId}`);
    collapseElement.addEventListener('shown.bs.collapse', () => {
        incrementViews(doc.id);
        
        // ✅ NOVO: Carregar comentários quando prompt for expandido
        if (typeof CommentsSystem !== 'undefined') {
            // Aguardar um pouco para garantir que a interface foi renderizada
            setTimeout(() => {
                CommentsSystem.loadComments(doc.id);
            }, 300);
        }
    }, { once: true });
    
    return suggestionElement;
}

/**
 * ✅ Gera HTML do prompt - VERSÃO SEM BOTÃO DE CURTIDAS
 * Remove o botão de curtidas, mantém apenas copiar e compartilhar
 */
function generatePromptHTML(data, uniqueId, userLiked, docId) {
    // ✅ Verificar se usuário já avaliou
    const userRated = hasUserRated(docId);
    const averageRating = data.averageRating || 0;
    const totalRatings = data.totalRatings || 0;
    
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
                            <!-- ✅ Resumo das estrelas no header -->
                            <div class="d-flex align-items-center gap-2 mt-1">
                                <div class="stars-summary">
                                    ${generateStarsDisplay(averageRating)}
                                </div>
                                ${totalRatings > 0 ? 
                                    `<small class="text-muted">${averageRating.toFixed(1)} (${totalRatings})</small>` : 
                                    `<small class="text-muted">Sem avaliações</small>`
                                }
                            </div>
                        </div>
                        <div class="d-flex align-items-center gap-2">
                            <span class="badge bg-primary">${escapeHtml(data.category || 'Não categorizado')}</span>
                            ${data.aiUsed && data.aiUsed !== 'Não informado' ? 
                                `<span class="badge bg-secondary">${escapeHtml(data.aiUsed)}</span>` : ''}
                            <i class="fas fa-chevron-down accordion-arrow transition-all"></i>
                        </div>
                    </div>
                </button>
            </div>
            
            <div id="prompt-${uniqueId}" class="collapse" data-bs-parent="#suggestions-accordion">
                <div class="card-body">
                    <div class="alert alert-warning border-warning mb-3" role="alert">
                        <i class="fas fa-exclamation-triangle me-2"></i>
                        <strong>Importante:</strong> Sempre valide e adapte este prompt às suas necessidades específicas antes de usar. 
                        Verifique se o conteúdo está adequado ao seu contexto e objetivos.
                    </div>

                    <div class="mb-3">
                        <h6 class="text-primary mb-2">
                            <i class="fas fa-pen me-1"></i> Texto do Prompt:
                        </h6>
                        <div class="prompt-text bg-light p-3 rounded border" style="font-family: 'Courier New', monospace; font-size: 16px; text-align: justify; white-space: pre-wrap;">
${escapeHtml(data.text || 'Sem conteúdo')}
                        </div>
                    </div>
                    
                    ${data.comment && data.comment !== 'Sem comentário' ? `
                    <div class="mb-3">
                        <h6 class="text-info mb-2">
                            <i class="fas fa-comment me-1"></i> Comentário do Autor:
                        </h6>
                        <p class="card-text text-muted bg-info bg-opacity-10 p-3 rounded">
                            ${escapeHtml(data.comment)}
                        </p>
                    </div>
                    ` : ''}
                </div>
                
                <div class="card-footer">
                    <!-- ✅ Primeira linha: Informações do prompt -->
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <div class="d-flex align-items-center gap-3 flex-wrap">
                            <small class="text-muted">
                                <i class="fas fa-calendar-alt me-1"></i>
                                ${data.date ? formatDate(data.date) : 'Data desconhecida'}
                            </small>
                            <small class="text-secondary">
                                <i class="fas fa-eye me-1"></i>
                                <span class="view-count">${data.views || 0}</span> visualizações
                            </small>
                            ${data.aiUsed && data.aiUsed !== 'Não informado' ? 
                                `<small class="text-info">
                                    <i class="fas fa-robot me-1"></i>
                                    ${escapeHtml(data.aiUsed)}
                                </small>` : ''
                            }
                        </div>
                        
                        <!-- ✅ Avaliação interativa com estrelas clicáveis -->
                        <div class="rating-display d-flex align-items-center">
                            <div class="stars-container me-2" data-prompt-id="${docId}" data-user-rated="${userRated}">
                                ${generateStarsHTML(averageRating, userRated, docId)}
                            </div>
                            ${totalRatings > 0 ? 
                                `<small class="text-muted">${averageRating.toFixed(1)} (${totalRatings})</small>` : 
                                `<small class="text-muted">Avalie este prompt</small>`
                            }
                        </div>
                    </div>
                    
                    <!-- ✅ Segunda linha: Botões de ação (SEM CURTIDAS) -->
                    <div class="d-flex justify-content-end">
                        <div class="btn-group" role="group">
                            <button class="btn btn-sm btn-outline-primary copy-btn" 
                                data-id="${docId}" title="Copiar prompt">
                                <i class="fas fa-copy"></i> 
                                <span class="d-none d-md-inline ms-1">Copiar</span>
                            </button>
                            <button class="btn btn-sm btn-outline-secondary share-btn" 
                                data-id="${docId}" title="Compartilhar">
                                <i class="fas fa-share-alt"></i> 
                                <span class="d-none d-md-inline ms-1">Compartilhar</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- ✅ COMENTÁRIOS CORRIGIDOS -->
<div class="comments-section" data-prompt-id="${docId}">
    <div class="comments-header">
        <button class="toggle-comments"
                type="button"
                data-prompt-id="${docId}"
                data-bs-toggle="collapse"
                data-bs-target="#comments-${docId}"
                aria-expanded="false"
                aria-controls="comments-${docId}">
            <i class="fas fa-comments me-2"></i>
            <span class="comments-title">Comentários</span>
            <span class="comments-count">(0)</span>
            <i class="fas fa-chevron-down ms-auto"></i>
        </button>
    </div>
    
    <div id="comments-${docId}" class="collapse comments-content">
        <div class="comments-list">
            <div class="no-comments text-center">
                <i class="fas fa-comment-slash"></i>
                <p class="mb-0">Nenhum comentário ainda.</p>
                <small class="text-muted">Seja o primeiro a comentar!</small>
            </div>
        </div>
        
        <div class="comment-form">
            <div class="comment-form-header">
                <h6 class="mb-2">
                    <i class="fas fa-plus-circle me-1"></i>
                    Adicionar Comentário
                </h6>
            </div>
            
            <div class="comment-form-body">
                <textarea class="comment-input"
                          placeholder="Compartilhe sua experiência com este prompt, dicas de uso ou sugestões de melhoria..."
                          maxlength="500"
                          rows="3"></textarea>
                <div class="comment-form-footer">
                    <small class="char-counter text-muted">0/500</small>
                    <button class="submit-comment" data-prompt-id="${docId}">
                        <i class="fas fa-paper-plane me-1"></i>
                        Comentar
                    </button>
                </div>
            </div>
        </div>
    </div>
</div>

    `;
}



/**
 * ✅ Fallback para seção de comentários (caso CommentsUI não esteja carregado)
 */
function generateFallbackCommentsSection(promptId, commentCount = 0) {
    return `
        <div class="comments-section-fallback mt-3 pt-3 border-top" data-prompt-id="${promptId}">
            <div class="d-flex justify-content-between align-items-center">
                <small class="text-muted">
                    <i class="fas fa-comments"></i> 
                    ${commentCount} comentário${commentCount !== 1 ? 's' : ''}
                </small>
                <small class="text-muted">
                    Sistema de comentários carregando...
                </small>
            </div>
        </div>
    `;
}

/**
 * ✅ Gera display de estrelas apenas para visualização (header)
 */
function generateStarsDisplay(rating) {
    let starsHtml = '';
    for (let i = 1; i <= 5; i++) {
        if (i <= Math.floor(rating)) {
            starsHtml += '<i class="fas fa-star text-warning" style="font-size: 0.8rem;"></i>';
        } else if (i - 0.5 <= rating) {
            starsHtml += '<i class="fas fa-star-half-alt text-warning" style="font-size: 0.8rem;"></i>';
        } else {
            starsHtml += '<i class="far fa-star text-warning" style="font-size: 0.8rem;"></i>';
        }
    }
    return starsHtml;
}


/** 
 * ✅ Gera HTML das estrelas - Versão melhorada com layout vertical 
 */
function generateStarsHTML(averageRating, userRated, promptId) {
    let starsHtml = '';
    
    // Container principal com layout vertical (removendo qualquer estrutura horizontal)
    starsHtml += '<div class="rating-section">';
    starsHtml += '<div class="rating-container">';
    
    // Container das estrelas (apenas as estrelas, sem texto ao lado)
    starsHtml += '<div class="stars-container" data-user-rated="' + userRated + '">';
    
    for (let i = 1; i <= 5; i++) {
        let starClass = 'far fa-star';
        let starStyle = userRated ? 'cursor: default;' : 'cursor: pointer;';
        
        // Determinar o tipo de estrela baseado na média
        if (i <= Math.floor(averageRating)) {
            starClass = 'fas fa-star text-warning';
        } else if (i - 0.5 <= averageRating) {
            starClass = 'fas fa-star-half-alt text-warning';
        } else {
            starClass = 'far fa-star text-warning';
        }
        
        // Se o usuário não avaliou, as estrelas são clicáveis
        const clickable = !userRated ? `data-rating="${i}" data-prompt-id="${promptId}"` : '';
        const hoverClass = !userRated ? 'star-clickable' : '';
        
        starsHtml += `<i class="${starClass} ${hoverClass}"
                        ${clickable}
                        style="${starStyle}"
                        title="${userRated ? `Avaliação: ${averageRating.toFixed(1)}` : `Avaliar com ${i} estrela${i > 1 ? 's' : ''}`}"></i>`;
    }
    
    starsHtml += '</div>'; // Fecha stars-container
    
    // Container do texto de avaliação (separado, abaixo das estrelas)
    starsHtml += '<div class="rating-info">';
    starsHtml += `<div class="rating-text">${averageRating.toFixed(1)}</div>`;
    starsHtml += `<div class="rating-status">${userRated ? 'Você já avaliou' : 'Clique para avaliar'}</div>`;
    starsHtml += '</div>'; // Fecha rating-info
    
   
    return starsHtml;
}


/**
 * ✅ Verifica se usuário já avaliou um prompt
 */
function hasUserRated(promptId) {
    const ratedPrompts = JSON.parse(localStorage.getItem('ratedPrompts') || '[]');
    return ratedPrompts.includes(promptId);
}

/**
 * ✅ Marca prompt como avaliado pelo usuário
 */
function markAsRated(promptId) {
    const ratedPrompts = JSON.parse(localStorage.getItem('ratedPrompts') || '[]');
    if (!ratedPrompts.includes(promptId)) {
        ratedPrompts.push(promptId);
        localStorage.setItem('ratedPrompts', JSON.stringify(ratedPrompts));
    }
}

/**
 * ✅ Adiciona efeitos de hover nas estrelas
 */
function addStarHoverEffects() {
    document.addEventListener('mouseover', (e) => {
        if (e.target.classList.contains('star-clickable')) {
            const star = e.target;
            const container = star.parentElement;
            const rating = parseInt(star.getAttribute('data-rating'));
            
            // Destacar estrelas até a posição do hover
            const stars = container.querySelectorAll('.star-clickable');
            stars.forEach((s, index) => {
                if (index < rating) {
                    s.classList.remove('far');
                    s.classList.add('fas');
                } else {
                    s.classList.remove('fas');
                    s.classList.add('far');
                }
            });
        }
    });
    
    document.addEventListener('mouseout', (e) => {
        if (e.target.classList.contains('star-clickable')) {
            const container = e.target.parentElement;
            const stars = container.querySelectorAll('.star-clickable');
            
            // Resetar para estado padrão baseado na avaliação atual
            const promptId = container.getAttribute('data-prompt-id');
            resetStarsToCurrentRating(container, promptId);
        }
    });
}

/**
 * ✅ Reseta estrelas para avaliação atual
 */
function resetStarsToCurrentRating(container, promptId) {
    const stars = container.querySelectorAll('.star-clickable');
    
    // Buscar avaliação atual do prompt
    const ratingText = container.parentElement.querySelector('small.text-muted');
    let currentRating = 0;
    
    if (ratingText) {
        const match = ratingText.textContent.match(/^([\d.]+)/);
        if (match) {
            currentRating = parseFloat(match[1]);
        }
    }
    
    // Aplicar avaliação atual
    stars.forEach((star, index) => {
        const position = index + 1;
        
        if (position <= Math.floor(currentRating)) {
            star.classList.remove('far');
            star.classList.add('fas');
        } else if (position - 0.5 <= currentRating) {
            star.classList.remove('far', 'fas');
            star.classList.add('fas', 'fa-star-half-alt');
        } else {
            star.classList.remove('fas');
            star.classList.add('far');
        }
    });
}

/**
 * ✅ Manipula avaliação com estrelas - VERSÃO CORRIGIDA
 */
async function handleStarRating(e) {
    e.preventDefault();
    e.stopPropagation();
    
    // Verificar se já está processando uma avaliação
    if (isRating) {
        console.log('⏳ Avaliação em andamento, aguarde...');
        return;
    }
    
    const star = e.target;
    
    // Verificar se é uma estrela clicável
    if (!star.classList.contains('star-clickable')) {
        return;
    }
    
    const rating = parseInt(star.getAttribute('data-rating'));
    const promptId = star.getAttribute('data-prompt-id'); // ← CORREÇÃO AQUI
    const starsContainer = star.parentElement;
    
    if (!promptId || !rating || hasUserRated(promptId)) {
        console.log('❌ Avaliação inválida ou usuário já avaliou');
        return;
    }
    
    console.log(`⭐ Iniciando avaliação: ${rating} estrelas para prompt ${promptId}`);
    
    // Marcar como processando
    isRating = true;
    
    try {
        // Feedback visual imediato
        updateStarsAfterRating(starsContainer, rating);
        
        // Salvar no Firestore
        await saveRating(promptId, rating);
        
        // Marcar como avaliado
        markAsRated(promptId);
        
        // Atualizar interface
        await updatePromptRatingDisplay(promptId, rating);
        
        showFeedback("⭐ Obrigado pela sua avaliação!", "success");
        
        console.log(`✅ Avaliação salva com sucesso: ${rating} estrelas`);
        
    } catch (error) {
        console.error('❌ Erro ao salvar avaliação:', error);
        showFeedback("Erro ao salvar avaliação. Tente novamente.", "danger");
        
        // Reverter mudanças visuais em caso de erro
        resetStarsToCurrentRating(starsContainer, promptId);
    } finally {
        // Liberar processamento após um pequeno delay
        setTimeout(() => {
            isRating = false;
        }, 1000);
    }
}


/**
 * ✅ Atualiza estrelas após avaliação
 */
function updateStarsAfterRating(container, userRating) {
    const stars = container.querySelectorAll('i');
    
    stars.forEach((star, index) => {
        const position = index + 1;
        
        // Remover classes antigas
        star.className = '';
        
        // Adicionar novas classes baseadas na avaliação do usuário
        if (position <= userRating) {
            star.className = 'fas fa-star text-warning';
        } else {
            star.className = 'far fa-star text-warning';
        }
        
        // Remover interatividade
        star.style.cursor = 'default';
        star.classList.remove('star-clickable');
        star.removeAttribute('data-rating');
        star.title = `Sua avaliação: ${userRating} estrela${userRating > 1 ? 's' : ''}`;
    });
    
    // Marcar container como avaliado
    container.setAttribute('data-user-rated', 'true');
}

/**
 * ✅ Salva avaliação no Firestore
 */
async function saveRating(promptId, rating) {
    const userInfo = await captureUserInfo();
    
    try {
        // Salvar avaliação individual
        await window.db.collection("prompt_ratings").add({
            promptId: promptId,
            rating: rating,
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            userInfo: userInfo,
            sessionId: userInfo.sessionId
        });
        
        // Atualizar estatísticas do prompt
        const promptRef = window.db.collection("sugestoes").doc(promptId);
        
        await window.db.runTransaction(async (transaction) => {
            const promptDoc = await transaction.get(promptRef);
            
            if (!promptDoc.exists) {
                throw new Error("Prompt não encontrado");
            }
            
            const data = promptDoc.data();
            const currentTotal = data.totalRatings || 0;
            const currentAverage = data.averageRating || 0;
            const currentDistribution = data.ratingDistribution || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
            
            // Calcular nova média
            const newTotal = currentTotal + 1;
            const newAverage = ((currentAverage * currentTotal) + rating) / newTotal;
            
            // Atualizar distribuição
            const newDistribution = { ...currentDistribution };
            newDistribution[rating] = (newDistribution[rating] || 0) + 1;
            
            transaction.update(promptRef, {
                totalRatings: newTotal,
                averageRating: Math.round(newAverage * 10) / 10, // Arredondar para 1 casa decimal
                ratingDistribution: newDistribution,
                lastRated: firebase.firestore.FieldValue.serverTimestamp()
            });
        });
        
    } catch (error) {
        console.error('Erro ao salvar avaliação:', error);
        throw error;
    }
}
/**
 * ✅ Atualiza display de avaliação - Versão completamente corrigida
 */
async function updatePromptRatingDisplay(promptId, userRating) {
    try {
        const promptDoc = await window.db.collection("sugestoes").doc(promptId).get();
        
        if (!promptDoc.exists) return;
        
        const data = promptDoc.data();
        const averageRating = data.averageRating || 0;
        const totalRatings = data.totalRatings || 0;
        
        // Encontrar elementos específicos
        const starsContainer = document.querySelector(`[data-prompt-id="${promptId}"]`);
        if (!starsContainer) return;
        
        const ratingSection = starsContainer.closest('.rating-section');
        if (!ratingSection) return;
        
        // ✅ Buscar elementos com classes específicas
        const ratingInfo = ratingSection.querySelector('.rating-info');
        const ratingStatus = ratingSection.querySelector('.rating-status');
        
        // ✅ Atualizar apenas o texto de informação da avaliação
        if (ratingInfo) {
            ratingInfo.textContent = totalRatings > 0 ? 
                `${averageRating.toFixed(1)} (${totalRatings} avaliação${totalRatings !== 1 ? 'ões' : ''})` : 
                'Seja o primeiro a avaliar';
        }
        
        // ✅ Atualizar apenas o status
        if (ratingStatus) {
            ratingStatus.className = 'rating-status text-success';
            ratingStatus.innerHTML = '<i class="fas fa-check-circle me-1"></i>Você já avaliou';
        }
        
    } catch (error) {
        console.error('Erro ao atualizar display de avaliação:', error);
    }
}


/**
 * ✅ Anexa event listeners aos elementos
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
    
    console.log('✅ Event listeners anexados com sucesso!');
}

/**
 * ✅ Manipula ações dos prompts (delegação de eventos)
 */
function handlePromptActions(e) {
    const target = e.target.closest('button') || e.target;
    
    if (target.classList.contains('copy-btn')) {
        handleCopyPrompt(e);
    } else if (target.classList.contains('like-btn')) {
        handleLikePrompt(e);
    } else if (target.classList.contains('share-btn')) {
        handleSharePrompt(e);
    } else if (target.classList.contains('star-clickable') || target.hasAttribute('data-rating')) {
        // ✅ Adicionar handler para estrelas
        handleStarRating(e);
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
 * ✅ Versão alternativa - Salva avaliação no próprio documento do prompt
 */
async function saveRating(promptId, rating) {
    try {
        const userInfo = await captureUserInfo();
        const sessionId = userInfo.sessionId;
        
        console.log('📝 Salvando avaliação no documento do prompt:', { promptId, rating });
        
        const promptRef = window.db.collection("sugestoes").doc(promptId);
        
        await window.db.runTransaction(async (transaction) => {
            const promptDoc = await transaction.get(promptRef);
            
            if (!promptDoc.exists) {
                throw new Error("Prompt não encontrado");
            }
            
            const data = promptDoc.data();
            const currentTotal = data.totalRatings || 0;
            const currentAverage = data.averageRating || 0;
            const currentDistribution = data.ratingDistribution || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
            const userRatings = data.userRatings || {};
            
            // Verificar se o usuário já avaliou
            if (userRatings[sessionId]) {
                throw new Error("Usuário já avaliou este prompt");
            }
            
            // Calcular nova média
            const newTotal = currentTotal + 1;
            const newAverage = ((currentAverage * currentTotal) + rating) / newTotal;
            
            // Atualizar distribuição
            const newDistribution = { ...currentDistribution };
            newDistribution[rating] = (newDistribution[rating] || 0) + 1;
            
            // Adicionar avaliação do usuário
            const newUserRatings = { ...userRatings };
            newUserRatings[sessionId] = {
                rating: rating,
                timestamp: new Date().toISOString(),
                userInfo: userInfo
            };
            
            transaction.update(promptRef, {
                totalRatings: newTotal,
                averageRating: Math.round(newAverage * 10) / 10,
                ratingDistribution: newDistribution,
                userRatings: newUserRatings,
                lastRated: firebase.firestore.FieldValue.serverTimestamp()
            });
        });
        
        console.log('✅ Avaliação salva com sucesso!');
        
    } catch (error) {
        console.error('❌ Erro detalhado ao salvar avaliação:', error);
        throw error;
    }
}

/**
 * ✅ Verificar se usuário já avaliou (versão melhorada)
 */
async function hasUserRatedOnServer(promptId) {
    try {
        const userInfo = await captureUserInfo();
        const sessionId = userInfo.sessionId;
        
        const promptDoc = await window.db.collection("sugestoes").doc(promptId).get();
        
        if (!promptDoc.exists) return false;
        
        const data = promptDoc.data();
        const userRatings = data.userRatings || {};
        
        return !!userRatings[sessionId];
        
    } catch (error) {
        console.error('Erro ao verificar avaliação no servidor:', error);
        return false;
    }
}

/**
 * ✅ Atualizar função de verificação local
 */
function hasUserRated(promptId) {
    const ratedPrompts = JSON.parse(localStorage.getItem('ratedPrompts') || '[]');
    return ratedPrompts.includes(promptId);
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
 * ✅ Renderiza estado vazio - Versão simples
 */
function renderEmptyState() {
    DOM_CACHE.suggestionsList.innerHTML = `
        <div class="text-center py-5">
            <i class="fas fa-info-circle fa-3x text-muted mb-3"></i>
            <h5 class="text-muted">Nenhum prompt encontrado</h5>
            <p class="text-muted">Seja o primeiro a contribuir com esta categoria!</p>
            <button class="btn btn-primary" onclick="scrollToFormSimple()">
                <i class="fas fa-plus me-2"></i>Adicionar Prompt
            </button>
        </div>
    `;
}

/**
 * ✅ Função simples para scroll ao formulário
 */
function scrollToFormSimple() {
    

    // Tentar encontrar e focar no formulário
    setTimeout(() => {
        const form = document.querySelector('#suggestion-form, .suggestion-form, form');
        if (form) {
            form.scrollIntoView({ behavior: 'smooth' });
            const firstInput = form.querySelector('input, textarea');
            if (firstInput) {
                firstInput.focus();
            }
        }
    }, 1000);
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
 * ✅ Função para obter estatísticas de avaliações
 */
async function getRatingStatistics(promptId) {
    try {
        const ratingsSnapshot = await window.db.collection("prompt_ratings")
            .where("promptId", "==", promptId)
            .get();
        
        const ratings = [];
        ratingsSnapshot.forEach(doc => {
            ratings.push(doc.data().rating);
        });
        
        if (ratings.length === 0) {
            return {
                average: 0,
                total: 0,
                distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
            };
        }
        
        const average = ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
        const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        
        ratings.forEach(rating => {
            distribution[rating]++;
        });
        
        return {
            average: Math.round(average * 10) / 10,
            total: ratings.length,
            distribution: distribution
        };
        
    } catch (error) {
        console.error('Erro ao obter estatísticas de avaliação:', error);
        return {
            average: 0,
            total: 0,
            distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
        };
    }
}

/**
 * ✅ Função para limpar avaliações do localStorage (manutenção)
 */
function clearRatingCache() {
    try {
        localStorage.removeItem('ratedPrompts');
        showFeedback('Cache de avaliações limpo com sucesso!', 'success');
        loadApprovedPrompts(); // Recarregar para mostrar inputs de avaliação novamente
    } catch (error) {
        console.error('Erro ao limpar cache de avaliações:', error);
        showFeedback('Erro ao limpar cache de avaliações.', 'danger');
    }
}

/**
 * ✅ Função para exportar estatísticas de avaliações
 */
async function exportRatingStatistics() {
    try {
        const ratingsSnapshot = await window.db.collection("prompt_ratings").get();
        const statistics = [];
        
        ratingsSnapshot.forEach(doc => {
            const data = doc.data();
            statistics.push({
                promptId: data.promptId,
                rating: data.rating,
                timestamp: data.timestamp?.toDate?.()?.toISOString() || 'N/A',
                userInfo: {
                    domain: data.userInfo?.domain || 'N/A',
                    isInstitutional: data.userInfo?.isInstitutional || false
                }
            });
        });
        
        const dataStr = JSON.stringify(statistics, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `rating_statistics_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        showFeedback('Estatísticas de avaliações exportadas com sucesso!', 'success');
        
    } catch (error) {
        console.error('Erro ao exportar estatísticas:', error);
        showFeedback('Erro ao exportar estatísticas de avaliações.', 'danger');
    }
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
        const category = item.querySelector('.badge.bg-primary')?.textContent?.trim();
        const aiUsed = item.querySelector('.badge.bg-secondary')?.textContent?.trim();
        
        if (title && text) {
            prompts.push({ 
                title, 
                text, 
                category: category || 'Não categorizado',
                aiUsed: aiUsed || 'Não informado'
            });
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
 * ✅ Função para estatísticas - Versão atualizada
 */
function getStatistics() {
    const stats = {
        totalPrompts: document.querySelectorAll('.suggestion-item').length,
        totalLikes: [...document.querySelectorAll('.like-count')]
            .reduce((sum, el) => sum + (parseInt(el.textContent) || 0), 0),
        totalViews: [...document.querySelectorAll('.view-count')]
            .reduce((sum, el) => sum + (parseInt(el.textContent) || 0), 0),
        // ✅ Adicionar estatísticas de avaliações
        totalRatings: 0,
        averageRating: 0,
        categories: {},
        // ✅ Adicionar estatísticas de IAs
        aiUsage: {}
    };
    
    // Calcular estatísticas de avaliações
    const ratingElements = [...document.querySelectorAll('.rating-section small.text-muted')];
    const validRatings = [];
    let totalRatingsCount = 0;
    
    ratingElements.forEach(el => {
        const text = el.textContent;
        const ratingMatch = text.match(/^([\d.]+)/);
        const countMatch = text.match(/\((\d+) avaliação/);
        
        if (ratingMatch && countMatch) {
            const rating = parseFloat(ratingMatch[1]);
            const count = parseInt(countMatch[1]);
            
            if (rating > 0 && count > 0) {
                validRatings.push({ rating, count });
                totalRatingsCount += count;
            }
        }
    });
    
    if (validRatings.length > 0) {
        // Calcular média ponderada
        const weightedSum = validRatings.reduce((sum, item) => sum + (item.rating * item.count), 0);
        stats.averageRating = Math.round((weightedSum / totalRatingsCount) * 10) / 10;
        stats.totalRatings = totalRatingsCount;
    }
    
    // Contar categorias
    document.querySelectorAll('.badge.bg-primary').forEach(badge => {
        const category = badge.textContent.trim();
        stats.categories[category] = (stats.categories[category] || 0) + 1;
    });
    
    // ✅ Contar uso de IAs
    document.querySelectorAll('.badge.bg-secondary').forEach(badge => {
        const ai = badge.textContent.trim();
        stats.aiUsage[ai] = (stats.aiUsage[ai] || 0) + 1;
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
        const onlineButtons = document.querySelectorAll('.like-btn, .share-btn, .star-clickable');
        onlineButtons.forEach(btn => {
            btn.disabled = true;
            btn.title = 'Funcionalidade indisponível offline';
            btn.style.cursor = 'not-allowed';
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
        localStorage.removeItem('ratedPrompts'); // ✅ Adicionar cache de avaliações
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
 * ✅ Inicialização de funcionalidades adicionais
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
    
    // ✅ Verificar integridade do sistema de avaliações
    validateRatingSystem();
}

/**
 * ✅ Valida sistema de avaliações
 */
function validateRatingSystem() {
    console.log('🔍 Validando sistema de avaliações...');
    
    // Verificar se localStorage está funcionando
    try {
        const testKey = 'rating_test_' + Date.now();
        localStorage.setItem(testKey, 'test');
        localStorage.removeItem(testKey);
        console.log('✅ LocalStorage funcionando corretamente');
    } catch (error) {
        console.warn('⚠️ Problema com localStorage:', error);
        showFeedback('Aviso: Algumas funcionalidades podem não funcionar corretamente.', 'warning');
    }
    
    // Verificar se Firebase está disponível
    if (typeof window.db === 'undefined') {
        console.error('❌ Firebase não está disponível');
        showFeedback('Erro: Sistema de avaliações indisponível.', 'danger');
    } else {
        console.log('✅ Firebase disponível');
    }
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
        
        // ✅ Tecla R para recarregar prompts
        if (e.key === 'r' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            loadApprovedPrompts();
            showFeedback('Prompts recarregados!', 'info');
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

/**
 * ✅ Função para debug do sistema de avaliações
 */
function debugRatingSystem() {
    console.log('🐛 Debug do Sistema de Avaliações:');
    console.log('- Estado isRating:', isRating);
    console.log('- Timeouts ativos:', ratingTimeouts.size);
    console.log('- Prompts avaliados:', JSON.parse(localStorage.getItem('ratedPrompts') || '[]'));
    console.log('- Estrelas clicáveis na página:', document.querySelectorAll('.star-clickable').length);
    
    // Verificar se há conflitos de event listeners
    const starsContainers = document.querySelectorAll('.stars-container');
    console.log('- Containers de estrelas:', starsContainers.length);
    
    starsContainers.forEach((container, index) => {
        const promptId = container.getAttribute('data-prompt-id');
        const userRated = container.getAttribute('data-user-rated');
        console.log(`  Container ${index + 1}: ID=${promptId}, Avaliado=${userRated}`);
    });
}

/**
 * ✅ Função para resetar sistema de avaliações (emergência)
 */
function resetRatingSystem() {
    console.log('🔄 Resetando sistema de avaliações...');
    
    // Limpar estado
    isRating = false;
    ratingTimeouts.forEach(timeout => clearTimeout(timeout));
    ratingTimeouts.clear();
    
    // Limpar cache local
    localStorage.removeItem('ratedPrompts');
    
    // Recarregar prompts
    loadApprovedPrompts();
    
    showFeedback('Sistema de avaliações resetado!', 'info');
}

// ✅ Executar funcionalidades adicionais após carregamento
document.addEventListener("DOMContentLoaded", () => {
    setTimeout(() => {
        initAdditionalFeatures();
        loadDarkModePreference();
    }, 1000);
});

// ✅ Expor funções úteis globalmente para debug/console - Versão atualizada
if (typeof window !== 'undefined') {
    window.SugestoesDebug = {
        // Estatísticas
        getStatistics,
        exportPrompts,
        exportRatingStatistics,
        getRatingStatistics,
        
        // Cache e limpeza
        clearLocalCache,
        clearRatingCache,
        
        // Sistema de avaliações
        hasUserRated,
        debugRatingSystem,
        resetRatingSystem,
        
        // Funcionalidades gerais
        toggleDarkMode,
        trackEvent,
        
        // Estado da aplicação
        APP_STATE,
        CONFIG,
        
        // Estado do sistema de avaliações
        get isRating() { return isRating; },
        get ratingTimeouts() { return ratingTimeouts.size; }
    };
    
    console.log('🎯 SugestoesDebug disponível no console!');
    console.log('💡 Use SugestoesDebug.debugRatingSystem() para debug do sistema de avaliações');
}

/**
 * ✅ Listener para cleanup ao sair da página
 */
window.addEventListener('beforeunload', () => {
    // Limpar timeouts pendentes
    ratingTimeouts.forEach(timeout => clearTimeout(timeout));
    ratingTimeouts.clear();
    
    // Salvar estado final
    saveAppState();
});

/**
 * ✅ Função para monitorar performance (opcional)
 */
function monitorPerformance() {
    if ('performance' in window && 'PerformanceObserver' in window) {
        const observer = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            entries.forEach(entry => {
                if (entry.duration > 100) { // Log apenas operações lentas
                    console.warn(`⚠️ Operação lenta detectada: ${entry.name} - ${entry.duration.toFixed(2)}ms`);
                }
            });
        });
        
        try {
            observer.observe({ entryTypes: ['measure', 'navigation'] });
        } catch (error) {
            console.log('Performance monitoring não suportado:', error);
        }
    }
}

/**
 * ✅ Função para otimizar renderização
 */
function optimizeRendering() {
    // Usar requestAnimationFrame para operações visuais
    if ('requestIdleCallback' in window) {
        requestIdleCallback(() => {
            // Executar tarefas não críticas quando o navegador estiver idle
            monitorPerformance();
        });
    } else {
        setTimeout(monitorPerformance, 100);
    }
}

/**
 * ✅ Inicialização final com otimizações
 */
document.addEventListener("DOMContentLoaded", () => {
    // Marcar início da performance
    if ('performance' in window) {
        performance.mark('sugestoes-start');
    }
    
    setTimeout(() => {
        optimizeRendering();
        
        // Marcar fim da inicialização
        if ('performance' in window) {
            performance.mark('sugestoes-end');
            performance.measure('sugestoes-init', 'sugestoes-start', 'sugestoes-end');
        }
        
        console.log('🚀 Sistema de sugestões totalmente carregado e otimizado!');
    }, 1500);
});

/**
 * ✅ Tratamento de erros global melhorado
 */
window.addEventListener('unhandledrejection', (event) => {
    console.error('❌ Promise rejeitada não tratada:', event.reason);
    
    // Não mostrar erro para o usuário se for relacionado a avaliações
    if (event.reason && event.reason.toString().includes('rating')) {
        event.preventDefault(); // Prevenir que apareça no console
        console.log('🔄 Tentando recuperar sistema de avaliações...');
        
        setTimeout(() => {
            resetRatingSystem();
        }, 1000);
    }
});

// ✅ Fim do arquivo - Sistema completo e otimizado
console.log('📄 sugestoes.js carregado com sucesso!');
