/**
 * Sistema de Comentários - VERSÃO COMPLETA COM FIREBASE E FOTOS DE PERFIL
 * Integração com sugestoes.js e persistência no Firebase
 */

// Configurações do sistema de comentários
const COMMENTS_CONFIG = {
    maxLength: 1000,
    autoSave: true,
    showTimestamp: true
};

/**
 * ✅ FUNÇÕES DE PERSISTÊNCIA NO FIREBASE
 */

/**
 * ✅ FUNÇÃO PARA OBTER FOTO DO PERFIL DO USUÁRIO
 */
async function getUserProfilePhoto(userInfo) {
    try {
        // 1. Verificar se há foto no Firebase Auth
        if (firebase.auth().currentUser?.photoURL) {
            return firebase.auth().currentUser.photoURL;
        }
        
        // 2. Verificar se há foto salva no Firestore
        if (userInfo.userEmail && typeof window.db !== 'undefined') {
            const userDoc = await window.db.collection('users').doc(userInfo.userEmail).get();
            if (userDoc.exists && userDoc.data().photoURL) {
                return userDoc.data().photoURL;
            }
        }
        
        // 3. Gerar avatar baseado no nome/email (Gravatar ou similar)
        if (userInfo.userEmail) {
            // Usar serviço de avatar baseado no email
            const emailHash = await generateEmailHash(userInfo.userEmail);
            return `https://www.gravatar.com/avatar/${emailHash}?d=identicon&s=64`;
        }
        
        // 4. Fallback para ícone genérico
        return null;
        
    } catch (error) {
        console.error('Erro ao obter foto do perfil:', error);
        return null;
    }
}

/**
 * ✅ GERAR HASH DO EMAIL PARA GRAVATAR
 */
async function generateEmailHash(email) {
    try {
        const encoder = new TextEncoder();
        const data = encoder.encode(email.toLowerCase().trim());
        
        // Usar crypto.subtle se disponível, senão fallback simples
        if (crypto.subtle) {
            const hashBuffer = await crypto.subtle.digest('SHA-256', data);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 32);
        } else {
            // Fallback simples para hash
            let hash = 0;
            for (let i = 0; i < email.length; i++) {
                const char = email.charCodeAt(i);
                hash = ((hash << 5) - hash) + char;
                hash = hash & hash; // Convert to 32bit integer
            }
            return Math.abs(hash).toString(16);
        }
    } catch (error) {
        console.error('Erro ao gerar hash:', error);
        return 'default';
    }
}

/**
 * ✅ CRIAR ELEMENTO DE AVATAR MELHORADO
 */
async function createAvatarElement(userInfo, size = 'md') {
    const photoURL = await getUserProfilePhoto(userInfo);
    
    const sizeClasses = {
        sm: 'avatar-sm',
        md: 'avatar-md', 
        lg: 'avatar-lg'
    };
    
    const sizeClass = sizeClasses[size] || sizeClasses.md;
    
    if (photoURL) {
        return `
            <div class="avatar ${sizeClass} me-3">
                <img src="${photoURL}" 
                     alt="Foto de ${escapeHtml(userInfo.userName || 'Usuário')}"
                     class="avatar-img rounded-circle"
                     onerror="this.parentElement.innerHTML='<i class=\\'fas fa-user-circle fa-2x text-primary\\'></i>'"
                     loading="lazy">
            </div>
        `;
    } else {
        return `
            <div class="avatar ${sizeClass} me-3">
                <i class="fas fa-user-circle fa-2x text-primary"></i>
            </div>
        `;
    }
}

/**
 * ✅ VERSÃO ATUALIZADA - Capturar informações do usuário COM FOTO
 */
async function captureUserInfoForComments() {
    try {
        // Tentar usar a função do sugestoes.js
        if (typeof captureUserInfo === 'function') {
            const userInfo = await captureUserInfo();
            
            // ✅ ADICIONAR FOTO DO PERFIL
            if (firebase.auth().currentUser) {
                userInfo.photoURL = firebase.auth().currentUser.photoURL;
            }
            
            return userInfo;
        }
        
        // Fallback com informações básicas + foto
        const currentUser = firebase.auth().currentUser;
        return {
            userName: currentUser?.displayName || 'Usuário',
            userEmail: currentUser?.email || 'usuario@pge.sc.gov.br',
            photoURL: currentUser?.photoURL || null,
            sessionId: 'session_' + Date.now(),
            timestamp: new Date().toISOString(),
            isInstitutional: currentUser?.email?.includes('@pge.sc.gov.br') || false
        };
        
    } catch (error) {
        console.error('Erro ao capturar usuário:', error);
        return {
            userName: 'Usuário Anônimo',
            userEmail: 'anonimo@pge.sc.gov.br',
            photoURL: null,
            sessionId: 'anon_' + Date.now(),
            timestamp: new Date().toISOString(),
            isInstitutional: false
        };
    }
}

/**
 * ✅ VERSÃO ATUALIZADA - Salvar comentário COM FOTO
 */
async function saveCommentToFirebase(promptId, commentText) {
    try {
        if (typeof window.db === 'undefined') {
            throw new Error('Firebase não disponível');
        }
        
        const userInfo = await captureUserInfoForComments();
        
        const commentData = {
            promptId: promptId,
            text: commentText,
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            authorInfo: {
                name: userInfo.userName || 'Usuário',
                email: userInfo.userEmail || 'usuario@pge.sc.gov.br',
                photoURL: userInfo.photoURL || null, // ✅ INCLUIR FOTO
                sessionId: userInfo.sessionId || 'session_' + Date.now(),
                isInstitutional: userInfo.isInstitutional || false
            },
            likes: 0,
            isModerated: false,
            status: 'approved'
        };
        
        const docRef = await window.db.collection("prompt_comments").add(commentData);
        
        // Salvar backup local COM FOTO
        saveCommentToLocalStorage(promptId, commentText, docRef.id, userInfo.userName, userInfo.photoURL);
        
        return {
            id: docRef.id,
            success: true,
            author: userInfo.userName,
            photoURL: userInfo.photoURL
        };
        
    } catch (error) {
        console.error('Erro ao salvar no Firebase:', error);
        
        // Fallback: salvar apenas localmente
        const localId = 'local_' + Date.now();
        const userInfo = await captureUserInfoForComments();
        saveCommentToLocalStorage(promptId, commentText, localId, userInfo.userName, userInfo.photoURL);
        
        return {
            id: localId,
            success: false,
            author: userInfo.userName,
            photoURL: userInfo.photoURL,
            error: error.message
        };
    }
}

/**
 * ✅ VERSÃO ATUALIZADA - Carregar comentários COM FOTO
 */
async function loadCommentsFromFirebase(promptId) {
    try {
        if (typeof window.db === 'undefined') {
            return loadCommentsFromLocalStorage(promptId);
        }
        
        const snapshot = await window.db.collection("prompt_comments")
            .where("promptId", "==", promptId)
            .orderBy("timestamp", "desc")
            .get();
        
        const comments = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            comments.push({
                id: doc.id,
                text: data.text,
                author: data.authorInfo?.name || 'Usuário',
                email: data.authorInfo?.email || '',
                photoURL: data.authorInfo?.photoURL || null, // ✅ INCLUIR FOTO
                timestamp: data.timestamp,
                likes: data.likes || 0,
                isModerated: data.isModerated || false,
                isLocal: false,
                authorInfo: data.authorInfo // ✅ MANTER INFO COMPLETA
            });
        });
        
        // Salvar backup local COM FOTO
        if (comments.length > 0) {
            const localComments = JSON.parse(localStorage.getItem('promptComments') || '{}');
            localComments[promptId] = comments;
            localStorage.setItem('promptComments', JSON.stringify(localComments));
        }
        
        return comments;
        
    } catch (error) {
        console.error('Erro ao carregar do Firebase:', error);
        return loadCommentsFromLocalStorage(promptId);
    }
}

/**
 * ✅ VERSÃO ATUALIZADA - LocalStorage COM FOTO
 */
function saveCommentToLocalStorage(promptId, commentText, commentId, author = 'Você', photoURL = null) {
    try {
        const localComments = JSON.parse(localStorage.getItem('promptComments') || '{}');
        
        if (!localComments[promptId]) {
            localComments[promptId] = [];
        }
        
        const newComment = {
            id: commentId,
            text: commentText,
            author: author,
            photoURL: photoURL, // ✅ INCLUIR FOTO
            timestamp: new Date().toISOString(),
            likes: 0,
            isLocal: true
        };
        
        // Adicionar no início (mais recente primeiro)
        localComments[promptId].unshift(newComment);
        
        localStorage.setItem('promptComments', JSON.stringify(localComments));
        
        return newComment;
        
    } catch (error) {
        console.error('Erro ao salvar no localStorage:', error);
        return null;
    }
}

/**
 * ✅ CARREGAR COMENTÁRIOS DO LOCALSTORAGE
 */
function loadCommentsFromLocalStorage(promptId) {
    try {
        const localComments = JSON.parse(localStorage.getItem('promptComments') || '{}');
        return localComments[promptId] || [];
    } catch (error) {
        console.error('Erro ao carregar do localStorage:', error);
        return [];
    }
}

/**
 * ✅ VERSÃO ASSÍNCRONA - Renderizar comentários COM FOTO
 */
async function renderLoadedComments(comments, commentsList) {
    if (!commentsList) return;
    
    // Limpar lista
    commentsList.innerHTML = '';
    
    if (comments.length === 0) {
        commentsList.innerHTML = `
            <div class="no-comments text-center text-muted py-3">
                <i class="fas fa-comments fa-2x mb-2"></i>
                <p>Nenhum comentário ainda.</p>
                <p><small>Seja o primeiro a comentar!</small></p>
            </div>
        `;
        return;
    }
    
    // ✅ RENDERIZAR COMENTÁRIOS COM FOTO (assíncrono)
    for (const comment of comments) {
        const commentElement = await createLoadedCommentElement(comment);
        commentsList.appendChild(commentElement);
    }
}

/**
 * ✅ VERSÃO ATUALIZADA DA FUNÇÃO createLoadedCommentElement COM FOTO
 */
async function createLoadedCommentElement(comment) {
    const commentElement = document.createElement('div');
    commentElement.className = 'comment-item border-bottom pb-3 mb-3';
    commentElement.setAttribute('data-comment-id', comment.id);
    commentElement.style.animation = 'fadeIn 0.5s ease-in';
    
    // Formatar timestamp
    let timestamp = 'Agora mesmo';
    if (comment.timestamp) {
        try {
            const date = comment.timestamp.toDate ? comment.timestamp.toDate() : new Date(comment.timestamp);
            timestamp = date.toLocaleString('pt-BR');
        } catch (error) {
            timestamp = 'Data inválida';
        }
    }
    
    // Indicador se é local ou do Firebase
    const sourceIndicator = comment.isLocal ?
        '<small class="badge bg-warning ms-2">Local</small>' :
        '<small class="badge bg-success ms-2">Sincronizado</small>';
    
    // ✅ CRIAR AVATAR COM FOTO
    const userInfo = {
        userName: comment.author,
        userEmail: comment.email || comment.authorInfo?.email,
        photoURL: comment.photoURL || comment.authorInfo?.photoURL
    };
    
    const avatarHTML = await createAvatarElement(userInfo, 'md');
    
    commentElement.innerHTML = `
        <div class="d-flex align-items-start">
            ${avatarHTML}
            <div class="comment-content flex-grow-1">
                <div class="comment-header d-flex justify-content-between align-items-center mb-2">
                    <div class="d-flex align-items-center">
                        <strong class="comment-author text-primary">${escapeHtml(comment.author)}</strong>
                        ${sourceIndicator}
                        ${comment.authorInfo?.isInstitutional ? '<small class="badge bg-info ms-1">PGE</small>' : ''}
                    </div>
                    <small class="comment-date text-muted">${timestamp}</small>
                </div>
                <div class="comment-text bg-light p-3 rounded border">
                    ${escapeHtml(comment.text).replace(/\n/g, '<br>')}
                </div>
                <div class="comment-actions mt-2">
                    <button class="btn btn-sm btn-outline-success" onclick="likeComment(this)">
                        <i class="fas fa-thumbs-up me-1"></i>Útil (${comment.likes || 0})
                    </button>
                    <button class="btn btn-sm btn-outline-secondary" onclick="replyToComment(this)">
                        <i class="fas fa-reply me-1"></i>Responder
                    </button>
                </div>
            </div>
        </div>
    `;
    
    return commentElement;
}

/**
 * Inicializar sistema de comentários
 */
function initCommentsSystem() {
    // Aguardar DOM estar pronto
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setupCommentsListeners);
    } else {
        setupCommentsListeners();
    }
}

/**
 * Configurar listeners do sistema de comentários
 */
function setupCommentsListeners() {
    // Event delegation para botões de toggle
    document.addEventListener('click', handleCommentsToggle);
    
    // Event delegation para botões de envio
    document.addEventListener('click', handleCommentSubmit);
    
    // Event delegation para inputs de comentário
    document.addEventListener('input', handleCommentInput);
}

/**
 * ✅ VERSÃO FINAL - Com atributo personalizado (à prova de interferências)
 */
