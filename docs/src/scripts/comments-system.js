/**
 * Sistema de Comentários - VERSÃO COMPLETA COM FIREBASE
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
 * Capturar informações do usuário (usar a função do sugestoes.js se disponível)
 */
async function captureUserInfoForComments() {
    try {
        // Tentar usar a função do sugestoes.js
        if (typeof captureUserInfo === 'function') {
            return await captureUserInfo();
        }
        
        // Fallback simples
        return {
            userName: 'Usuário',
            userEmail: 'usuario@pge.sc.gov.br',
            sessionId: 'session_' + Date.now(),
            timestamp: new Date().toISOString(),
            isInstitutional: false
        };
    } catch (error) {
        console.error('Erro ao capturar usuário:', error);
        return {
            userName: 'Usuário Anônimo',
            userEmail: 'anonimo@pge.sc.gov.br',
            sessionId: 'anon_' + Date.now(),
            timestamp: new Date().toISOString(),
            isInstitutional: false
        };
    }
}

/**
 * ✅ SALVAR COMENTÁRIO NO FIREBASE
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
                sessionId: userInfo.sessionId || 'session_' + Date.now(),
                isInstitutional: userInfo.isInstitutional || false
            },
            likes: 0,
            isModerated: false,
            status: 'approved'
        };
        
        const docRef = await window.db.collection("prompt_comments").add(commentData);
        
        // Salvar backup local
        saveCommentToLocalStorage(promptId, commentText, docRef.id, userInfo.userName);
        
        return {
            id: docRef.id,
            success: true,
            author: userInfo.userName
        };
        
    } catch (error) {
        console.error('Erro ao salvar no Firebase:', error);
        
        // Fallback: salvar apenas localmente
        const localId = 'local_' + Date.now();
        const userInfo = await captureUserInfoForComments();
        saveCommentToLocalStorage(promptId, commentText, localId, userInfo.userName);
        
        return {
            id: localId,
            success: false,
            author: userInfo.userName,
            error: error.message
        };
    }
}

/**
 * ✅ CARREGAR COMENTÁRIOS DO FIREBASE
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
                timestamp: data.timestamp,
                likes: data.likes || 0,
                isModerated: data.isModerated || false,
                isLocal: false
            });
        });
        
        // Salvar backup local
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
 * ✅ SALVAR COMENTÁRIO NO LOCALSTORAGE (BACKUP)
 */
