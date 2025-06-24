/**
 * Interface do Sistema de Comentários
 * Versão 1.0 - Templates e componentes visuais
 */

const CommentsUI = {
    
    /**
     * Gerar seção de comentários para um prompt
     */
    generateCommentsSection(promptId, commentCount = 0) {
        return `
            <div class="comments-section mt-3" data-prompt-id="${promptId}">
                
                <!-- Header dos comentários -->
                <div class="comments-header d-flex justify-content-between align-items-center mb-2">
                    <button class="btn btn-sm btn-outline-info comments-toggle" 
                            type="button"
                            data-bs-toggle="collapse" 
                            data-bs-target="#comments-${promptId}"
                            aria-expanded="false"
                            aria-controls="comments-${promptId}">
                        <i class="fas fa-comments"></i> 
                        Comentários (<span class="comment-count">${commentCount}</span>)
                    </button>
                    
                    <button class="btn btn-sm btn-primary add-comment-btn" 
                            type="button"
                            data-bs-toggle="collapse" 
                            data-bs-target="#comments-${promptId}"
                            title="Adicionar comentário">
                        <i class="fas fa-plus"></i> 
                        <span class="d-none d-md-inline ms-1">Comentar</span>
                    </button>
                </div>
                
                <!-- Container dos comentários (colapsável) -->
                <div id="comments-${promptId}" class="collapse comments-container">
                    
                    <!-- Formulário para novo comentário -->
                    <div class="comment-form card bg-light mb-3">
                        <div class="card-body p-3">
                            <div class="d-flex gap-2 align-items-start">
                                <!-- Avatar do usuário atual (se disponível) -->
                                <div class="comment-avatar-placeholder bg-secondary text-white rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" 
                                     style="width: 32px; height: 32px; font-size: 14px;">
                                    <i class="fas fa-user"></i>
                                </div>
                                
                                <!-- Campo de texto -->
                                <div class="flex-grow-1">
                                    <textarea class="form-control comment-input" 
                                              placeholder="Escreva seu comentário... (Ctrl+Enter para enviar)" 
                                              rows="3" 
                                              maxlength="500"
                                              data-prompt-id="${promptId}"></textarea>
                                    
                                    <!-- Footer do formulário -->
                                    <div class="d-flex justify-content-between align-items-center mt-2">
                                        <small class="text-muted">
                                            <span class="char-counter">0/500</span> caracteres
                                        </small>
                                        
                                        <button class="btn btn-primary btn-sm submit-comment-btn" 
                                                type="button"
                                                data-prompt-id="${promptId}">
                                            <i class="fas fa-paper-plane"></i> 
                                            Enviar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Lista de comentários -->
                    <div class="comments-list">
                        <!-- Comentários serão carregados aqui -->
                        <div class="text-center text-muted py-3">
                            <div class="spinner-border spinner-border-sm" role="status">
                                <span class="visually-hidden">Carregando...</span>
                            </div>
                            <p class="mt-2 mb-0">Carregando comentários...</p>
                        </div>
                    </div>
                    
                </div>
            </div>
        `;
    },

    /**
     * Template de comentário vazio (quando não há comentários)
     */
    generateEmptyCommentsTemplate() {
        return `
            <div class="empty-comments text-center text-muted py-4">
                <i class="fas fa-comments fa-3x mb-3 opacity-50"></i>
                <h6>Nenhum comentário ainda</h6>
                <p class="mb-0">Seja o primeiro a compartilhar sua opinião!</p>
            </div>
        `;
    },

    /**
     * Template de loading para comentários
     */
    generateLoadingTemplate() {
        return `
            <div class="comments-loading text-center py-3">
                <div class="spinner-border spinner-border-sm text-primary" role="status">
                    <span class="visually-hidden">Carregando comentários...</span>
                </div>
                <p class="mt-2 mb-0 text-muted">Carregando comentários...</p>
            </div>
        `;
    },

    /**
     * Template de erro ao carregar comentários
     */
    generateErrorTemplate() {
        return `
            <div class="comments-error text-center py-3">
                <i class="fas fa-exclamation-triangle text-warning fa-2x mb-2"></i>
                <p class="text-muted mb-2">Erro ao carregar comentários</p>
                <button class="btn btn-sm btn-outline-primary retry-load-comments">
                    <i class="fas fa-redo"></i> Tentar novamente
                </button>
            </div>
        `;
    },

    /**
     * Atualizar avatar do usuário no formulário
     */
    updateUserAvatar(promptId, userInfo) {
        const avatarPlaceholder = document.querySelector(`#comments-${promptId} .comment-avatar-placeholder`);
        if (!avatarPlaceholder || !userInfo) return;
        
        if (userInfo.photoURL) {
            // Substituir por imagem real
            avatarPlaceholder.outerHTML = `
                <img src="${userInfo.photoURL}" 
                     class="comment-avatar rounded-circle flex-shrink-0" 
                     width="32" height="32" 
                     alt="Seu avatar" 
                     loading="lazy">
            `;
        } else {
            // Atualizar placeholder com inicial do nome
            avatarPlaceholder.innerHTML = userInfo.userName.charAt(0).toUpperCase();
            avatarPlaceholder.classList.remove('bg-secondary');
            avatarPlaceholder.classList.add('bg-primary');
        }
    },

    /**
     * Adicionar efeitos visuais aos comentários
     */
    addVisualEffects() {
        // Efeito hover nos comentários
        const style = document.createElement('style');
        style.textContent = `
            .comment-item {
                transition: all 0.2s ease;
            }
            
            .comment-item:hover {
                background-color: rgba(13, 110, 253, 0.05);
                border-radius: 8px;
                padding: 8px;
                margin: -8px;
                margin-bottom: 4px;
            }
            
            .comment-avatar, .comment-avatar-placeholder {
                transition: transform 0.2s ease;
            }
            
            .comment-item:hover .comment-avatar,
            .comment-item:hover .comment-avatar-placeholder {
                transform: scale(1.05);
            }
            
            .comment-input:focus {
                border-color: #0d6efd;
                box-shadow: 0 0 0 0.2rem rgba(13, 110, 253, 0.25);
            }
            
            .comments-section {
                border-top: 1px solid #dee2e6;
                padding-top: 1rem;
            }
            
            .comment-form {
                border: 1px dashed #dee2e6;
                background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
            }
            
            .like-comment-btn.btn-primary {
                background-color: #198754;
                border-color: #198754;
            }
            
            .char-counter.text-danger {
                font-weight: bold;
            }
        `;
        
                // Adicionar estilos ao head se ainda não existir
        if (!document.getElementById('comments-ui-styles')) {
            style.id = 'comments-ui-styles';
            document.head.appendChild(style);
        }
    },

    /**
     * Animar contador de comentários
     */
    animateCommentCounter(element, newValue) {
        if (!element) return;
        
        const currentValue = parseInt(element.textContent) || 0;
        
        if (newValue > currentValue) {
            // Animação de incremento
            element.style.transform = 'scale(1.2)';
            element.style.color = '#198754';
            
            setTimeout(() => {
                element.textContent = newValue;
                element.style.transform = 'scale(1)';
                element.style.color = '';
            }, 150);
        } else {
            element.textContent = newValue;
        }
    },

    /**
     * Mostrar toast de feedback específico para comentários
     */
    showCommentToast(message, type = 'info') {
        // Criar toast container se não existir
        let toastContainer = document.getElementById('comment-toast-container');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.id = 'comment-toast-container';
            toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
            toastContainer.style.zIndex = '9999';
            document.body.appendChild(toastContainer);
        }

        // Criar toast
        const toastId = 'toast-' + Date.now();
        const toastHTML = `
            <div id="${toastId}" class="toast align-items-center text-white bg-${type === 'success' ? 'success' : type === 'danger' ? 'danger' : 'primary'} border-0" role="alert">
                <div class="d-flex">
                    <div class="toast-body">
                        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'danger' ? 'exclamation-triangle' : 'info-circle'} me-2"></i>
                        ${message}
                    </div>
                    <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
                </div>
            </div>
        `;

        toastContainer.insertAdjacentHTML('beforeend', toastHTML);

        // Inicializar e mostrar toast
        const toastElement = document.getElementById(toastId);
        const toast = new bootstrap.Toast(toastElement, {
            autohide: true,
            delay: 3000
        });
        
        toast.show();

        // Remover elemento após esconder
        toastElement.addEventListener('hidden.bs.toast', () => {
            toastElement.remove();
        });
    },

    /**
     * Criar indicador de usuário institucional
     */
    createInstitutionalBadge(isInstitutional, department = null) {
        if (!isInstitutional) return '';
        
        return `
            <span class="badge bg-primary bg-opacity-25 text-primary ms-1" 
                  title="Usuário Institucional${department ? ' - ' + department : ''}">
                <i class="fas fa-shield-alt"></i> 
                PGE-SC
            </span>
        `;
    },

    /**
     * Formatar nome do usuário para exibição
     */
    formatUserName(userName, isInstitutional = false) {
        if (!userName) return 'Usuário Anônimo';
        
        // Limitar tamanho do nome
        const maxLength = 25;
        const displayName = userName.length > maxLength ? 
            userName.substring(0, maxLength) + '...' : 
            userName;
        
        return this.escapeHtml(displayName);
    },

    /**
     * Criar botões de ação do comentário
     */
    createCommentActions(commentId, likes = 0, canEdit = false) {
        const likedComments = JSON.parse(localStorage.getItem('likedComments') || '[]');
        const isLiked = likedComments.includes(commentId);
        
        return `
            <div class="comment-actions d-flex gap-1">
                <button class="btn btn-sm ${isLiked ? 'btn-success' : 'btn-outline-primary'} like-comment-btn" 
                        data-comment-id="${commentId}"
                        ${isLiked ? 'disabled' : ''}
                        title="${isLiked ? 'Você já curtiu' : 'Curtir comentário'}">
                    <i class="fas fa-thumbs-up"></i> 
                    <span class="like-count">${likes}</span>
                </button>
                
                ${canEdit ? `
                    <button class="btn btn-sm btn-outline-secondary edit-comment-btn" 
                            data-comment-id="${commentId}"
                            title="Editar comentário">
                        <i class="fas fa-edit"></i>
                    </button>
                ` : ''}
                
                <button class="btn btn-sm btn-outline-warning report-comment-btn" 
                        data-comment-id="${commentId}"
                        title="Reportar comentário">
                    <i class="fas fa-flag"></i>
                </button>
            </div>
        `;
    },

    /**
     * Escapar HTML
     */
    escapeHtml(text) {
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
};

// Inicializar efeitos visuais quando DOM carregar
document.addEventListener('DOMContentLoaded', () => {
    CommentsUI.addVisualEffects();
});

// Expor globalmente
if (typeof window !== 'undefined') {
    window.CommentsUI = CommentsUI;
}

console.log('🎨 comments-ui.js carregado');