function handleCommentsToggle(e) {
    const toggleBtn = e.target.closest('.toggle-comments') || 
                     e.target.closest('.comments-toggle') ||
                     e.target.closest('[class*="toggle"]');
    
    if (!toggleBtn) return;
    
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    
    console.log('🔄 Toggle FINAL acionado');
    
    const promptId = toggleBtn.getAttribute('data-prompt-id') || 
                     toggleBtn.closest('[data-prompt-id]')?.getAttribute('data-prompt-id');
    
    let commentsContent = document.querySelector(`#comments-${promptId}`);
    
    if (!commentsContent) {
        const target = toggleBtn.getAttribute('data-bs-target') || toggleBtn.getAttribute('data-target');
        if (target) {
            commentsContent = document.querySelector(target);
        }
    }
    
    if (!commentsContent) {
        console.error('❌ Container não encontrado para prompt:', promptId);
        return;
    }
    
    // ✅ USAR NOSSO PRÓPRIO ATRIBUTO - IGNORAR TUDO MAIS
    const isCurrentlyOpen = commentsContent.getAttribute('data-my-state') === 'open';
    
    console.log(`📋 Prompt ${promptId}:`, isCurrentlyOpen ? '🔴 FECHANDO' : '🟢 ABRINDO');
    console.log('🔍 Nosso estado:', commentsContent.getAttribute('data-my-state'));
    
    if (isCurrentlyOpen) {
        // ✅ FECHAR
        console.log('🔄 Fechando...');
        
        // Nosso controle
        commentsContent.setAttribute('data-my-state', 'closed');
        
        // Forçar fechamento BRUTAL
        commentsContent.style.cssText = `
            display: none !important;
            height: 0px !important;
            max-height: 0px !important;
            opacity: 0 !important;
            overflow: hidden !important;
            visibility: hidden !important;
        `;
        
        // Limpar classes
        commentsContent.className = 'comments-container d-none';
        
        // Atualizar botão
        toggleBtn.setAttribute('aria-expanded', 'false');
        
        // Ícone
        const chevron = toggleBtn.querySelector('.fa-chevron-up, .fa-chevron-down, .toggle-icon');
        if (chevron) {
            chevron.className = 'fas fa-chevron-down ms-1 toggle-icon';
        }
        
        // Texto
        const toggleText = toggleBtn.querySelector('.toggle-text');
        if (toggleText) {
            toggleText.textContent = 'Mostrar';
        }
        
        console.log('✅ FECHADO');
        
    } else {
        // ✅ ABRIR
        console.log('🔄 Abrindo...');
        
        // Nosso controle
        commentsContent.setAttribute('data-my-state', 'open');
        
        // Forçar abertura BRUTAL
        commentsContent.style.cssText = `
            display: block !important;
            height: auto !important;
            max-height: none !important;
            opacity: 1 !important;
            overflow: visible !important;
            visibility: visible !important;
        `;
        
        // Definir classes
        commentsContent.className = 'comments-container show';
        
        // Atualizar botão
        toggleBtn.setAttribute('aria-expanded', 'true');
        
        // Ícone
        const chevron = toggleBtn.querySelector('.fa-chevron-up, .fa-chevron-down, .toggle-icon');
        if (chevron) {
            chevron.className = 'fas fa-chevron-up ms-1 toggle-icon';
        }
        
        // Texto
        const toggleText = toggleBtn.querySelector('.toggle-text');
        if (toggleText) {
            toggleText.textContent = 'Ocultar';
        }
        
        // Carregar comentários
        if (promptId) {
            loadCommentsForPrompt(promptId);
        }
        
        console.log('✅ ABERTO');
    }
    
    // Verificar estado final
    setTimeout(() => {
        console.log('🔍 Estado final:', {
            myState: commentsContent.getAttribute('data-my-state'),
            display: commentsContent.style.display,
            height: commentsContent.offsetHeight,
            visible: commentsContent.offsetHeight > 0
        });
    }, 100);
}



/**
 * ✅ MANIPULAR ENVIO DE COMENTÁRIOS - VERSÃO CORRIGIDA
 */
function handleCommentSubmit(e) {
    const submitBtn = e.target.closest('.submit-comment-btn') || e.target.closest('.submit-comment');

    if (!submitBtn) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    console.log('📝 Botão de envio clicado');
    
    const promptId = submitBtn.getAttribute('data-prompt-id');
    console.log('🔍 Prompt ID:', promptId);
    
    if (!promptId) {
        console.error('❌ Prompt ID não encontrado');
        showCommentFeedback('Erro: ID do prompt não encontrado', 'danger');
        return;
    }
    
    // ✅ BUSCA MAIS ROBUSTA DOS ELEMENTOS
    let commentForm = submitBtn.closest('.comment-form');
    let textarea = commentForm?.querySelector('.comment-input');
    let commentsList = null;
    
    // Tentar diferentes formas de encontrar a textarea
    if (!textarea) {
        textarea = document.querySelector(`#comments-${promptId} .comment-input`);
        console.log('🔍 Textarea encontrada via ID:', !!textarea);
    }
    
    if (!textarea) {
        textarea = submitBtn.closest('[data-prompt-id]')?.querySelector('.comment-input');
        console.log('🔍 Textarea encontrada via data-prompt-id:', !!textarea);
    }
    
    // Tentar diferentes formas de encontrar a lista de comentários
    commentsList = document.querySelector(`#comments-${promptId} .comments-list`);
    if (!commentsList) {
        commentsList = submitBtn.closest('[id^="comments-"]')?.querySelector('.comments-list');
    }
    if (!commentsList) {
        commentsList = submitBtn.closest('.comments-container')?.querySelector('.comments-list');
    }
    
    console.log('🔍 Elementos encontrados:', {
        textarea: !!textarea,
        commentsList: !!commentsList,
        commentForm: !!commentForm
    });
    
    if (!textarea) {
        console.error('❌ Campo de texto não encontrado');
        showCommentFeedback('Erro: Campo de comentário não encontrado', 'danger');
        return;
    }
    
    if (!commentsList) {
        console.error('❌ Lista de comentários não encontrada');
        showCommentFeedback('Erro: Lista de comentários não encontrada', 'danger');
        return;
    }
    
    const commentText = textarea.value.trim();
    console.log('📝 Texto do comentário:', commentText.substring(0, 50) + '...');
    
    // ✅ VALIDAÇÕES
    if (!commentText) {
        showCommentFeedback('Por favor, digite um comentário!', 'warning');
        textarea.focus();
        return;
    }
    
    if (commentText.length < 3) {
        showCommentFeedback('Comentário deve ter pelo menos 3 caracteres!', 'warning');
        textarea.focus();
        return;
    }
    
    if (commentText.length > COMMENTS_CONFIG.maxLength) {
        showCommentFeedback(`Comentário muito longo! Máximo ${COMMENTS_CONFIG.maxLength} caracteres.`, 'danger');
        return;
    }
    
    console.log('✅ Validações passaram, processando envio...');
    
    // ✅ PROCESSAR ENVIO
    processCommentSubmission(promptId, commentText, submitBtn, textarea, commentsList);
}


/**
 * ✅ VERSÃO ASSÍNCRONA - Processar envio COM FOTO
 */
async function processCommentSubmission(promptId, commentText, submitBtn, textarea, commentsList) {
    // Desabilitar botão e mostrar loading
    const originalHTML = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i>Enviando...';
    
    try {
        // ✅ SALVAR NO FIREBASE COM FOTO
        const result = await saveCommentToFirebase(promptId, commentText);
        
        // ✅ CRIAR ELEMENTO DO COMENTÁRIO COM FOTO (assíncrono)
        const commentElement = await createCommentElement(commentText, promptId, result.author, result.photoURL, result.id);

        
        // Remover mensagem "sem comentários"
        const noComments = commentsList.querySelector('.no-comments, .text-center');
        if (noComments) {
            noComments.remove();
        }
        
        // Adicionar comentário à lista
        commentsList.insertBefore(commentElement, commentsList.firstChild);
        
        // Limpar textarea
        textarea.value = '';
        
        // Atualizar contador de caracteres
        const charCounter = textarea.closest('.comment-form').querySelector('.char-counter');
        if (charCounter) {
            charCounter.textContent = '0/' + COMMENTS_CONFIG.maxLength;
            charCounter.classList.remove('text-danger');
        }
        
        // Atualizar contador no botão toggle
        updateCommentsCounter(promptId);
        
        // Scroll para o novo comentário
        commentElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        
        // Mostrar feedback de sucesso
        const message = result.success ?
            'Comentário enviado e salvo com sucesso!' :
            'Comentário salvo localmente. Será sincronizado quando possível.';
        const type = result.success ? 'success' : 'info';
        
        showCommentFeedback(message, type);
        
    } catch (error) {
        console.error('Erro ao processar comentário:', error);
        showCommentFeedback('Erro ao enviar comentário. Salvo localmente.', 'warning');
    } finally {
        // Restaurar botão
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalHTML;
    }
}

/**
 * ✅ VERSÃO ATUALIZADA - Criar elemento HTML do comentário COM FOTO
 */
async function createCommentElement(commentText, promptId, author = 'Você', photoURL = null, commentId = null) {
    const commentElement = document.createElement('div');
    commentElement.className = 'comment-item border-bottom pb-3 mb-3';
    
    // ✅ LINHA ADICIONADA AQUI:
    commentElement.setAttribute('data-comment-id', commentId || 'temp_' + Date.now());
    
    commentElement.style.animation = 'fadeIn 0.5s ease-in';
    
    const timestamp = COMMENTS_CONFIG.showTimestamp ?
        new Date().toLocaleString('pt-BR') : 'Agora mesmo';
    
    // ✅ CRIAR AVATAR COM FOTO
    const userInfo = {
        userName: author,
        userEmail: firebase.auth().currentUser?.email,
        photoURL: photoURL
    };
    
    const avatarHTML = await createAvatarElement(userInfo, 'md');
    
    commentElement.innerHTML = `
        <div class="d-flex align-items-start">
            ${avatarHTML}
            <div class="comment-content flex-grow-1">
                <div class="comment-header d-flex justify-content-between align-items-center mb-2">
                    <div class="d-flex align-items-center">
                        <strong class="comment-author text-primary">${escapeHtml(author)}</strong>
                        <small class="badge bg-info ms-2">Novo</small>
                        ${firebase.auth().currentUser?.email?.includes('@pge.sc.gov.br') ? '<small class="badge bg-info ms-1">PGE</small>' : ''}
                    </div>
                    <small class="comment-date text-muted">${timestamp}</small>
                </div>
                <div class="comment-text bg-light p-3 rounded border">
                    ${escapeHtml(commentText).replace(/\n/g, '<br>')}
                </div>
                <div class="comment-actions mt-2">
                    <button class="btn btn-sm btn-outline-success" onclick="likeComment(this)">
                        <i class="fas fa-thumbs-up me-1"></i>Útil (0)
                    </button>
                    <button class="btn btn-sm btn-outline-secondary" onclick="replyToComment(this)">
                        <i class="fas fa-reply me-1"></i>Responder
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteComment(this)">
                        <i class="fas fa-trash me-1"></i>Excluir
                    </button>
                </div>
            </div>
        </div>
    `;
    
    return commentElement;
}


/**
 * Manipular input de comentário (contador de caracteres)
 */
function handleCommentInput(e) {
    const textarea = e.target.closest('.comment-input');
    if (!textarea) return;
    
    const length = textarea.value.length;
    const maxLength = COMMENTS_CONFIG.maxLength;
    
    // Atualizar contador
    const counter = textarea.closest('.comment-form').querySelector('.char-counter');
    if (counter) {
        counter.textContent = `${length}/${maxLength}`;
        counter.classList.toggle('text-danger', length > maxLength);
        counter.classList.toggle('text-warning', length > maxLength * 0.8);
    }
    
    // Habilitar/desabilitar botão
    const submitBtn = textarea.closest('.comment-form').querySelector('.submit-comment');
    if (submitBtn) {
        submitBtn.disabled = length === 0 || length > maxLength;
    }
}

/**
 * ✅ VERSÃO ASSÍNCRONA - Carregar comentários COM FOTO
 */
async function loadCommentsForPrompt(promptId) {
    const commentsList = document.querySelector(`#comments-${promptId} .comments-list`);
    if (!commentsList) {
        return;
    }
    
    // Mostrar loading
    commentsList.innerHTML = '<div class="text-center py-3"><i class="fas fa-spinner fa-spin"></i> Carregando comentários...</div>';
    
    try {
        // ✅ CARREGAR DO FIREBASE COM FOTO
        const comments = await loadCommentsFromFirebase(promptId);
        
        // ✅ RENDERIZAR COMENTÁRIOS COM FOTO (assíncrono)
        await renderLoadedComments(comments, commentsList);
        
        // Atualizar contador
        updateCommentsCounterWithNumber(promptId, comments.length);
        
    } catch (error) {
        console.error('Erro ao carregar comentários:', error);
        commentsList.innerHTML = `
            <div class="alert alert-warning">
                <i class="fas fa-exclamation-triangle me-2"></i>
                Erro ao carregar comentários. Tente recarregar a página.
            </div>
        `;
    }
}

/**
 * Atualizar contador de comentários no botão toggle
 */
function updateCommentsCounter(promptId) {
    const toggleButton = document.querySelector(`[data-bs-target="#comments-${promptId}"]`);
    if (!toggleButton) return;
    
    const countSpan = toggleButton.querySelector('.comments-count');
    if (countSpan) {
        const currentCount = parseInt(countSpan.textContent.match(/\d+/)?.[0]) || 0;
        countSpan.textContent = `(${currentCount + 1})`;
    }
}

/**
 * ✅ ATUALIZAR CONTADOR COM NÚMERO ESPECÍFICO
 */
function updateCommentsCounterWithNumber(promptId, count) {
    const toggleButton = document.querySelector(`[data-bs-target="#comments-${promptId}"]`);
    if (!toggleButton) return;
    
    const countSpan = toggleButton.querySelector('.comments-count');
    if (countSpan) {
        countSpan.textContent = `(${count})`;
    }
}

/**
 * Mostrar feedback de comentário
 */
function showCommentFeedback(message, type = 'info') {
    // Usar a função showFeedback do sugestoes.js se disponível
    if (typeof showFeedback === 'function') {
        showFeedback(message, type);
        return;
    }
    
    // Fallback para alert simples
    alert(message);
}