function saveCommentToLocalStorage(promptId, commentText, commentId, author = 'Você') {
    try {
        const localComments = JSON.parse(localStorage.getItem('promptComments') || '{}');
        
        if (!localComments[promptId]) {
            localComments[promptId] = [];
        }
        
        const newComment = {
            id: commentId,
            text: commentText,
            author: author,
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
 * ✅ RENDERIZAR COMENTÁRIOS CARREGADOS
 */
function renderLoadedComments(comments, commentsList) {
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
    
    comments.forEach(comment => {
        const commentElement = createLoadedCommentElement(comment);
        commentsList.appendChild(commentElement);
    });
}

/**
 * ✅ CRIAR ELEMENTO DE COMENTÁRIO CARREGADO
 */
function createLoadedCommentElement(comment) {
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
    
    commentElement.innerHTML = `
        <div class="d-flex align-items-start">
            <div class="avatar me-3">
                <i class="fas fa-user-circle fa-2x text-primary"></i>
            </div>
            <div class="comment-content flex-grow-1">
                <div class="comment-header d-flex justify-content-between align-items-center mb-2">
                    <div class="d-flex align-items-center">
                        <strong class="comment-author text-primary">${escapeHtml(comment.author)}</strong>
                        ${sourceIndicator}
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
 * Manipular toggle de comentários (abrir/fechar)
 */
function handleCommentsToggle(e) {
    const toggleBtn = e.target.closest('.toggle-comments');
    if (!toggleBtn) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const promptId = toggleBtn.getAttribute('data-prompt-id');
    const target = toggleBtn.getAttribute('data-bs-target');
    
    const commentsContent = document.querySelector(target);
    if (!commentsContent) {
        console.error('Seção de comentários não encontrada:', target);
        return;
    }
    
    const isOpen = commentsContent.classList.contains('show');
    
    if (isOpen) {
        // Fechar comentários
        commentsContent.classList.remove('show');
        toggleBtn.setAttribute('aria-expanded', 'false');
        
        // Atualizar ícone
        const chevron = toggleBtn.querySelector('.fa-chevron-up, .fa-chevron-down');
        if (chevron) {
            chevron.classList.remove('fa-chevron-up');
            chevron.classList.add('fa-chevron-down');
        }
    } else {
        // Abrir comentários
        commentsContent.classList.add('show');
        toggleBtn.setAttribute('aria-expanded', 'true');
        
        // Atualizar ícone
        const chevron = toggleBtn.querySelector('.fa-chevron-up, .fa-chevron-down');
        if (chevron) {
            chevron.classList.remove('fa-chevron-down');
            chevron.classList.add('fa-chevron-up');
        }
        
        // ✅ Carregar comentários do Firebase
        loadCommentsForPrompt(promptId);
    }
}

/**
 * Manipular envio de comentários
 */
function handleCommentSubmit(e) {
    const submitBtn = e.target.closest('.submit-comment');
    if (!submitBtn) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const promptId = submitBtn.getAttribute('data-prompt-id');
    
    // Encontrar elementos relacionados
    const commentForm = submitBtn.closest('.comment-form');
    const textarea = commentForm?.querySelector('.comment-input');
    const commentsList = submitBtn.closest('.comments-content')?.querySelector('.comments-list');
    
    if (!textarea || !commentsList) {
        console.error('Elementos necessários não encontrados');
        return;
    }
    
    const commentText = textarea.value.trim();
    
    // Validações
    if (!commentText) {
        showCommentFeedback('Por favor, digite um comentário!', 'warning');
        textarea.focus();
        return;
    }
    
    if (commentText.length < 3) {
        showCommentFeedback('Comentário deve ter pelo menos 3 caracteres!', 'warning');
        return;
    }
    
    if (commentText.length > COMMENTS_CONFIG.maxLength) {
        showCommentFeedback(`Comentário muito longo! Máximo ${COMMENTS_CONFIG.maxLength} caracteres.`, 'danger');
        return;
    }
    
    // ✅ Processar envio com Firebase
    processCommentSubmission(promptId, commentText, submitBtn, textarea, commentsList);
}

/**
 * ✅ PROCESSAR ENVIO DO COMENTÁRIO - VERSÃO COM FIREBASE
 */
async function processCommentSubmission(promptId, commentText, submitBtn, textarea, commentsList) {
    // Desabilitar botão e mostrar loading
    const originalHTML = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i>Enviando...';
    
    try {
        // ✅ SALVAR NO FIREBASE
        const result = await saveCommentToFirebase(promptId, commentText);
        
        // Criar elemento do comentário
        const commentElement = createCommentElement(commentText, promptId, result.author);
        
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
 * Criar elemento HTML do comentário (para comentários novos)
 */
function createCommentElement(commentText, promptId, author = 'Você') {
    const commentElement = document.createElement('div');
    commentElement.className = 'comment-item border-bottom pb-3 mb-3';
    commentElement.style.animation = 'fadeIn 0.5s ease-in';
    
    const timestamp = COMMENTS_CONFIG.showTimestamp ?
        new Date().toLocaleString('pt-BR') : 'Agora mesmo';
    
    commentElement.innerHTML = `
        <div class="d-flex align-items-start">
            <div class="avatar me-3">
                <i class="fas fa-user-circle fa-2x text-primary"></i>
            </div>
            <div class="comment-content flex-grow-1">
                <div class="comment-header d-flex justify-content-between align-items-center mb-2">
                    <div class="d-flex align-items-center">
                        <strong class="comment-author text-primary">${escapeHtml(author)}</strong>
                        <small class="badge bg-info ms-2">Novo</small>
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
 * ✅ CARREGAR COMENTÁRIOS PARA UM PROMPT - VERSÃO COM FIREBASE
 */
async function loadCommentsForPrompt(promptId) {
    const commentsList = document.querySelector(`#comments-${promptId} .comments-list`);
    if (!commentsList) {
        return;
    }
    
    // Mostrar loading
    commentsList.innerHTML = '<div class="text-center py-3"><i class="fas fa-spinner fa-spin"></i> Carregando comentários...</div>';
    
    try {
        // ✅ CARREGAR DO FIREBASE
        const comments = await loadCommentsFromFirebase(promptId);
        
        // Renderizar comentários
        renderLoadedComments(comments, commentsList);
        
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

function deleteComment(button) {
    if (confirm('Tem certeza que deseja excluir este comentário?')) {
        const commentItem = button.closest('.comment-item');
        const commentId = commentItem.getAttribute('data-comment-id');
        
        commentItem.style.animation = 'fadeOut 0.3s ease-out';
        setTimeout(() => {
            commentItem.remove();
            showCommentFeedback('Comentário excluído!', 'success');
            
            // ✅ Excluir do Firebase se não for local
            if (commentId && !commentId.startsWith('local_')) {
                deleteCommentFromFirebase(commentId);
            }
        }, 300);
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
 * CSS para animações
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
        
        .comments-content {
            transition: all 0.3s ease;
            overflow: hidden;
        }
        
        .comments-content:not(.show) {
            max-height: 0;
            opacity: 0;
        }
        
        .comments-content.show {
            max-height: none;
            opacity: 1;
        }
        
        .comment-item {
            transition: all 0.3s ease;
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
        
        .avatar i {
            opacity: 0.7;
        }
        
        .comment-actions .btn {
            font-size: 0.8em;
            padding: 0.25rem 0.5rem;
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
        
        for (const promptId in localComments) {
            const comments = localComments[promptId];
            if (comments.length > 0) {
                promptsWithComments++;
                totalComments += comments.length;
                
                comments.forEach(comment => {
                    if (comment.isLocal) {
                        localOnlyComments++;
                    }
                });
            }
        }
        
        return {
            totalComments,
            localOnlyComments,
            promptsWithComments,
            syncedComments: totalComments - localOnlyComments
        };
    } catch (error) {
        console.error('Erro ao obter estatísticas:', error);
        return {
            totalComments: 0,
            localOnlyComments: 0,
            promptsWithComments: 0,
            syncedComments: 0
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
            version: '1.0',
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

// Inicializar sistema quando o script for carregado
initCommentsSystem();
addCommentsCSS();

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
        
        // Configuração
        config: COMMENTS_CONFIG
    };
}

/**
 * ✅ INICIALIZAÇÃO FINAL COM VERIFICAÇÕES
 */
document.addEventListener('DOMContentLoaded', () => {
    // Validar integridade na inicialização
    setTimeout(() => {
        validateCommentsIntegrity();
        
        // Ativar otimizações se suportado
        if ('IntersectionObserver' in window) {
            optimizeCommentsPerformance();
        }
        
        // Tentar sincronizar comentários pendentes
        if (navigator.onLine) {
            syncLocalCommentsToFirebase();
        }
    }, 2000);
});

/**
 * ✅ TRATAMENTO DE ERROS GLOBAL
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
 * ✅ CLEANUP AO SAIR DA PÁGINA
 */
window.addEventListener('beforeunload', () => {
    // Tentar sincronizar comentários pendentes
    if (navigator.onLine) {
        syncLocalCommentsToFirebase();
    }
});