/**
 * Funções auxiliares para ações de comentários
 */
function likeComment(button) {
    const currentCount = parseInt(button.textContent.match(/\d+/)[0]) || 0;
    button.innerHTML = `<i class="fas fa-thumbs-up me-1"></i>Útil (${currentCount + 1})`;
    button.disabled = true;
    button.classList.remove('btn-outline-success');
    button.classList.add('btn-success');
}

function replyToComment(button) {
    showCommentFeedback('Funcionalidade de resposta em desenvolvimento!', 'info');
}

/**
 * ✅ EXCLUIR COMENTÁRIO PERMANENTEMENTE - VERSÃO CORRIGIDA
 */
async function deleteComment(button) {
    if (!confirm('Tem certeza que deseja excluir este comentário? Esta ação não pode ser desfeita.')) {
        return;
    }
    
    console.log('🗑️ Iniciando exclusão de comentário...');
    
    const commentItem = button.closest('.comment-item');
    
// ✅ BUSCAR ID DE VÁRIAS FORMAS
let commentId = commentItem.getAttribute('data-comment-id');

// Se não encontrou, tentar outras formas
if (!commentId) {
    commentId = commentItem.id;
}
if (!commentId) {
    commentId = commentItem.querySelector('[data-id]')?.getAttribute('data-id');
}
if (!commentId) {
    // Gerar ID temporário baseado no conteúdo
    const commentText = commentItem.querySelector('.comment-text')?.textContent?.trim();
    if (commentText) {
        commentId = 'temp_' + btoa(commentText.substring(0, 20)).replace(/[^a-zA-Z0-9]/g, '');
    }
}

// Buscar promptId de várias formas
let promptId = button.closest('[data-prompt-id]')?.getAttribute('data-prompt-id');
if (!promptId) {
    const commentsSection = button.closest('[id^="comments-"]');
    if (commentsSection) {
        promptId = commentsSection.id.replace('comments-', '');
    }
}

console.log('🔍 Dados da exclusão:', { 
    commentId, 
    promptId,
    commentItem: commentItem,
    hasDataId: commentItem.hasAttribute('data-comment-id')
});

if (!commentId) {
    console.error('❌ ID do comentário não encontrado de forma alguma');
    
    // ✅ EXCLUSÃO FORÇADA SEM ID
    if (confirm('ID não encontrado. Excluir apenas visualmente?')) {
        commentItem.style.transition = 'all 0.3s ease-out';
        commentItem.style.opacity = '0';
        commentItem.style.transform = 'translateX(-100%)';
        
        setTimeout(() => {
            commentItem.remove();
            showCommentFeedback('Comentário removido visualmente', 'warning');
        }, 300);
    }
    return;
}

    
    // Desabilitar botão durante exclusão
    const originalHTML = button.innerHTML;
    button.disabled = true;
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    
    try {
        // ✅ 1. EXCLUIR DO FIREBASE (se não for local)
        if (!commentId.startsWith('local_') && !commentId.startsWith('temp_')) {
            console.log('🔥 Excluindo do Firebase...');
            await deleteCommentFromFirebase(commentId);
            console.log('✅ Excluído do Firebase');
        } else {
            console.log('📱 Comentário local, pulando Firebase');
        }
        
        // ✅ 2. EXCLUIR DO LOCALSTORAGE
        console.log('💾 Excluindo do LocalStorage...');
        deleteCommentFromLocalStorage(commentId, promptId);
        console.log('✅ Excluído do LocalStorage');
        
        // ✅ 3. ANIMAÇÃO DE SAÍDA
        commentItem.style.transition = 'all 0.3s ease-out';
        commentItem.style.transform = 'translateX(-100%)';
        commentItem.style.opacity = '0';
        commentItem.style.height = '0px';
        commentItem.style.marginBottom = '0px';
        commentItem.style.paddingBottom = '0px';
        
        setTimeout(() => {
            // ✅ 4. REMOVER DO DOM
            commentItem.remove();
            
            // ✅ 5. ATUALIZAR CONTADOR
            updateCommentsCounterAfterDelete(promptId);
            
            // ✅ 6. VERIFICAR SE FICOU VAZIO
            checkIfCommentsEmpty(promptId);
            
            console.log('✅ Comentário excluído completamente');
            showCommentFeedback('Comentário excluído com sucesso!', 'success');
            
        }, 300);
        
    } catch (error) {
        console.error('❌ Erro ao excluir comentário:', error);
        showCommentFeedback('Erro ao excluir comentário. Tente novamente.', 'danger');
        
        // Restaurar botão
        button.disabled = false;
        button.innerHTML = originalHTML;
    }
}

/**
 * ✅ EXCLUIR COMENTÁRIO DO LOCALSTORAGE - NOVA FUNÇÃO
 */
function deleteCommentFromLocalStorage(commentId, promptId) {
    try {
        console.log('💾 Removendo do LocalStorage:', { commentId, promptId });
        
        const localComments = JSON.parse(localStorage.getItem('promptComments') || '{}');
        console.log('📋 Comentários antes da exclusão:', localComments[promptId]?.length || 0);
        
        if (localComments[promptId]) {
            // Filtrar comentário específico
            const originalLength = localComments[promptId].length;
            localComments[promptId] = localComments[promptId].filter(comment => {
                const keep = comment.id !== commentId;
                if (!keep) {
                    console.log('🗑️ Removendo comentário:', comment.id);
                }
                return keep;
            });
            
            const newLength = localComments[promptId].length;
            console.log('📊 Comentários removidos:', originalLength - newLength);
            
            // Se não sobrou nenhum comentário, remover a chave
            if (localComments[promptId].length === 0) {
                delete localComments[promptId];
                console.log('🧹 Removendo chave vazia do prompt');
            }
            
            // Salvar de volta
            localStorage.setItem('promptComments', JSON.stringify(localComments));
            console.log('✅ LocalStorage atualizado');
        } else {
            console.log('⚠️ Nenhum comentário encontrado para este prompt no LocalStorage');
        }
        
    } catch (error) {
        console.error('❌ Erro ao remover do LocalStorage:', error);
        throw error;
    }
}

/**
 * ✅ ATUALIZAR CONTADOR APÓS EXCLUSÃO
 */
function updateCommentsCounterAfterDelete(promptId) {
    // Buscar botão toggle de várias formas
    let toggleButton = document.querySelector(`[data-bs-target="#comments-${promptId}"]`);
    if (!toggleButton) {
        toggleButton = document.querySelector(`[data-target="#comments-${promptId}"]`);
    }
    if (!toggleButton) {
        toggleButton = document.querySelector(`[data-prompt-id="${promptId}"].toggle-comments`);
    }
    
    if (!toggleButton) {
        console.log('⚠️ Botão toggle não encontrado para atualizar contador');
        return;
    }
    
    const countSpan = toggleButton.querySelector('.comment-count') || 
                     toggleButton.querySelector('[class*="count"]');
    
    if (countSpan) {
        const currentCount = parseInt(countSpan.textContent) || 0;
        const newCount = Math.max(0, currentCount - 1);
        countSpan.textContent = newCount;
        
        console.log('📊 Contador atualizado:', currentCount, '->', newCount);
        
        // Animar mudança
        countSpan.style.animation = 'pulse 0.3s ease';
        setTimeout(() => {
            countSpan.style.animation = '';
        }, 300);
    }
}

/**
 * ✅ VERIFICAR SE LISTA FICOU VAZIA
 */
function checkIfCommentsEmpty(promptId) {
    const commentsList = document.querySelector(`#comments-${promptId} .comments-list`);
    if (!commentsList) return;
    
    const remainingComments = commentsList.querySelectorAll('.comment-item');
    
    if (remainingComments.length === 0) {
        console.log('📝 Lista de comentários ficou vazia, mostrando mensagem');
        
        // Mostrar mensagem de lista vazia
        commentsList.innerHTML = `
            <div class="no-comments text-center text-muted py-3">
                <i class="fas fa-comments fa-2x mb-2"></i>
                <p>Nenhum comentário restante.</p>
                <p><small>Todos os comentários foram removidos.</small></p>
            </div>
        `;
    }
}


/**
 * ✅ EXCLUIR COMENTÁRIO DO FIREBASE
 */
async function deleteCommentFromFirebase(commentId) {
    try {
        if (typeof window.db !== 'undefined') {
            await window.db.collection("prompt_comments").doc(commentId).delete();
        }
    } catch (error) {
        console.error('Erro ao excluir comentário do Firebase:', error);
    }
}

/**
 * Função para escapar HTML (prevenir XSS)
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
    return text.replace(/[&<>"']/g, m => map[m]);
}

/**
 * ✅ CSS ATUALIZADO para avatares e animações - VERSÃO CORRIGIDA
 */
function addCommentsCSS() {
    if (document.getElementById('comments-css')) return;
    
    const style = document.createElement('style');
    style.id = 'comments-css';
    style.textContent = `
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes fadeOut {
            from { opacity: 1; transform: translateY(0); }
            to { opacity: 0; transform: translateY(-10px); }
        }
        
        /* ✅ CORREÇÃO PRINCIPAL - COMENTÁRIOS TOGGLE */
        .comments-content {
            transition: all 0.3s ease-in-out;
            overflow: hidden;
        }
        
        /* ✅ ESTADO FECHADO - FORÇAR FECHAMENTO COMPLETO */
        .comments-content:not(.show) {
            max-height: 0 !important;
            opacity: 0 !important;
            overflow: hidden !important;
            padding-top: 0 !important;
            padding-bottom: 0 !important;
            margin-top: 0 !important;
            margin-bottom: 0 !important;
            display: none !important;
        }
        
        /* ✅ ESTADO ABERTO - GARANTIR VISIBILIDADE */
        .comments-content.show {
            max-height: none !important;
            opacity: 1 !important;
            display: block !important;
            overflow: visible !important;
            padding-top: inherit !important;
            padding-bottom: inherit !important;
            margin-top: inherit !important;
            margin-bottom: inherit !important;
        }
        
        .comment-item {
            transition: all 0.3s ease;
            animation: fadeIn 0.4s ease-out;
        }
        
        .comment-item:hover {
            background-color: #f8f9fa;
            border-radius: 8px;
            padding: 8px;
            margin: -8px;
        }
        
        .char-counter.text-danger {
            font-weight: bold;
        }
        
        .char-counter.text-warning {
            font-weight: 600;
        }
        
        .comment-input {
            resize: vertical;
            min-height: 80px;
        }
        
        .comment-text {
            word-wrap: break-word;
            line-height: 1.5;
        }
        
        .badge {
            font-size: 0.7em;
        }
        
        .comment-actions .btn {
            font-size: 0.8em;
            padding: 0.25rem 0.5rem;
        }
        
        /* ✅ ESTILOS PARA AVATARES */
        .avatar {
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
        }
        
        .avatar-sm {
            width: 32px;
            height: 32px;
        }
        
        .avatar-md {
            width: 48px;
            height: 48px;
        }
        
        .avatar-lg {
            width: 64px;
            height: 64px;
        }
        
        .avatar-img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            border: 2px solid #e9ecef;
            transition: all 0.3s ease;
        }
        
        .avatar-img:hover {
            border-color: #007bff;
            transform: scale(1.05);
        }
        
        .avatar i {
            opacity: 0.7;
            transition: opacity 0.3s ease;
        }
        
        .avatar:hover i {
            opacity: 1;
        }
        
        /* ✅ FOTO DO USUÁRIO NO CABEÇALHO */
        .user-header-photo {
            width: 32px !important;
            height: 32px !important;
            object-fit: cover;
            border: 2px solid rgba(255, 255, 255, 0.3) !important;
            transition: all 0.3s ease;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        
        .user-header-photo:hover {
            border-color: rgba(255, 255, 255, 0.6) !important;
            transform: scale(1.1);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        }
        
        /* ✅ FOTO DO USUÁRIO NOS COMENTÁRIOS */
        .user-photo {
            width: 40px !important;
            height: 40px !important;
            object-fit: cover;
            border: 2px solid #dee2e6;
            transition: all 0.3s ease;
        }
        
        .user-photo:hover {
            border-color: #007bff;
            transform: scale(1.05);
        }
        
        /* ✅ LOADING STATE PARA AVATARES */
        .avatar-loading {
            background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
            background-size: 200% 100%;
            animation: loading 1.5s infinite;
        }
        
        @keyframes loading {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
        }
        
        /* ✅ INDICADORES DE STATUS */
        .avatar::after {
            content: '';
            position: absolute;
            bottom: -2px;
            right: -2px;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            border: 2px solid white;
        }
        
        .avatar.online::after {
            background-color: #28a745;
        }
        
        .avatar.institutional::after {
            background-color: #007bff;
        }
        
        /* ✅ ANIMAÇÃO DO BOTÃO TOGGLE */
        .toggle-comments, .comments-toggle {
            transition: all 0.2s ease;
        }
        
        .toggle-comments:hover, .comments-toggle:hover {
            transform: translateY(-1px);
        }
        
        /* ✅ ÍCONE CHEVRON */
        .toggle-icon, .fa-chevron-up, .fa-chevron-down {
            transition: transform 0.3s ease;
        }
        
        .toggle-comments[aria-expanded="true"] .toggle-icon {
            transform: rotate(180deg);
        }
        
        /* ✅ RESPONSIVIDADE */
        @media (max-width: 768px) {
            .user-photo {
                width: 32px !important;
                height: 32px !important;
            }
            
            .user-header-photo {
                width: 28px !important;
                height: 28px !important;
            }
            
            .avatar-md {
                width: 40px;
                height: 40px;
            }
            
            .comment-item:hover {
                padding: 4px;
                margin: -4px;
            }
        }
        
        /* ✅ TEMA ESCURO (OPCIONAL) */
        @media (prefers-color-scheme: dark) {
            .avatar-img {
                border-color: #495057;
            }
            
            .avatar-img:hover {
                border-color: #0d6efd;
            }
        }
    `;
    document.head.appendChild(style);
}


/**
 * ✅ FUNÇÃO PARA SINCRONIZAR COMENTÁRIOS LOCAIS COM FIREBASE
 */
async function syncLocalCommentsToFirebase() {
    try {
        const localComments = JSON.parse(localStorage.getItem('promptComments') || '{}');
        let syncCount = 0;
        
        for (const promptId in localComments) {
            const comments = localComments[promptId];
            
            for (const comment of comments) {
                if (comment.isLocal && comment.id.startsWith('local_')) {
                    try {
                        // Tentar salvar no Firebase
                        const result = await saveCommentToFirebase(promptId, comment.text);
                        if (result.success) {
                            // Remover da lista local
                            const index = comments.indexOf(comment);
                            comments.splice(index, 1);
                            syncCount++;
                        }
                    } catch (error) {
                        // Falha silenciosa na sincronização
                    }
                }
            }
        }
        
        // Salvar lista atualizada
        localStorage.setItem('promptComments', JSON.stringify(localComments));
        
        if (syncCount > 0) {
            showCommentFeedback(`${syncCount} comentário(s) sincronizado(s) com sucesso!`, 'success');
        }
        
    } catch (error) {
        console.error('Erro na sincronização:', error);
    }
}

/**
 * ✅ FUNÇÃO PARA LIMPAR CACHE DE COMENTÁRIOS
 */
function clearCommentsCache() {
    try {
        localStorage.removeItem('promptComments');
        showCommentFeedback('Cache de comentários limpo com sucesso!', 'info');
    } catch (error) {
        console.error('Erro ao limpar cache:', error);
    }
}

/**
 * ✅ FUNÇÃO PARA DEBUG E ESTATÍSTICAS
 */
function getCommentsStatistics() {
    try {
        const localComments = JSON.parse(localStorage.getItem('promptComments') || '{}');
        let totalComments = 0;
        let localOnlyComments = 0;
        let promptsWithComments = 0;
        let commentsWithPhotos = 0;
        
        for (const promptId in localComments) {
            const comments = localComments[promptId];
            if (comments.length > 0) {
                promptsWithComments++;
                totalComments += comments.length;
                
                comments.forEach(comment => {
                    if (comment.isLocal) {
                        localOnlyComments++;
                    }
                    if (comment.photoURL) {
                        commentsWithPhotos++;
                    }
                });
            }
        }
        
        return {
            totalComments,
            localOnlyComments,
            promptsWithComments,
            syncedComments: totalComments - localOnlyComments,
            commentsWithPhotos // ✅ NOVA ESTATÍSTICA
        };
    } catch (error) {
        console.error('Erro ao obter estatísticas:', error);
        return {
            totalComments: 0,
            localOnlyComments: 0,
            promptsWithComments: 0,
            syncedComments: 0,
            commentsWithPhotos: 0
        };
    }
}

/**
 * ✅ FUNÇÃO PARA EXPORTAR COMENTÁRIOS
 */
function exportComments() {
    try {
        const localComments = JSON.parse(localStorage.getItem('promptComments') || '{}');
        const exportData = {
            exportDate: new Date().toISOString(),
            version: '2.0', // ✅ VERSÃO ATUALIZADA COM FOTOS
            comments: localComments,
            statistics: getCommentsStatistics()
        };
        
        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `comments_export_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        showCommentFeedback('Comentários exportados com sucesso!', 'success');
        
    } catch (error) {
        console.error('Erro ao exportar comentários:', error);
        showCommentFeedback('Erro ao exportar comentários.', 'danger');
    }
}

/**
 * ✅ FUNÇÃO PARA IMPORTAR COMENTÁRIOS
 */
function importComments(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            try {
                const importData = JSON.parse(e.target.result);
                
                if (importData.comments) {
                    localStorage.setItem('promptComments', JSON.stringify(importData.comments));
                    showCommentFeedback('Comentários importados com sucesso!', 'success');
                    resolve(importData);
                } else {
                    throw new Error('Formato de arquivo inválido');
                }
            } catch (error) {
                console.error('Erro ao importar:', error);
                showCommentFeedback('Erro ao importar comentários. Verifique o arquivo.', 'danger');
                reject(error);
            }
        };
        
        reader.onerror = function() {
            reject(new Error('Erro ao ler arquivo'));
        };
        
        reader.readAsText(file);
    });
}

/**
 * ✅ FUNÇÃO PARA VALIDAR INTEGRIDADE DOS COMENTÁRIOS
 */
function validateCommentsIntegrity() {
    try {
        const localComments = JSON.parse(localStorage.getItem('promptComments') || '{}');
        let issues = [];
        let fixedIssues = 0;
        
        for (const promptId in localComments) {
            const comments = localComments[promptId];
            
            if (!Array.isArray(comments)) {
                issues.push(`Prompt ${promptId}: comentários não são um array`);
                continue;
            }
            
            comments.forEach((comment, index) => {
                // Verificar campos obrigatórios
                if (!comment.id) {
                    comment.id = 'fixed_' + Date.now() + '_' + index;
                    fixedIssues++;
                }
                
                if (!comment.text) {
                    issues.push(`Prompt ${promptId}, comentário ${index}: texto vazio`);
                }
                
                if (!comment.author) {
                    comment.author = 'Usuário Desconhecido';
                    fixedIssues++;
                }
                
                if (!comment.timestamp) {
                    comment.timestamp = new Date().toISOString();
                    fixedIssues++;
                }
                
                if (typeof comment.likes !== 'number') {
                    comment.likes = 0;
                    fixedIssues++;
                }
                
                // ✅ VALIDAR FOTO (NOVO)
                if (comment.photoURL && typeof comment.photoURL !== 'string') {
                    comment.photoURL = null;
                    fixedIssues++;
                }
            });
        }
        
        // Salvar correções
        if (fixedIssues > 0) {
            localStorage.setItem('promptComments', JSON.stringify(localComments));
        }
        
        const result = {
            totalIssues: issues.length,
            fixedIssues: fixedIssues,
            issues: issues
        };
        
        // ✅ REMOVER MENSAGENS AUTOMÁTICAS - só mostrar se houver problemas
        if (fixedIssues > 0) {
            showCommentFeedback(`${fixedIssues} problema(s) corrigido(s) automaticamente!`, 'info');
        }
        
        if (issues.length > 0) {
            console.warn('Problemas encontrados:', issues);
        }
        
        return result;
        
    } catch (error) {
        console.error('Erro na validação:', error);
        return { totalIssues: 1, fixedIssues: 0, issues: [error.message] };
    }
}

/**
 * ✅ FUNÇÃO PARA OTIMIZAR PERFORMANCE
 */
function optimizeCommentsPerformance() {
    // Implementar lazy loading para comentários
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const commentsSection = entry.target;
                const promptId = commentsSection.id.replace('comments-', '');
                
                // Carregar comentários apenas quando visível
                if (!commentsSection.dataset.loaded) {
                    loadCommentsForPrompt(promptId);
                    commentsSection.dataset.loaded = 'true';
                }
            }
        });
    }, {
        rootMargin: '50px'
    });
    
    // Observar todas as seções de comentários
    document.querySelectorAll('[id^="comments-"]').forEach(section => {
        observer.observe(section);
    });
}

/**
 * ✅ FUNÇÃO PARA UPLOAD DE FOTO DE PERFIL
 */
async function uploadProfilePhoto(file) {
    try {
        if (!firebase.auth().currentUser) {
            throw new Error('Usuário não autenticado');
        }
        
        // Validar arquivo
        if (!file.type.startsWith('image/')) {
            throw new Error('Arquivo deve ser uma imagem');
        }
        
        if (file.size > 2 * 1024 * 1024) { // 2MB
            throw new Error('Imagem muito grande (máximo 2MB)');
        }
        
        // Upload para Firebase Storage
        const storageRef = firebase.storage().ref();
        const photoRef = storageRef.child(`profile_photos/${firebase.auth().currentUser.uid}`);
        
        const snapshot = await photoRef.put(file);
        const downloadURL = await snapshot.ref.getDownloadURL();
        
        // Atualizar perfil do usuário
        await firebase.auth().currentUser.updateProfile({
            photoURL: downloadURL
        });
        
        // Salvar no Firestore também
        if (typeof window.db !== 'undefined') {
            await window.db.collection('users').doc(firebase.auth().currentUser.email).set({
                photoURL: downloadURL,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
        }
        
        showCommentFeedback('Foto de perfil atualizada com sucesso!', 'success');
        
        // Recarregar comentários para mostrar nova foto
        document.querySelectorAll('[id^="comments-"]').forEach(section => {
            const promptId = section.id.replace('comments-', '');
            if (section.dataset.loaded) {
                loadCommentsForPrompt(promptId);
            }
        });
        
        return downloadURL;
        
        } catch (error) {
        console.error('Erro ao fazer upload da foto:', error);
        showCommentFeedback(`Erro ao atualizar foto: ${error.message}`, 'danger');
        throw error;
    }
}

/**
 * ✅ FUNÇÃO PARA CRIAR ELEMENTO DE AVATAR COM FOTO
 */
async function createAvatarElement(userInfo, size = 'md') {
    const sizeClass = `avatar-${size}`;
    let avatarContent = '';
    
    try {
        // Tentar obter foto do usuário atual se não fornecida
        if (!userInfo.photoURL && firebase.auth().currentUser) {
            userInfo.photoURL = firebase.auth().currentUser.photoURL;
        }
        
        // Se ainda não tem foto, tentar buscar no Firestore
        if (!userInfo.photoURL && userInfo.userEmail && typeof window.db !== 'undefined') {
            try {
                const userDoc = await window.db.collection('users').doc(userInfo.userEmail).get();
                if (userDoc.exists && userDoc.data().photoURL) {
                    userInfo.photoURL = userDoc.data().photoURL;
                }
            } catch (error) {
                // Falha silenciosa
            }
        }
        
        if (userInfo.photoURL) {
            avatarContent = `
                <img src="${userInfo.photoURL}" 
                     alt="${escapeHtml(userInfo.userName || 'Usuário')}" 
                     class="avatar-img rounded-circle"
                     onerror="this.style.display='none'; this.nextElementSibling.style.display='block';"
                     loading="lazy">
                <i class="fas fa-user-circle fa-2x text-primary" style="display: none;"></i>
            `;
        } else {
            avatarContent = '<i class="fas fa-user-circle fa-2x text-primary"></i>';
        }
        
        // Determinar classes de status
        const statusClasses = [];
        if (userInfo.userEmail?.includes('@pge.sc.gov.br')) {
            statusClasses.push('institutional');
        }
        
        return `
            <div class="avatar ${sizeClass} ${statusClasses.join(' ')} me-3">
                ${avatarContent}
            </div>
        `;
        
    } catch (error) {
        console.error('Erro ao criar avatar:', error);
        return `
            <div class="avatar ${sizeClass} me-3">
                <i class="fas fa-user-circle fa-2x text-primary"></i>
            </div>
        `;
    }
}

/**
 * ✅ VERSÃO ATUALIZADA - Capturar informações do usuário COM FOTO
 */
async function captureUserInfoForComments() {
    try {
        // Tentar usar a função do sugestoes.js
        if (typeof captureUserInfo === 'function') {
            const baseInfo = await captureUserInfo();
            
            // ✅ ADICIONAR FOTO DO PERFIL
            if (firebase.auth().currentUser) {
                baseInfo.photoURL = firebase.auth().currentUser.photoURL;
                
                // Se não tem foto no Auth, tentar buscar no Firestore
                if (!baseInfo.photoURL && typeof window.db !== 'undefined') {
                    try {
                        const userDoc = await window.db.collection('users').doc(baseInfo.userEmail).get();
                        if (userDoc.exists && userDoc.data().photoURL) {
                            baseInfo.photoURL = userDoc.data().photoURL;
                        }
                    } catch (error) {
                        // Falha silenciosa
                    }
                }
            }
            
            return baseInfo;
        }
        
        // Fallback com foto
        const currentUser = firebase.auth().currentUser;
        return {
            userName: currentUser?.displayName || 'Usuário',
            userEmail: currentUser?.email || 'usuario@pge.sc.gov.br',
            photoURL: currentUser?.photoURL || null, // ✅ INCLUIR FOTO
            sessionId: 'session_' + Date.now(),
            timestamp: new Date().toISOString(),
            isInstitutional: currentUser?.email?.includes('@pge.sc.gov.br') || false
        };
    } catch (error) {
        console.error('Erro ao capturar usuário:', error);
        return {
            userName: 'Usuário Anônimo',
            userEmail: 'anonimo@pge.sc.gov.br',
            photoURL: null, // ✅ INCLUIR FOTO (NULA)
            sessionId: 'anon_' + Date.now(),
            timestamp: new Date().toISOString(),
            isInstitutional: false
        };
    }
}

/**
 * ✅ VERSÃO ATUALIZADA - Salvar comentário COM FOTO
 */
async function saveCommentToFirebase(promptId, commentText) {
    try {
        if (typeof window.db === 'undefined') {
            throw new Error('Firebase não disponível');
        }
        
        const userInfo = await captureUserInfoForComments();
        
        const commentData = {
            promptId: promptId,
            text: commentText,
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            authorInfo: {
                name: userInfo.userName || 'Usuário',
                email: userInfo.userEmail || 'usuario@pge.sc.gov.br',
                photoURL: userInfo.photoURL || null, // ✅ INCLUIR FOTO
                sessionId: userInfo.sessionId || 'session_' + Date.now(),
                isInstitutional: userInfo.isInstitutional || false
            },
            likes: 0,
            isModerated: false,
            status: 'approved'
        };
        
        const docRef = await window.db.collection("prompt_comments").add(commentData);
        
        // Salvar backup local COM FOTO
        saveCommentToLocalStorage(promptId, commentText, docRef.id, userInfo.userName, userInfo.photoURL);
        
        return {
            id: docRef.id,
            success: true,
            author: userInfo.userName,
            photoURL: userInfo.photoURL // ✅ RETORNAR FOTO
        };
        
    } catch (error) {
        console.error('Erro ao salvar no Firebase:', error);
        
        // Fallback: salvar apenas localmente COM FOTO
        const localId = 'local_' + Date.now();
        const userInfo = await captureUserInfoForComments();
        saveCommentToLocalStorage(promptId, commentText, localId, userInfo.userName, userInfo.photoURL);
        
        return {
            id: localId,
            success: false,
            author: userInfo.userName,
            photoURL: userInfo.photoURL, // ✅ RETORNAR FOTO
            error: error.message
        };
    }
}

/**
 * ✅ VERSÃO ATUALIZADA - Carregar comentários COM FOTO
 */
async function loadCommentsFromFirebase(promptId) {
    try {
        if (typeof window.db === 'undefined') {
            return loadCommentsFromLocalStorage(promptId);
        }
        
        const snapshot = await window.db.collection("prompt_comments")
            .where("promptId", "==", promptId)
            .orderBy("timestamp", "desc")
            .get();
        
        const comments = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            comments.push({
                id: doc.id,
                text: data.text,
                author: data.authorInfo?.name || 'Usuário',
                email: data.authorInfo?.email || '',
                photoURL: data.authorInfo?.photoURL || null, // ✅ INCLUIR FOTO
                timestamp: data.timestamp,
                likes: data.likes || 0,
                isModerated: data.isModerated || false,
                isInstitutional: data.authorInfo?.isInstitutional || false, // ✅ STATUS INSTITUCIONAL
                isLocal: false
            });
        });
        
        // Salvar backup local COM FOTO
        if (comments.length > 0) {
            const localComments = JSON.parse(localStorage.getItem('promptComments') || '{}');
            localComments[promptId] = comments;
            localStorage.setItem('promptComments', JSON.stringify(localComments));
        }
        
        return comments;
        
    } catch (error) {
        console.error('Erro ao carregar do Firebase:', error);
        return loadCommentsFromLocalStorage(promptId);
    }
}

/**
 * ✅ VERSÃO ATUALIZADA - Salvar no localStorage COM FOTO
 */
function saveCommentToLocalStorage(promptId, commentText, commentId, author = 'Você', photoURL = null) {
    try {
        const localComments = JSON.parse(localStorage.getItem('promptComments') || '{}');
        
        if (!localComments[promptId]) {
            localComments[promptId] = [];
        }
        
        const newComment = {
            id: commentId,
            text: commentText,
            author: author,
            photoURL: photoURL, // ✅ INCLUIR FOTO
            timestamp: new Date().toISOString(),
            likes: 0,
            isLocal: true
        };
        
        // Adicionar no início (mais recente primeiro)
        localComments[promptId].unshift(newComment);
        
        localStorage.setItem('promptComments', JSON.stringify(localComments));
        
        return newComment;
        
    } catch (error) {
        console.error('Erro ao salvar no localStorage:', error);
        return null;
    }
}

/**
 * ✅ VERSÃO ASSÍNCRONA - Renderizar comentários COM FOTO
 */
async function renderLoadedComments(comments, commentsList) {
    if (!commentsList) return;
    
    // Limpar lista
    commentsList.innerHTML = '';
    
    if (comments.length === 0) {
        commentsList.innerHTML = `
            <div class="no-comments text-center text-muted py-3">
                <i class="fas fa-comments fa-2x mb-2"></i>
                <p>Nenhum comentário ainda.</p>
                <p><small>Seja o primeiro a comentar!</small></p>
            </div>
        `;
        return;
    }
    
    // ✅ RENDERIZAR COMENTÁRIOS COM FOTO (assíncrono)
    for (const comment of comments) {
        const commentElement = await createLoadedCommentElement(comment);
        commentsList.appendChild(commentElement);
    }
}

/**
 * ✅ VERSÃO ASSÍNCRONA - Criar elemento de comentário carregado COM FOTO
 */
async function createLoadedCommentElement(comment) {
    const commentElement = document.createElement('div');
    commentElement.className = 'comment-item border-bottom pb-3 mb-3';
    commentElement.setAttribute('data-comment-id', comment.id);
    commentElement.style.animation = 'fadeIn 0.5s ease-in';
    
    // Formatar timestamp
    let timestamp = 'Agora mesmo';
    if (comment.timestamp) {
        try {
            const date = comment.timestamp.toDate ? comment.timestamp.toDate() : new Date(comment.timestamp);
            timestamp = date.toLocaleString('pt-BR');
        } catch (error) {
            timestamp = 'Data inválida';
        }
    }
    
    // Indicador se é local ou do Firebase
    const sourceIndicator = comment.isLocal ?
        '<small class="badge bg-warning ms-2">Local</small>' :
        '<small class="badge bg-success ms-2">Sincronizado</small>';
    
    // ✅ Badge institucional
    const institutionalBadge = comment.isInstitutional ?
        '<small class="badge bg-info ms-1">PGE</small>' : '';
    
    // ✅ CRIAR AVATAR COM FOTO
    const userInfo = {
        userName: comment.author,
        userEmail: comment.email,
        photoURL: comment.photoURL
    };
    
    const avatarHTML = await createAvatarElement(userInfo, 'md');
    
    commentElement.innerHTML = `
        <div class="d-flex align-items-start">
            ${avatarHTML}
            <div class="comment-content flex-grow-1">
                <div class="comment-header d-flex justify-content-between align-items-center mb-2">
                    <div class="d-flex align-items-center">
                        <strong class="comment-author text-primary">${escapeHtml(comment.author)}</strong>
                        ${sourceIndicator}
                        ${institutionalBadge}
                    </div>
                    <small class="comment-date text-muted">${timestamp}</small>
                </div>
                <div class="comment-text bg-light p-3 rounded border">
                    ${escapeHtml(comment.text).replace(/\n/g, '<br>')}
                </div>
                <div class="comment-actions mt-2">
                    <button class="btn btn-sm btn-outline-success" onclick="likeComment(this)">
                        <i class="fas fa-thumbs-up me-1"></i>Útil (${comment.likes || 0})
                    </button>
                    <button class="btn btn-sm btn-outline-secondary" onclick="replyToComment(this)">
                        <i class="fas fa-reply me-1"></i>Responder
                    </button>
                </div>
            </div>
        </div>
    `;
    
    return commentElement;
}

/**
 * ✅ FUNÇÃO PARA CONFIGURAR UPLOAD DE FOTO
 */
function setupPhotoUpload() {
    // Criar input de arquivo oculto
    const photoInput = document.createElement('input');
    photoInput.type = 'file';
    photoInput.accept = 'image/*';
    photoInput.style.display = 'none';
    photoInput.id = 'photo-upload-input';
    document.body.appendChild(photoInput);
    
    // Event listener para upload
    photoInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (file) {
            try {
                showCommentFeedback('Fazendo upload da foto...', 'info');
                await uploadProfilePhoto(file);
            } catch (error) {
                // Erro já tratado na função uploadProfilePhoto
            }
        }
    });
    
    // Função global para abrir seletor de arquivo
    window.selectProfilePhoto = function() {
        photoInput.click();
    };
}

// Inicializar sistema quando o script for carregado
initCommentsSystem();
addCommentsCSS();
setupPhotoUpload(); // ✅ CONFIGURAR UPLOAD DE FOTO

// Tentar sincronizar comentários locais quando online
window.addEventListener('online', () => {
    setTimeout(syncLocalCommentsToFirebase, 2000);
});

// Exportar funções para uso global
if (typeof window !== 'undefined') {
    window.CommentsSystem = {
        // Funções principais
        init: initCommentsSystem,
        loadComments: loadCommentsForPrompt,
        saveComment: saveCommentToFirebase,
        
        // Sincronização
        
        syncComments: syncLocalCommentsToFirebase,
        
        // Gerenciamento
        clearCache: clearCommentsCache,
        exportComments: exportComments,
        importComments: importComments,
        
        // Validação e estatísticas
        validateIntegrity: validateCommentsIntegrity,
        getStatistics: getCommentsStatistics,
        
        // Performance
        optimize: optimizeCommentsPerformance,
        
        // ✅ NOVAS FUNÇÕES PARA FOTOS
        uploadPhoto: uploadProfilePhoto,
        createAvatar: createAvatarElement,
        setupPhotoUpload: setupPhotoUpload,
        
        // Configuração
        config: COMMENTS_CONFIG
    };
}

/**
 * ✅ FUNÇÃO PARA GERENCIAR NOTIFICAÇÕES DE COMENTÁRIOS
 */
function setupCommentNotifications() {
    // Verificar se as notificações são suportadas
    if (!('Notification' in window)) {
        console.log('Notificações não suportadas neste navegador');
        return;
    }
    
    // Solicitar permissão para notificações
    if (Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
            console.log('Permissão para notificações:', permission);
        });
    }
}

/**
 * ✅ FUNÇÃO PARA ENVIAR NOTIFICAÇÃO DE NOVO COMENTÁRIO
 */
function notifyNewComment(promptId, author, text) {
    if (Notification.permission === 'granted') {
        const notification = new Notification('Novo comentário', {
            body: `${author}: ${text.substring(0, 100)}${text.length > 100 ? '...' : ''}`,
            icon: '/favicon.ico',
            tag: `comment-${promptId}`,
            requireInteraction: false
        });
        
        notification.onclick = function() {
            window.focus();
            const commentsSection = document.querySelector(`#comments-${promptId}`);
            if (commentsSection) {
                commentsSection.scrollIntoView({ behavior: 'smooth' });
            }
            notification.close();
        };
        
        // Auto-fechar após 5 segundos
        setTimeout(() => notification.close(), 5000);
    }
}

/**
 * ✅ FUNÇÃO PARA BUSCAR COMENTÁRIOS EM TEMPO REAL
 */
function setupRealTimeComments() {
    if (typeof window.db === 'undefined') return;
    
    // Listener para novos comentários
    window.db.collection("prompt_comments")
        .orderBy("timestamp", "desc")
        .limit(1)
        .onSnapshot((snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === "added") {
                    const data = change.doc.data();
                    const currentUser = firebase.auth().currentUser;
                    
                    // Não notificar sobre próprios comentários
                    if (data.authorInfo?.email !== currentUser?.email) {
                        notifyNewComment(
                            data.promptId,
                            data.authorInfo?.name || 'Usuário',
                            data.text
                        );
                        
                        // Atualizar contador se a seção estiver visível
                        updateCommentsCounterWithNumber(data.promptId, 
                            document.querySelectorAll(`#comments-${data.promptId} .comment-item`).length + 1
                        );
                    }
                }
            });
        });
}

/**
 * ✅ FUNÇÃO PARA MODERAÇÃO DE COMENTÁRIOS
 */
async function moderateComment(commentId, action) {
    try {
        if (typeof window.db === 'undefined') {
            throw new Error('Firebase não disponível');
        }
        
        const updateData = {
            isModerated: true,
            moderatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            moderatedBy: firebase.auth().currentUser?.email || 'sistema'
        };
        
        switch (action) {
            case 'approve':
                updateData.status = 'approved';
                break;
            case 'reject':
                updateData.status = 'rejected';
                break;
            case 'flag':
                updateData.status = 'flagged';
                break;
            default:
                throw new Error('Ação de moderação inválida');
        }
        
        await window.db.collection("prompt_comments").doc(commentId).update(updateData);
        
        showCommentFeedback(`Comentário ${action === 'approve' ? 'aprovado' : action === 'reject' ? 'rejeitado' : 'sinalizado'} com sucesso!`, 'success');
        
        return true;
        
    } catch (error) {
        console.error('Erro na moderação:', error);
        showCommentFeedback(`Erro na moderação: ${error.message}`, 'danger');
        return false;
    }
}

/**
 * ✅ FUNÇÃO PARA RELATÓRIO DE COMENTÁRIOS
 */
async function generateCommentsReport(startDate, endDate) {
    try {
        if (typeof window.db === 'undefined') {
            throw new Error('Firebase não disponível');
        }
        
        let query = window.db.collection("prompt_comments");
        
        if (startDate) {
            query = query.where("timestamp", ">=", firebase.firestore.Timestamp.fromDate(new Date(startDate)));
        }
        
        if (endDate) {
            query = query.where("timestamp", "<=", firebase.firestore.Timestamp.fromDate(new Date(endDate)));
        }
        
        const snapshot = await query.get();
        
        const report = {
            totalComments: snapshot.size,
            approvedComments: 0,
            rejectedComments: 0,
            flaggedComments: 0,
            pendingComments: 0,
            institutionalComments: 0,
            commentsWithPhotos: 0,
            topAuthors: {},
            dailyStats: {}
        };
        
        snapshot.forEach(doc => {
            const data = doc.data();
            
            // Contadores por status
            switch (data.status) {
                case 'approved':
                    report.approvedComments++;
                    break;
                case 'rejected':
                    report.rejectedComments++;
                    break;
                case 'flagged':
                    report.flaggedComments++;
                    break;
                default:
                    report.pendingComments++;
            }
            
            // Comentários institucionais
            if (data.authorInfo?.isInstitutional) {
                report.institutionalComments++;
            }
            
            // Comentários com foto
            if (data.authorInfo?.photoURL) {
                report.commentsWithPhotos++;
            }
            
            // Top autores
            const author = data.authorInfo?.name || 'Anônimo';
            report.topAuthors[author] = (report.topAuthors[author] || 0) + 1;
            
            // Estatísticas diárias
            if (data.timestamp && data.timestamp.toDate) {
                const date = data.timestamp.toDate().toISOString().split('T')[0];
                report.dailyStats[date] = (report.dailyStats[date] || 0) + 1;
            }
        });
        
        // Ordenar top autores
        report.topAuthors = Object.entries(report.topAuthors)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10)
            .reduce((obj, [key, value]) => {
                obj[key] = value;
                return obj;
            }, {});
        
        return report;
        
    } catch (error) {
        console.error('Erro ao gerar relatório:', error);
        throw error;
    }
}

/**
 * ✅ FUNÇÃO PARA BACKUP AUTOMÁTICO
 */
function setupAutoBackup() {
    // Fazer backup a cada 24 horas
    setInterval(() => {
        try {
            const backupData = {
                timestamp: new Date().toISOString(),
                comments: JSON.parse(localStorage.getItem('promptComments') || '{}'),
                statistics: getCommentsStatistics(),
                version: '2.0'
            };
            
            // Salvar no localStorage com chave específica
            localStorage.setItem('commentsBackup_' + new Date().toISOString().split('T')[0], 
                JSON.stringify(backupData));
            
            // Manter apenas os últimos 7 backups
            const backupKeys = Object.keys(localStorage)
                .filter(key => key.startsWith('commentsBackup_'))
                .sort()
                .reverse();
            
            if (backupKeys.length > 7) {
                backupKeys.slice(7).forEach(key => {
                    localStorage.removeItem(key);
                });
            }
            
            console.log('Backup automático realizado:', new Date().toISOString());
            
        } catch (error) {
            console.error('Erro no backup automático:', error);
        }
    }, 24 * 60 * 60 * 1000); // 24 horas
}

/**
 * ✅ FUNÇÃO PARA RESTAURAR BACKUP
 */
function restoreFromBackup(backupDate) {
    try {
        const backupKey = `commentsBackup_${backupDate}`;
        const backupData = localStorage.getItem(backupKey);
        
        if (!backupData) {
            throw new Error('Backup não encontrado para a data especificada');
        }
        
        const parsedBackup = JSON.parse(backupData);
        
        if (parsedBackup.comments) {
            // Fazer backup do estado atual antes de restaurar
            const currentBackup = {
                timestamp: new Date().toISOString(),
                comments: JSON.parse(localStorage.getItem('promptComments') || '{}'),
                statistics: getCommentsStatistics(),
                version: '2.0'
            };
            
            localStorage.setItem('commentsBackup_before_restore_' + Date.now(), 
                JSON.stringify(currentBackup));
            
            // Restaurar backup
            localStorage.setItem('promptComments', JSON.stringify(parsedBackup.comments));
            
            showCommentFeedback(`Backup de ${backupDate} restaurado com sucesso!`, 'success');
            
            // Recarregar comentários visíveis
            document.querySelectorAll('[id^="comments-"]').forEach(section => {
                if (section.dataset.loaded) {
                    const promptId = section.id.replace('comments-', '');
                    loadCommentsForPrompt(promptId);
                }
            });
            
            return true;
        } else {
            throw new Error('Backup inválido');
        }
        
    } catch (error) {
        console.error('Erro ao restaurar backup:', error);
        showCommentFeedback(`Erro ao restaurar backup: ${error.message}`, 'danger');
        return false;
    }
}

/**
 * ✅ FUNÇÃO PARA LISTAR BACKUPS DISPONÍVEIS
 */
function listAvailableBackups() {
    try {
        const backupKeys = Object.keys(localStorage)
            .filter(key => key.startsWith('commentsBackup_') && !key.includes('before_restore'))
            .sort()
            .reverse();
        
        const backups = backupKeys.map(key => {
            try {
                const backupData = JSON.parse(localStorage.getItem(key));
                const date = key.replace('commentsBackup_', '');
                
                return {
                    date: date,
                    timestamp: backupData.timestamp,
                    totalComments: Object.values(backupData.comments || {})
                        .reduce((total, comments) => total + comments.length, 0),
                    version: backupData.version || '1.0'
                };
            } catch (error) {
                return null;
            }
        }).filter(backup => backup !== null);
        
        return backups;
        
    } catch (error) {
        console.error('Erro ao listar backups:', error);
        return [];
    }
}

/**
 * ✅ INICIALIZAÇÃO FINAL COM VERIFICAÇÕES E NOVAS FUNCIONALIDADES
 */
document.addEventListener('DOMContentLoaded', () => {
    // Validar integridade na inicialização
    setTimeout(() => {
        validateCommentsIntegrity();
        
        // Ativar otimizações se suportado
        if ('IntersectionObserver' in window) {
            optimizeCommentsPerformance();
        }
        
        // Configurar notificações
        setupCommentNotifications();
        
        // Configurar backup automático
        setupAutoBackup();
        
        // Tentar sincronizar comentários pendentes
        if (navigator.onLine) {
            syncLocalCommentsToFirebase();
        }
        
        // Configurar comentários em tempo real se autenticado
        firebase.auth().onAuthStateChanged(user => {
            if (user) {
                setupRealTimeComments();
            }
        });
        
    }, 2000);
});

/**
 * ✅ TRATAMENTO DE ERROS GLOBAL APRIMORADO
 */
window.addEventListener('unhandledrejection', (event) => {
    if (event.reason && event.reason.toString().includes('comment')) {
        console.error('Erro não tratado no sistema de comentários:', event.reason);
        event.preventDefault();
        
        // Tentar recuperar automaticamente
        setTimeout(() => {
            initCommentsSystem();
        }, 1000);
    }
});

/**
 * ✅ CLEANUP APRIMORADO AO SAIR DA PÁGINA
 */
window.addEventListener('beforeunload', () => {
    // Tentar sincronizar comentários pendentes
    if (navigator.onLine) {
        syncLocalCommentsToFirebase();
    }
    
    // Fazer backup de emergência
    try {
        const emergencyBackup = {
            timestamp: new Date().toISOString(),
            comments: JSON.parse(localStorage.getItem('promptComments') || '{}'),
            statistics: getCommentsStatistics(),
            version: '2.0',
            type: 'emergency'
        };
        
        localStorage.setItem('commentsEmergencyBackup', JSON.stringify(emergencyBackup));
    } catch (error) {
        console.error('Erro no backup de emergência:', error);
    }
});

/**
 * ✅ FUNÇÃO PARA RECUPERAÇÃO DE EMERGÊNCIA
 */
function emergencyRestore() {
    try {
        const emergencyBackup = localStorage.getItem('commentsEmergencyBackup');
        
        if (emergencyBackup) {
            const backupData = JSON.parse(emergencyBackup);
            
            if (backupData.comments) {
                localStorage.setItem('promptComments', JSON.stringify(backupData.comments));
                showCommentFeedback('Dados recuperados do backup de emergência!', 'success');
                
                // Recarregar página para aplicar mudanças
                setTimeout(() => {
                    window.location.reload();
                }, 2000);
                
                return true;
            }
        }
        
        throw new Error('Backup de emergência não encontrado');
        
    } catch (error) {
        console.error('Erro na recuperação de emergência:', error);
        showCommentFeedback(`Erro na recuperação: ${error.message}`, 'danger');
        return false;
    }
}

/**
 * ✅ FUNÇÃO PARA ANÁLISE DE SENTIMENTO DOS COMENTÁRIOS
 */
function analyzeCommentSentiment(text) {
    // Palavras positivas e negativas em português
    const positiveWords = [
        'bom', 'ótimo', 'excelente', 'perfeito', 'útil', 'ajudou', 'obrigado', 
        'parabéns', 'sucesso', 'eficiente', 'claro', 'fácil', 'prático'
    ];
    
    const negativeWords = [
        'ruim', 'péssimo', 'terrível', 'inútil', 'problema', 'erro', 'difícil', 
        'complicado', 'confuso', 'lento', 'falha', 'bug'
    ];
    
    const words = text.toLowerCase().split(/\s+/);
    let positiveScore = 0;
    let negativeScore = 0;
    
    words.forEach(word => {
        if (positiveWords.includes(word)) positiveScore++;
        if (negativeWords.includes(word)) negativeScore++;
    });
    
    const totalScore = positiveScore - negativeScore;
    
    if (totalScore > 0) return 'positive';
    if (totalScore < 0) return 'negative';
    return 'neutral';
}

/**
 * ✅ FUNÇÃO PARA FILTRAR COMENTÁRIOS POR SENTIMENTO
 */
function filterCommentsBySentiment(promptId, sentiment) {
    const commentsList = document.querySelector(`#comments-${promptId} .comments-list`);
    if (!commentsList) return;
    
    const commentItems = commentsList.querySelectorAll('.comment-item');
    
    commentItems.forEach(item => {
        const commentText = item.querySelector('.comment-text').textContent;
        const commentSentiment = analyzeCommentSentiment(commentText);
        
        if (sentiment === 'all' || commentSentiment === sentiment) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
    
    // Adicionar indicador visual do filtro ativo
    const filterIndicator = commentsList.querySelector('.filter-indicator');
    if (filterIndicator) {
        filterIndicator.remove();
    }
    
    if (sentiment !== 'all') {
        const indicator = document.createElement('div');
        indicator.className = 'filter-indicator alert alert-info mb-3';
        indicator.innerHTML = `
            <i class="fas fa-filter me-2"></i>
            Mostrando apenas comentários ${sentiment === 'positive' ? 'positivos' : sentiment === 'negative' ? 'negativos' : 'neutros'}
            <button class="btn btn-sm btn-outline-secondary ms-2" onclick="filterCommentsBySentiment('${promptId}', 'all')">
                Mostrar todos
            </button>
        `;
        commentsList.insertBefore(indicator, commentsList.firstChild);
    }
}

/**
 * ✅ FUNÇÃO PARA BUSCAR COMENTÁRIOS
 */
function searchComments(promptId, searchTerm) {
    const commentsList = document.querySelector(`#comments-${promptId} .comments-list`);
    if (!commentsList) return;
    
    const commentItems = commentsList.querySelectorAll('.comment-item');
    const term = searchTerm.toLowerCase().trim();
    let visibleCount = 0;
    
    commentItems.forEach(item => {
        const commentText = item.querySelector('.comment-text').textContent.toLowerCase();
        const authorName = item.querySelector('.comment-author').textContent.toLowerCase();
        
        if (!term || commentText.includes(term) || authorName.includes(term)) {
            item.style.display = 'block';
            visibleCount++;
        } else {
            item.style.display = 'none';
        }
    });
    
    // Atualizar indicador de busca
    const searchIndicator = commentsList.querySelector('.search-indicator');
    if (searchIndicator) {
        searchIndicator.remove();
    }
    
    if (term) {
        const indicator = document.createElement('div');
        indicator.className = 'search-indicator alert alert-warning mb-3';
        indicator.innerHTML = `
            <i class="fas fa-search me-2"></i>
            Encontrados ${visibleCount} comentário(s) para "${escapeHtml(searchTerm)}"
            <button class="btn btn-sm btn-outline-secondary ms-2" onclick="searchComments('${promptId}', '')">
                Limpar busca
            </button>
        `;
        commentsList.insertBefore(indicator, commentsList.firstChild);
    }
}

/**
 * ✅ FUNÇÃO PARA ORDENAR COMENTÁRIOS
 */
function sortComments(promptId, sortBy) {
    const commentsList = document.querySelector(`#comments-${promptId} .comments-list`);
    if (!commentsList) return;
    
    const commentItems = Array.from(commentsList.querySelectorAll('.comment-item'));
    
    commentItems.sort((a, b) => {
        switch (sortBy) {
            case 'newest':
                const dateA = new Date(a.querySelector('.comment-date').textContent);
                const dateB = new Date(b.querySelector('.comment-date').textContent);
                return dateB - dateA;
                
            case 'oldest':
                const dateA2 = new Date(a.querySelector('.comment-date').textContent);
                const dateB2 = new Date(b.querySelector('.comment-date').textContent);
                return dateA2 - dateB2;
                
            case 'likes':
                const likesA = parseInt(a.querySelector('.btn-outline-success, .btn-success').textContent.match(/\d+/)?.[0] || 0);
                const likesB = parseInt(b.querySelector('.btn-outline-success, .btn-success').textContent.match(/\d+/)?.[0] || 0);
                return likesB - likesA;
                
            case 'author':
                const authorA = a.querySelector('.comment-author').textContent.toLowerCase();
                const authorB = b.querySelector('.comment-author').textContent.toLowerCase();
                return authorA.localeCompare(authorB);
                
            default:
                return 0;
        }
    });
    
    // Remover todos os comentários e adicionar na nova ordem
    commentItems.forEach(item => item.remove());
    
    // Preservar indicadores de filtro/busca
    const indicators = commentsList.querySelectorAll('.filter-indicator, .search-indicator');
    
    commentItems.forEach(item => commentsList.appendChild(item));
    
    // Adicionar indicador de ordenação
    const sortIndicator = commentsList.querySelector('.sort-indicator');
    if (sortIndicator) {
        sortIndicator.remove();
    }
    
    if (sortBy !== 'newest') {
        const indicator = document.createElement('div');
        indicator.className = 'sort-indicator alert alert-secondary mb-3';
        
        const sortLabels = {
            oldest: 'mais antigos primeiro',
            likes: 'mais úteis primeiro',
            author: 'por autor (A-Z)'
        };
        
        indicator.innerHTML = `
            <i class="fas fa-sort me-2"></i>
            Ordenado por: ${sortLabels[sortBy]}
            <button class="btn btn-sm btn-outline-secondary ms-2" onclick="sortComments('${promptId}', 'newest')">
                Ordem padrão
            </button>
        `;
        commentsList.insertBefore(indicator, commentsList.firstChild);
    }
}

/**
 * ✅ FUNÇÃO PARA CRIAR TOOLBAR DE COMENTÁRIOS
 */
function createCommentsToolbar(promptId) {
    return `
        <div class="comments-toolbar bg-light p-2 rounded mb-3">
            <div class="row g-2 align-items-center">
                <div class="col-md-4">
                    <div class="input-group input-group-sm">
                        <span class="input-group-text">
                            <i class="fas fa-search"></i>
                        </span>
                        <input type="text" 
                               class="form-control" 
                               placeholder="Buscar comentários..."
                               onkeyup="searchComments('${promptId}', this.value)">
                    </div>
                </div>
                
                <div class="col-md-3">
                    <select class="form-select form-select-sm" 
                            onchange="sortComments('${promptId}', this.value)">
                        <option value="newest">Mais recentes</option>
                        <option value="oldest">Mais antigos</option>
                        <option value="likes">Mais úteis</option>
                        <option value="author">Por autor</option>
                    </select>
                </div>
                
                <div class="col-md-3">
                    <select class="form-select form-select-sm" 
                            onchange="filterCommentsBySentiment('${promptId}', this.value)">
                        <option value="all">Todos os comentários</option>
                        <option value="positive">Positivos</option>
                        <option value="neutral">Neutros</option>
                        <option value="negative">Negativos</option>
                    </select>
                </div>
                
                <div class="col-md-2">
                    <button class="btn btn-sm btn-outline-primary w-100" 
                            onclick="refreshComments('${promptId}')"
                            title="Atualizar comentários">
                        <i class="fas fa-sync-alt"></i>
                    </button>
                </div>
            </div>
        </div>
    `;
}

/**
 * ✅ FUNÇÃO PARA ATUALIZAR COMENTÁRIOS
 */
async function refreshComments(promptId) {
    const refreshBtn = document.querySelector(`button[onclick="refreshComments('${promptId}')"]`);
    if (refreshBtn) {
        const originalHTML = refreshBtn.innerHTML;
        refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        refreshBtn.disabled = true;
        
        try {
            await loadCommentsForPrompt(promptId);
            showCommentFeedback('Comentários atualizados!', 'success');
        } catch (error) {
            showCommentFeedback('Erro ao atualizar comentários', 'danger');
        } finally {
            refreshBtn.innerHTML = originalHTML;
            refreshBtn.disabled = false;
        }
    }
}

/**
 * ✅ FUNÇÃO PARA EXPORTAR COMENTÁRIOS EM DIFERENTES FORMATOS
 */
function exportCommentsAdvanced(format = 'json', promptId = null) {
    try {
        const localComments = JSON.parse(localStorage.getItem('promptComments') || '{}');
        let dataToExport = promptId ? { [promptId]: localComments[promptId] || [] } : localComments;
        
        const exportData = {
            exportDate: new Date().toISOString(),
            version: '2.0',
            format: format,
            comments: dataToExport,
            statistics: getCommentsStatistics()
        };
        
        let content, filename, mimeType;
        
        switch (format) {
            case 'json':
                content = JSON.stringify(exportData, null, 2);
                filename = `comments_export_${new Date().toISOString().split('T')[0]}.json`;
                mimeType = 'application/json';
                break;
                
            case 'csv':
                content = convertCommentsToCSV(dataToExport);
                filename = `comments_export_${new Date().toISOString().split('T')[0]}.csv`;
                mimeType = 'text/csv';
                break;
                
            case 'txt':
                content = convertCommentsToText(dataToExport);
                filename = `comments_export_${new Date().toISOString().split('T')[0]}.txt`;
                mimeType = 'text/plain';
                break;
                
            default:
                throw new Error('Formato não suportado');
        }
        
        const dataBlob = new Blob([content], { type: mimeType });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = filename;
        link.click();
        
        showCommentFeedback(`Comentários exportados em formato ${format.toUpperCase()}!`, 'success');
        
    } catch (error) {
        console.error('Erro ao exportar comentários:', error);
        showCommentFeedback(`Erro ao exportar: ${error.message}`, 'danger');
    }
}

/**
 * ✅ FUNÇÃO AUXILIAR PARA CONVERTER COMENTÁRIOS EM CSV
 */
function convertCommentsToCSV(commentsData) {
    const headers = ['Prompt ID', 'Autor', 'Email', 'Texto', 'Data', 'Likes', 'Status', 'Tem Foto'];
    let csv = headers.join(',') + '\n';
    
    for (const promptId in commentsData) {
        const comments = commentsData[promptId];
        comments.forEach(comment => {
            const row = [
                promptId,
                `"${(comment.author || '').replace(/"/g, '""')}"`,
                `"${(comment.email || '').replace(/"/g, '""')}"`,
                `"${(comment.text || '').replace(/"/g, '""')}"`,
                comment.timestamp || '',
                comment.likes || 0,
                comment.isLocal ? 'Local' : 'Sincronizado',
                comment.photoURL ? 'Sim' : 'Não'
            ];
            csv += row.join(',') + '\n';
        });
    }
    
    return csv;
}

/**
 * ✅ FUNÇÃO AUXILIAR PARA CONVERTER COMENTÁRIOS EM TEXTO
 */
function convertCommentsToText(commentsData) {
    let text = 'RELATÓRIO DE COMENTÁRIOS\n';
    text += '========================\n\n';
    text += `Gerado em: ${new Date().toLocaleString('pt-BR')}\n\n`;
    
    for (const promptId in commentsData) {
        const comments = commentsData[promptId];
        text += `PROMPT ID: ${promptId}\n`;
        text += `Total de comentários: ${comments.length}\n`;
        text += '-'.repeat(50) + '\n\n';
        
        comments.forEach((comment, index) => {
            text += `${index + 1}. ${comment.author || 'Autor desconhecido'}\n`;
            text += `   Data: ${comment.timestamp ? new Date(comment.timestamp).toLocaleString('pt-BR') : 'N/A'}\n`;
            text += `   Likes: ${comment.likes || 0}\n`;
            text += `   Status: ${comment.isLocal ? 'Local' : 'Sincronizado'}\n`;
                        text += `   Texto: ${comment.text || ''}\n\n`;
        });
        
        text += '\n';
    }
    
    return text;
}

/**
 * ✅ FUNÇÃO PARA CONFIGURAR ATALHOS DE TECLADO
 */
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + Shift + C: Abrir/fechar todos os comentários
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'C') {
            e.preventDefault();
            toggleAllComments();
        }
        
        // Ctrl/Cmd + Shift + E: Exportar comentários
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'E') {
            e.preventDefault();
            exportComments();
        }
        
        // Ctrl/Cmd + Shift + S: Sincronizar comentários
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'S') {
            e.preventDefault();
            syncLocalCommentsToFirebase();
        }
        
        // Esc: Fechar modais ou limpar buscas ativas
        if (e.key === 'Escape') {
            clearActiveFilters();
        }
    });
}

/**
 * ✅ FUNÇÃO PARA ALTERNAR TODOS OS COMENTÁRIOS
 */
function toggleAllComments() {
    const commentsSections = document.querySelectorAll('[id^="comments-"]');
    const openSections = Array.from(commentsSections).filter(section => 
        section.classList.contains('show')
    );
    
    const shouldClose = openSections.length > commentsSections.length / 2;
    
    commentsSections.forEach(section => {
        const promptId = section.id.replace('comments-', '');
        const toggleBtn = document.querySelector(`[data-bs-target="#comments-${promptId}"]`);
        
        if (shouldClose) {
            section.classList.remove('show');
            if (toggleBtn) {
                toggleBtn.setAttribute('aria-expanded', 'false');
                const chevron = toggleBtn.querySelector('.fa-chevron-up, .fa-chevron-down');
                if (chevron) {
                    chevron.classList.remove('fa-chevron-up');
                    chevron.classList.add('fa-chevron-down');
                }
            }
        } else {
            section.classList.add('show');
            if (toggleBtn) {
                toggleBtn.setAttribute('aria-expanded', 'true');
                const chevron = toggleBtn.querySelector('.fa-chevron-up, .fa-chevron-down');
                if (chevron) {
                    chevron.classList.remove('fa-chevron-down');
                    chevron.classList.add('fa-chevron-up');
                }
            }
            // Carregar comentários se não carregados
            if (!section.dataset.loaded) {
                loadCommentsForPrompt(promptId);
            }
        }
    });
    
    showCommentFeedback(
        shouldClose ? 'Todos os comentários foram fechados' : 'Todos os comentários foram abertos',
        'info'
    );
}

/**
 * ✅ FUNÇÃO PARA LIMPAR FILTROS ATIVOS
 */
function clearActiveFilters() {
    // Limpar indicadores de filtro
    document.querySelectorAll('.filter-indicator, .search-indicator, .sort-indicator').forEach(indicator => {
        indicator.remove();
    });
    
    // Mostrar todos os comentários
    document.querySelectorAll('.comment-item').forEach(item => {
        item.style.display = 'block';
    });
    
    // Limpar campos de busca
    document.querySelectorAll('.comments-toolbar input[type="text"]').forEach(input => {
        input.value = '';
    });
    
    // Resetar selects
    document.querySelectorAll('.comments-toolbar select').forEach(select => {
        select.selectedIndex = 0;
    });
}

/**
 * ✅ FUNÇÃO PARA CONFIGURAR ACESSIBILIDADE
 */
function setupAccessibility() {
    // Adicionar atributos ARIA
    document.querySelectorAll('.comment-item').forEach((item, index) => {
        item.setAttribute('role', 'article');
        item.setAttribute('aria-label', `Comentário ${index + 1}`);
    });
    
    // Configurar navegação por teclado
    document.addEventListener('keydown', (e) => {
        const focusedElement = document.activeElement;
        
        // Navegação entre comentários com setas
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            const commentItems = Array.from(document.querySelectorAll('.comment-item'));
            const currentIndex = commentItems.indexOf(focusedElement.closest('.comment-item'));
            
            if (currentIndex !== -1) {
                e.preventDefault();
                const nextIndex = e.key === 'ArrowDown' ? 
                    Math.min(currentIndex + 1, commentItems.length - 1) :
                    Math.max(currentIndex - 1, 0);
                
                commentItems[nextIndex].focus();
                commentItems[nextIndex].scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
        
        // Enter para ativar botões
        if (e.key === 'Enter' && focusedElement.classList.contains('comment-item')) {
            const likeBtn = focusedElement.querySelector('.btn-outline-success, .btn-success');
            if (likeBtn) {
                likeBtn.click();
            }
        }
    });
    
    // Adicionar indicadores visuais para foco
    const style = document.createElement('style');
    style.textContent = `
        .comment-item:focus {
            outline: 2px solid #007bff;
            outline-offset: 2px;
            background-color: #f8f9fa;
        }
        
        .comment-item:focus-visible {
            outline: 2px solid #007bff;
            outline-offset: 2px;
        }
        
        @media (prefers-reduced-motion: reduce) {
            .comment-item {
                animation: none !important;
                transition: none !important;
            }
        }
        
        @media (prefers-high-contrast: high) {
            .comment-item {
                border: 2px solid;
            }
            
            .avatar i {
                opacity: 1;
            }
        }
    `;
    document.head.appendChild(style);
}

/**
 * ✅ FUNÇÃO PARA CONFIGURAR MODO OFFLINE
 */
function setupOfflineMode() {
    // Detectar mudanças no status de conexão
    window.addEventListener('online', () => {
        showCommentFeedback('Conexão restaurada! Sincronizando comentários...', 'success');
        setTimeout(syncLocalCommentsToFirebase, 1000);
        
        // Atualizar indicadores visuais
        document.querySelectorAll('.offline-indicator').forEach(indicator => {
            indicator.remove();
        });
    });
    
    window.addEventListener('offline', () => {
        showCommentFeedback('Modo offline ativado. Comentários serão salvos localmente.', 'warning');
        
        // Adicionar indicador visual
        const indicator = document.createElement('div');
        indicator.className = 'offline-indicator alert alert-warning position-fixed';
        indicator.style.cssText = 'top: 10px; right: 10px; z-index: 9999; max-width: 300px;';
        indicator.innerHTML = `
            <i class="fas fa-wifi-slash me-2"></i>
            <strong>Modo Offline</strong><br>
            <small>Comentários serão sincronizados quando a conexão for restaurada.</small>
        `;
        document.body.appendChild(indicator);
    });
    
    // Verificar status inicial
    if (!navigator.onLine) {
        window.dispatchEvent(new Event('offline'));
    }
}



/**
 * ✅ FUNÇÃO PARA CONFIGURAR ANALYTICS DE COMENTÁRIOS
 */
function setupCommentsAnalytics() {
    const analytics = {
        commentsViewed: 0,
        commentsPosted: 0,
        likesGiven: 0,
        searchesPerformed: 0,
        filtersUsed: 0,
        startTime: Date.now()
    };
    
    // Rastrear visualizações de comentários
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                analytics.commentsViewed++;
            }
        });
    });
    
    document.querySelectorAll('.comment-item').forEach(item => {
        observer.observe(item);
    });
    
    // Rastrear ações do usuário
    document.addEventListener('click', (e) => {
        if (e.target.closest('.submit-comment')) {
            analytics.commentsPosted++;
        } else if (e.target.closest('.btn-outline-success, .btn-success')) {
            analytics.likesGiven++;
        }
    });
    
    document.addEventListener('input', (e) => {
        if (e.target.matches('.comments-toolbar input[type="text"]')) {
            analytics.searchesPerformed++;
        }
    });
    
    document.addEventListener('change', (e) => {
        if (e.target.matches('.comments-toolbar select')) {
            analytics.filtersUsed++;
        }
    });
    
    // Salvar analytics ao sair
    window.addEventListener('beforeunload', () => {
        analytics.sessionDuration = Date.now() - analytics.startTime;
        localStorage.setItem('commentsAnalytics', JSON.stringify(analytics));
    });
    
    // Função para obter analytics
    window.getCommentsAnalytics = () => analytics;
}

/**
 * ✅ ATUALIZAÇÃO DA FUNÇÃO DE INICIALIZAÇÃO FINAL
 */
document.addEventListener('DOMContentLoaded', () => {
    // Validar integridade na inicialização
    setTimeout(() => {
        validateCommentsIntegrity();
        
        // Ativar otimizações se suportado
        if ('IntersectionObserver' in window) {
            optimizeCommentsPerformance();
        }
        
        // Configurar funcionalidades avançadas
        setupCommentNotifications();
        setupAutoBackup();
        setupKeyboardShortcuts();
        setupAccessibility();
        setupOfflineMode();
        setupCommentsAnalytics();
        
        // Tentar sincronizar comentários pendentes
        if (navigator.onLine) {
            syncLocalCommentsToFirebase();
        }
        
        // Configurar comentários em tempo real se autenticado
        firebase.auth().onAuthStateChanged(user => {
            if (user) {
                setupRealTimeComments();
            }
        });
        
        console.log('✅ Sistema de comentários totalmente inicializado');
        
    }, 2000);
});

/**
 * ✅ EXPORTAR TODAS AS FUNÇÕES PARA USO GLOBAL - VERSÃO FINAL
 */
if (typeof window !== 'undefined') {
    window.CommentsSystem = {
        // Funções principais
        init: initCommentsSystem,
        loadComments: loadCommentsForPrompt,
        saveComment: saveCommentToFirebase,
        
        // Sincronização
        syncComments: syncLocalCommentsToFirebase,
        
        // Gerenciamento
        clearCache: clearCommentsCache,
        exportComments: exportComments,
        exportCommentsAdvanced: exportCommentsAdvanced,
        importComments: importComments,
        
        // Validação e estatísticas
        validateIntegrity: validateCommentsIntegrity,
        getStatistics: getCommentsStatistics,
        generateReport: generateCommentsReport,
        
        // Performance e otimização
        optimize: optimizeCommentsPerformance,
        
        // Funcionalidades de foto
        uploadPhoto: uploadProfilePhoto,
        createAvatar: createAvatarElement,
        setupPhotoUpload: setupPhotoUpload,
        
        // Busca e filtros
        searchComments: searchComments,
        filterBySentiment: filterCommentsBySentiment,
        sortComments: sortComments,
        clearFilters: clearActiveFilters,
        
        // Moderação
        moderateComment: moderateComment,
        
        // Backup e recuperação
        listBackups: listAvailableBackups,
        restoreBackup: restoreFromBackup,
        emergencyRestore: emergencyRestore,
        
        // Utilitários
        toggleAllComments: toggleAllComments,
        refreshComments: refreshComments,
        analyzeSentiment: analyzeCommentSentiment,
        
        // Configuração
        config: COMMENTS_CONFIG,
        
        // Analytics
        getAnalytics: () => window.getCommentsAnalytics ? window.getCommentsAnalytics() : null
    };
    
        console.log('✅ CommentsSystem exportado globalmente com todas as funcionalidades');
}

/**
 * ✅ FUNÇÃO DE DIAGNÓSTICO COMPLETO DO SISTEMA
 */
function runSystemDiagnostics() {
    const diagnostics = {
        timestamp: new Date().toISOString(),
        firebaseStatus: 'unknown',
        localStorageStatus: 'unknown',
        commentsCount: 0,
        pendingSyncCount: 0,
        backupsCount: 0,
        errors: [],
        warnings: [],
        recommendations: []
    };
    
    try {
        // Verificar Firebase
        if (typeof firebase !== 'undefined' && firebase.auth && typeof window.db !== 'undefined') {
            diagnostics.firebaseStatus = 'connected';
        } else {
            diagnostics.firebaseStatus = 'disconnected';
            diagnostics.warnings.push('Firebase não está disponível - funcionando apenas offline');
        }
        
        // Verificar localStorage
        try {
            localStorage.setItem('test', 'test');
            localStorage.removeItem('test');
            diagnostics.localStorageStatus = 'available';
        } catch (error) {
            diagnostics.localStorageStatus = 'unavailable';
            diagnostics.errors.push('localStorage não está disponível');
        }
        
        // Contar comentários
        const localComments = JSON.parse(localStorage.getItem('promptComments') || '{}');
        diagnostics.commentsCount = Object.values(localComments)
            .reduce((total, comments) => total + comments.length, 0);
        
        // Contar comentários pendentes de sincronização
        diagnostics.pendingSyncCount = Object.values(localComments)
            .flat()
            .filter(comment => comment.isLocal && comment.id.startsWith('local_')).length;
        
        // Contar backups
        diagnostics.backupsCount = Object.keys(localStorage)
            .filter(key => key.startsWith('commentsBackup_')).length;
        
        // Verificar integridade
        const integrityResult = validateCommentsIntegrity();
        if (integrityResult.totalIssues > 0) {
            diagnostics.warnings.push(`${integrityResult.totalIssues} problema(s) de integridade encontrado(s)`);
        }
        
        // Recomendações
        if (diagnostics.pendingSyncCount > 0) {
            diagnostics.recommendations.push('Execute syncLocalCommentsToFirebase() para sincronizar comentários pendentes');
        }
        
        if (diagnostics.backupsCount === 0) {
            diagnostics.recommendations.push('Configure backups automáticos para maior segurança');
        }
        
        if (diagnostics.commentsCount > 1000) {
            diagnostics.recommendations.push('Considere otimizar a performance com lazy loading');
        }
        
    } catch (error) {
        diagnostics.errors.push(`Erro durante diagnóstico: ${error.message}`);
    }
    
    return diagnostics;
}

/**
 * ✅ FUNÇÃO PARA MOSTRAR RELATÓRIO DE DIAGNÓSTICO
 */
function showDiagnosticsReport() {
    const diagnostics = runSystemDiagnostics();
    
    let report = `
🔍 RELATÓRIO DE DIAGNÓSTICO DO SISTEMA DE COMENTÁRIOS
=====================================================

📊 STATUS GERAL:
• Firebase: ${diagnostics.firebaseStatus}
• LocalStorage: ${diagnostics.localStorageStatus}
• Total de comentários: ${diagnostics.commentsCount}
• Comentários pendentes: ${diagnostics.pendingSyncCount}
• Backups disponíveis: ${diagnostics.backupsCount}

`;

    if (diagnostics.errors.length > 0) {
        report += `❌ ERROS:\n`;
        diagnostics.errors.forEach(error => {
            report += `• ${error}\n`;
        });
        report += '\n';
    }
    
    if (diagnostics.warnings.length > 0) {
        report += `⚠️ AVISOS:\n`;
        diagnostics.warnings.forEach(warning => {
            report += `• ${warning}\n`;
        });
        report += '\n';
    }
    
    if (diagnostics.recommendations.length > 0) {
        report += `💡 RECOMENDAÇÕES:\n`;
        diagnostics.recommendations.forEach(rec => {
            report += `• ${rec}\n`;
        });
        report += '\n';
    }
    
    report += `📅 Relatório gerado em: ${new Date(diagnostics.timestamp).toLocaleString('pt-BR')}`;
    
    console.log(report);
    
    // Mostrar também na interface se possível
    if (typeof showCommentFeedback === 'function') {
        const status = diagnostics.errors.length > 0 ? 'danger' : 
                     diagnostics.warnings.length > 0 ? 'warning' : 'success';
        showCommentFeedback('Diagnóstico concluído. Verifique o console para detalhes.', status);
    }
    
    return diagnostics;
}

/**
 * ✅ FUNÇÃO PARA AUTO-CORREÇÃO DE PROBLEMAS
 */
async function autoFixCommonIssues() {
    const fixes = {
        applied: [],
        failed: [],
        skipped: []
    };
    
    try {
        // 1. Validar e corrigir integridade
        const integrityResult = validateCommentsIntegrity();
        if (integrityResult.fixedIssues > 0) {
            fixes.applied.push(`Corrigidos ${integrityResult.fixedIssues} problemas de integridade`);
        }
        
        // 2. Tentar sincronizar comentários pendentes
        if (navigator.onLine) {
            try {
                await syncLocalCommentsToFirebase();
                fixes.applied.push('Comentários pendentes sincronizados');
            } catch (error) {
                fixes.failed.push(`Falha na sincronização: ${error.message}`);
            }
        } else {
            fixes.skipped.push('Sincronização pulada (offline)');
        }
        
        // 3. Limpar backups antigos (manter apenas 7)
        const backupKeys = Object.keys(localStorage)
            .filter(key => key.startsWith('commentsBackup_'))
            .sort()
            .reverse();
        
        if (backupKeys.length > 7) {
            const toRemove = backupKeys.slice(7);
            toRemove.forEach(key => localStorage.removeItem(key));
            fixes.applied.push(`Removidos ${toRemove.length} backups antigos`);
        }
        
        // 4. Verificar e corrigir configurações
        if (!localStorage.getItem('commentsConfig')) {
            localStorage.setItem('commentsConfig', JSON.stringify(COMMENTS_CONFIG));
            fixes.applied.push('Configurações padrão restauradas');
        }
        
        // 5. Recriar CSS se necessário
        if (!document.getElementById('comments-css')) {
            addCommentsCSS();
            fixes.applied.push('Estilos CSS restaurados');
        }
        
    } catch (error) {
        fixes.failed.push(`Erro durante auto-correção: ${error.message}`);
    }
    
    // Relatório de correções
    let report = '🔧 AUTO-CORREÇÃO CONCLUÍDA\n';
    
    if (fixes.applied.length > 0) {
        report += '\n✅ CORREÇÕES APLICADAS:\n';
        fixes.applied.forEach(fix => report += `• ${fix}\n`);
    }
    
    if (fixes.failed.length > 0) {
        report += '\n❌ CORREÇÕES FALHARAM:\n';
        fixes.failed.forEach(fix => report += `• ${fix}\n`);
    }
    
    if (fixes.skipped.length > 0) {
        report += '\n⏭️ CORREÇÕES PULADAS:\n';
        fixes.skipped.forEach(fix => report += `• ${fix}\n`);
    }
    
    console.log(report);
    
    if (typeof showCommentFeedback === 'function') {
        const totalFixed = fixes.applied.length;
        if (totalFixed > 0) {
            showCommentFeedback(`Auto-correção aplicou ${totalFixed} correção(ões)`, 'success');
        } else {
            showCommentFeedback('Nenhuma correção necessária', 'info');
        }
    }
    
    return fixes;
}

/**
 * ✅ ADICIONAR FUNÇÕES DE DIAGNÓSTICO AO OBJETO GLOBAL
 */
if (typeof window !== 'undefined') {
    // Adicionar às funções já existentes
    window.CommentsSystem.runDiagnostics = runSystemDiagnostics;
    window.CommentsSystem.showDiagnostics = showDiagnosticsReport;
    window.CommentsSystem.autoFix = autoFixCommonIssues;
    
    // Comando de console amigável
    window.CommentsSystem.help = function() {
        console.log(`
🎯 SISTEMA DE COMENTÁRIOS - COMANDOS DISPONÍVEIS
===============================================

📊 DIAGNÓSTICO:
• CommentsSystem.runDiagnostics() - Executar diagnóstico
• CommentsSystem.showDiagnostics() - Mostrar relatório completo
• CommentsSystem.autoFix() - Auto-correção de problemas

💾 DADOS:
• CommentsSystem.getStatistics() - Estatísticas dos comentários
• CommentsSystem.exportComments() - Exportar comentários
• CommentsSystem.clearCache() - Limpar cache local

🔄 SINCRONIZAÇÃO:
• CommentsSystem.syncComments() - Sincronizar com Firebase
• CommentsSystem.validateIntegrity() - Validar integridade

🔍 BUSCA E FILTROS:
• CommentsSystem.searchComments(promptId, termo) - Buscar
• CommentsSystem.filterBySentiment(promptId, sentimento) - Filtrar
• CommentsSystem.sortComments(promptId, ordenacao) - Ordenar

🛠️ UTILITÁRIOS:
• CommentsSystem.toggleAllComments() - Abrir/fechar todos
• CommentsSystem.refreshComments(promptId) - Atualizar
• CommentsSystem.clearFilters() - Limpar filtros

📱 BACKUP:
• CommentsSystem.listBackups() - Listar backups
• CommentsSystem.restoreBackup(data) - Restaurar backup
• CommentsSystem.emergencyRestore() - Recuperação de emergência

⚙️ CONFIGURAÇÃO:
• CommentsSystem.config - Configurações do sistema
• CommentsSystem.getAnalytics() - Analytics de uso

Para mais detalhes, consulte a documentação ou execute showDiagnostics()
        `);
    };
    
    console.log('✅ Sistema de comentários carregado! Digite CommentsSystem.help() para ver comandos disponíveis.');
}

/**
 * ✅ INICIALIZAÇÃO AUTOMÁTICA DE DIAGNÓSTICO (APENAS EM DESENVOLVIMENTO)
 */
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    // Executar diagnóstico automático apenas em desenvolvimento
    setTimeout(() => {
        const diagnostics = runSystemDiagnostics();
        if (diagnostics.errors.length > 0 || diagnostics.warnings.length > 0) {
            console.warn('⚠️ Problemas detectados no sistema de comentários. Execute CommentsSystem.showDiagnostics() para detalhes.');
        }
    }, 5000);
}

// ✅ FINAL DO ARQUIVO - SISTEMA COMPLETO
console.log('🚀 Sistema de Comentários v2.0 - Carregamento completo!');


