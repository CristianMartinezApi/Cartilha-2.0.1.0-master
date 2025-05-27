document.addEventListener('DOMContentLoaded', function() {
    console.log('Admin panel carregado');
    
    // Verificar se o Firebase está inicializado
    if (typeof firebase === 'undefined') {
        console.error('Firebase não está inicializado. Verifique se os scripts do Firebase foram carregados.');
        return;
    }
    
    // Inicializar Firebase
    const db = firebase.firestore();
    console.log('Firebase inicializado no admin');
    
    // Elementos DOM - com verificação de existência
    const menuToggle = document.querySelector('#menu-toggle');
    const sidebar = document.querySelector('.admin-sidebar');
    
    // Configurar menu toggle apenas se os elementos existirem
    if (menuToggle && sidebar) {
        menuToggle.addEventListener('click', function() {
            sidebar.classList.toggle('collapsed');
        });
    }
    
    // Elementos da UI
    const pendingSuggestions = document.getElementById('pending-suggestions');
    const approvedSuggestions = document.getElementById('approved-suggestions');
    const feedbackList = document.getElementById('feedback-list');
    const navItems = document.querySelectorAll('.nav-item');
    const contentTabs = document.querySelectorAll('.content-tab');
    const searchInput = document.getElementById('search-input');
    const categoryFilter = document.getElementById('category-filter');
    const pendingCount = document.getElementById('pending-count');
    const approvedCount = document.getElementById('approved-count');
    const modal = document.getElementById('suggestion-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    const modalFooter = document.getElementById('modal-footer');
    const closeModal = document.querySelector('.close-modal');
    
    // Variáveis de estado
    let allPendingSuggestions = [];
    let allApprovedSuggestions = [];
    let allFeedbacks = [];
    let allCategories = [];
    let currentFilter = 'all';
    let currentSearch = '';
    
    // Inicialização
    init();
    
    // Função de inicialização
    function init() {
        // Carregar categorias
        loadCategories();
        
        // Carregar sugestões pendentes
        loadPendingSuggestions();
        
        // Carregar sugestões aprovadas
        loadApprovedSuggestions();
        
        // Carregar feedbacks
        loadFeedbacks();
        
        // Configurar navegação
        setupNavigation();
        
        // Configurar pesquisa e filtros
        setupSearchAndFilters();
        
        // Configurar modal
        setupModal();
        
        // Configurar botões de atualização
        const refreshPending = document.getElementById('refresh-pending');
        const refreshApproved = document.getElementById('refresh-approved');
        const exportApproved = document.getElementById('export-approved');
        
        if (refreshPending) refreshPending.addEventListener('click', loadPendingSuggestions);
        if (refreshApproved) refreshApproved.addEventListener('click', loadApprovedSuggestions);
        if (exportApproved) exportApproved.addEventListener('click', exportApprovedSuggestions);
    }
    
    // Carregar categorias
    function loadCategories() {
        allCategories = [
            { id: 'Jurídico', nome: 'Jurídico' },
            { id: 'Administrativo', nome: 'Administrativo' },
            { id: 'Pesquisa', nome: 'Pesquisa' },
            { id: 'Redação', nome: 'Redação' },
            { id: 'Análise de Documentos', nome: 'Análise de Documentos' },
            { id: 'Pareceres', nome: 'Pareceres' },
            { id: 'Petições', nome: 'Petições' },
            { id: 'Outros', nome: 'Outros' }
        ];
        
        populateCategoryFilter();
    }
    
    // Preencher dropdown de categorias
    function populateCategoryFilter() {
        if (!categoryFilter) return;
        
        categoryFilter.innerHTML = '<option value="all">Todas as categorias</option>';
        
        allCategories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = category.nome;
            categoryFilter.appendChild(option);
        });
    }
    
    // Carregar sugestões pendentes
    function loadPendingSuggestions() {
        if (!pendingSuggestions) return;
        
        pendingSuggestions.innerHTML = `
            <div class="loading">
                <i class="fas fa-spinner fa-spin"></i>
                <span>Carregando sugestões...</span>
            </div>
        `;
        
        db.collection('sugestoes')
            .where('status', '==', 'pending')
            .orderBy('date', 'desc')
            .get()
            .then(snapshot => {
                allPendingSuggestions = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                
                if (pendingCount) pendingCount.textContent = allPendingSuggestions.length;
                renderPendingSuggestions();
            })
            .catch(error => {
                console.error('Erro ao carregar sugestões pendentes:', error);
                pendingSuggestions.innerHTML = `
                    <div class="error-message">
                        <i class="fas fa-exclamation-circle"></i>
                        <span>Erro ao carregar sugestões. Tente novamente.</span>
                    </div>
                `;
            });
    }
    
    // Renderizar sugestões pendentes
    function renderPendingSuggestions() {
        if (!pendingSuggestions) return;
        
        if (allPendingSuggestions.length === 0) {
            pendingSuggestions.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-check-circle"></i>
                    <span>Não há sugestões pendentes no momento.</span>
                </div>
            `;
            return;
        }
        
        const filteredSuggestions = filterSuggestions(allPendingSuggestions);
        
        if (filteredSuggestions.length === 0) {
            pendingSuggestions.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-search"></i>
                    <span>Nenhuma sugestão encontrada com os filtros atuais.</span>
                </div>
            `;
            return;
        }
        
        pendingSuggestions.innerHTML = '';
        
        filteredSuggestions.forEach(suggestion => {
            const title = suggestion.title || 'Sem título';
            const text = suggestion.text || 'Sem descrição';
            const category = suggestion.category || '';
            
            let dateStr = 'Data não disponível';
            if (suggestion.date) {
                try {
                    dateStr = new Date(suggestion.date.seconds * 1000).toLocaleDateString('pt-BR');
                } catch (e) {
                    console.error("Erro ao formatar data:", e);
                }
            }
            
            const categoryName = getCategoryName(category);
            
            const suggestionElement = document.createElement('div');
            suggestionElement.className = 'suggestion-item';
            suggestionElement.innerHTML = `
                <h3 class="suggestion-title">${title}</h3>
                <div class="suggestion-details">
                    <p>${text.substring(0, 150)}${text.length > 150 ? '...' : ''}</p>
                    <span class="category-tag">${categoryName}</span>
                    <span class="suggestion-date">Enviado em: ${dateStr}</span>
                </div>
                <div class="suggestion-actions">
                    <button class="view-btn" data-id="${suggestion.id}">
                        <i class="fas fa-eye"></i> Ver detalhes
                    </button>
                    <button class="approve-btn" data-id="${suggestion.id}">
                        <i class="fas fa-check"></i> Aprovar
                    </button>
                    <button class="reject-btn" data-id="${suggestion.id}">
                        <i class="fas fa-times"></i> Rejeitar
                    </button>
                </div>
            `;
            
            pendingSuggestions.appendChild(suggestionElement);
            
            // Adicionar event listeners
            suggestionElement.querySelector('.view-btn').addEventListener('click', () => {
                openSuggestionModal(suggestion, 'pending');
            });
            
            suggestionElement.querySelector('.approve-btn').addEventListener('click', () => {
                approveSuggestion(suggestion.id);
            });
            
            suggestionElement.querySelector('.reject-btn').addEventListener('click', () => {
                rejectSuggestion(suggestion.id);
            });
        });
    }
    
    // Carregar sugestões aprovadas
    function loadApprovedSuggestions() {
        if (!approvedSuggestions) return;
        
        approvedSuggestions.innerHTML = `
            <div class="loading">
                <i class="fas fa-spinner fa-spin"></i>
                <span>Carregando sugestões...</span>
            </div>
        `;
        
        db.collection('sugestoes')
            .where('status', '==', 'approved')
            .orderBy('date', 'desc')
            .get()
            .then(snapshot => {
                allApprovedSuggestions = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                
                if (approvedCount) approvedCount.textContent = allApprovedSuggestions.length;
                renderApprovedSuggestions();
            })
            .catch(error => {
                console.error('Erro ao carregar sugestões aprovadas:', error);
                approvedSuggestions.innerHTML = `
                    <div class="error-message">
                        <i class="fas fa-exclamation-circle"></i>
                        <span>Erro ao carregar sugestões. Tente novamente.</span>
                    </div>
                `;
            });
    }
    
    // Renderizar sugestões aprovadas
    function renderApprovedSuggestions() {
        if (!approvedSuggestions) return;
        
        if (allApprovedSuggestions.length === 0) {
            approvedSuggestions.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-info-circle"></i>
                    <span>Não há sugestões aprovadas no momento.</span>
                </div>
            `;
            return;
        }
        
        const filteredSuggestions = filterSuggestions(allApprovedSuggestions);
        
        if (filteredSuggestions.length === 0) {
            approvedSuggestions.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-search"></i>
                    <span>Nenhuma sugestão encontrada com os filtros atuais.</span>
                </div>
            `;
            return;
        }
        
        approvedSuggestions.innerHTML = '';
        
        filteredSuggestions.forEach(suggestion => {
            const title = suggestion.title || 'Sem título';
            const text = suggestion.text || 'Sem descrição';
            const category = suggestion.category || '';
            
            let dateStr = 'Data não disponível';
            if (suggestion.date) {
                try {
                    dateStr = new Date(suggestion.date.seconds * 1000).toLocaleDateString('pt-BR');
                } catch (e) {
                    console.error("Erro ao formatar data:", e);
                }
            }
            
            let approvedDateStr = 'Data não disponível';
            if (suggestion.approvalDate) {
                try {
                    approvedDateStr = new Date(suggestion.approvalDate.seconds * 1000).toLocaleDateString('pt-BR');
                } catch (e) {
                    console.error("Erro ao formatar data de aprovação:", e);
                }
            }
            
            const categoryName = getCategoryName(category);
            
            const suggestionElement = document.createElement('div');
            suggestionElement.className = 'suggestion-item';
            suggestionElement.innerHTML = `
                <h3 class="suggestion-title">${title}</h3>
                <div class="suggestion-details">
                    <p>${text.substring(0, 150)}${text.length > 150 ? '...' : ''}</p>
                    <span class="category-tag">${categoryName}</span>
                    <span class="suggestion-date">Enviado em: ${dateStr}</span>
                    <span class="suggestion-date">Aprovado em: ${approvedDateStr}</span>
                </div>
                <div class="suggestion-actions">
                    <button class="view-btn" data-id="${suggestion.id}">
                        <i class="fas fa-eye"></i> Ver detalhes
                    </button>
                    <button class="delete-btn" data-id="${suggestion.id}">
                        <i class="fas fa-trash"></i> Excluir
                    </button>
                </div>
            `;
            
            approvedSuggestions.appendChild(suggestionElement);
            
            suggestionElement.querySelector('.view-btn').addEventListener('click', () => {
                openSuggestionModal(suggestion, 'approved');
            });
            
            suggestionElement.querySelector('.delete-btn').addEventListener('click', () => {
                deleteSuggestion(suggestion.id);
            });
        });
    }
    
    // Carregar feedbacks
    function loadFeedbacks() {
        if (!feedbackList) return;
        
        feedbackList.innerHTML = `
            <div class="loading">
                <i class="fas fa-spinner fa-spin"></i>
                <span>Carregando feedbacks...</span>
            </div>
        `;
        
        db.collection('feedback')
            .orderBy('date', 'desc')
            .get()
            .then(snapshot => {
                allFeedbacks = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                
                renderFeedbacks();
            })
            .catch(error => {
                console.error('Erro ao carregar feedbacks:', error);
                feedbackList.innerHTML = `
                    <div class="error-message">
                        <i class="fas fa-exclamation-circle"></i>
                        <span>Erro ao carregar feedbacks: ${error.message}</span>
                    </div>
                `;
            });
    }
    
    // Renderizar feedbacks
    function renderFeedbacks() {
        if (!feedbackList) return;
        
        if (allFeedbacks.length === 0) {
            feedbackList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-comments"></i>
                    <span>Não há feedbacks no momento.</span>
                </div>
            `;
            return;
        }
        
        feedbackList.innerHTML = '';
        
        allFeedbacks.forEach(feedback => {
            const text = feedback.text || 'Sem mensagem';
            const rating = feedback.rating || 'N/A';
            const status = feedback.status || 'pending';
            
            let ratingClass = '';
            const ratingValue = parseInt(rating);
            if (!isNaN(ratingValue)) {
                if (ratingValue >= 8) {
                    ratingClass = 'high-rating';
                } else if (ratingValue >= 5) {
                    ratingClass = 'medium-rating';
                } else {
                    ratingClass = 'low-rating';
                }
            }
            
            let dateStr = 'Data não disponível';
            if (feedback.date) {
                try {
                    if (typeof feedback.date.toDate === 'function') {
                        dateStr = feedback.date.toDate().toLocaleDateString('pt-BR');
                    } else if (feedback.date.seconds) {
                        dateStr = new Date(feedback.date.seconds * 1000).toLocaleDateString('pt-BR');
                    }
                } catch (e) {
                    console.error("Erro ao formatar data do feedback:", e);
                }
            }
            
            const feedbackElement = document.createElement('div');
            feedbackElement.className = 'feedback-item';
            
            if (status === 'approved') {
                feedbackElement.classList.add('approved');
            } else if (status === 'pending') {
                feedbackElement.classList.add('pending');
            } else if (status === 'rejected') {
                              feedbackElement.classList.add('rejected');
            }
            
            feedbackElement.innerHTML = `
                <div class="feedback-header">
                    <div class="feedback-rating ${ratingClass}">Avaliação: <strong>${rating}/10</strong></div>
                    <span class="feedback-date">Data: ${dateStr}</span>
                </div>
                <p class="feedback-text">"${text}"</p>
                <div class="feedback-meta">
                    <span class="feedback-status">Status: ${status}</span>
                </div>
                <div class="feedback-actions">
                    ${status !== 'approved' ? `
                        <button class="approve-feedback-btn" data-id="${feedback.id}">
                            <i class="fas fa-check"></i> Aprovar
                        </button>
                    ` : ''}
                    ${status !== 'rejected' ? `
                        <button class="reject-feedback-btn" data-id="${feedback.id}">
                            <i class="fas fa-times"></i> Rejeitar
                        </button>
                    ` : ''}
                    <button class="delete-feedback-btn" data-id="${feedback.id}">
                        <i class="fas fa-trash"></i> Excluir
                    </button>
                </div>
            `;
            
            feedbackList.appendChild(feedbackElement);
            
            const deleteButton = feedbackElement.querySelector('.delete-feedback-btn');
            if (deleteButton) {
                deleteButton.addEventListener('click', () => {
                    deleteFeedback(feedback.id);
                });
            }
            
            const approveButton = feedbackElement.querySelector('.approve-feedback-btn');
            if (approveButton) {
                approveButton.addEventListener('click', () => {
                    updateFeedbackStatus(feedback.id, 'approved');
                });
            }
            
            const rejectButton = feedbackElement.querySelector('.reject-feedback-btn');
            if (rejectButton) {
                rejectButton.addEventListener('click', () => {
                    updateFeedbackStatus(feedback.id, 'rejected');
                });
            }
        });
    }
    
    // Configurar navegação
    function setupNavigation() {
        if (!navItems) return;
        
        navItems.forEach(item => {
            item.addEventListener('click', () => {
                navItems.forEach(i => i.classList.remove('active'));
                item.classList.add('active');
                
                const tabId = item.getAttribute('data-tab');
                if (contentTabs) {
                    contentTabs.forEach(tab => {
                        tab.classList.remove('active');
                        if (tab.id === `${tabId}-tab`) {
                            tab.classList.add('active');
                        }
                    });
                }
            });
        });
    }
    
    // Configurar pesquisa e filtros
    function setupSearchAndFilters() {
        if (searchInput) {
            searchInput.addEventListener('input', () => {
                currentSearch = searchInput.value.toLowerCase().trim();
                renderPendingSuggestions();
                renderApprovedSuggestions();
            });
        }
        
        if (categoryFilter) {
            categoryFilter.addEventListener('change', () => {
                currentFilter = categoryFilter.value;
                renderPendingSuggestions();
                renderApprovedSuggestions();
            });
        }
    }
    
    // Filtrar sugestões
    function filterSuggestions(suggestions) {
        return suggestions.filter(suggestion => {
            if (currentFilter !== 'all' && suggestion.category !== currentFilter) {
                return false;
            }
            
            if (currentSearch) {
                const title = suggestion.title || '';
                const text = suggestion.text || '';
                const comment = suggestion.comment || '';
                const searchableText = `${title} ${text} ${comment}`.toLowerCase();
                if (!searchableText.includes(currentSearch)) {
                    return false;
                }
            }
            
            return true;
        });
    }
    
    // Obter nome da categoria
    function getCategoryName(categoryId) {
        const category = allCategories.find(cat => cat.id === categoryId);
        return category ? category.nome : 'Sem categoria';
    }
    
    // Abrir modal de sugestão
    function openSuggestionModal(suggestion, type) {
        if (!modal || !modalTitle || !modalBody || !modalFooter) return;
        
        const title = suggestion.title || 'Sem título';
        const text = suggestion.text || 'Sem descrição';
        const comment = suggestion.comment || '';
        const category = suggestion.category || '';
        const categoryName = getCategoryName(category);
        
        let dateStr = 'Data não disponível';
        if (suggestion.date) {
            try {
                dateStr = new Date(suggestion.date.seconds * 1000).toLocaleDateString('pt-BR');
            } catch (e) {
                console.error("Erro ao formatar data:", e);
            }
        }
        
        modalTitle.textContent = title;
        
        modalBody.innerHTML = `
            <div class="modal-suggestion-details">
                <p><strong>Descrição:</strong></p>
                <p>${text}</p>
                ${comment ? `
                    <p><strong>Comentário adicional:</strong></p>
                    <p>${comment}</p>
                ` : ''}
                <p><strong>Categoria:</strong> ${categoryName}</p>
                <p><strong>Data de envio:</strong> ${dateStr}</p>
                ${suggestion.author ? `<p><strong>Autor:</strong> ${suggestion.author}</p>` : ''}
                ${suggestion.email ? `<p><strong>Email:</strong> ${suggestion.email}</p>` : ''}
                ${suggestion.status === 'approved' && suggestion.approvalDate ?
                    `<p><strong>Data de aprovação:</strong> ${new Date(suggestion.approvalDate.seconds * 1000).toLocaleDateString('pt-BR')}</p>` : ''}
            </div>
        `;
        
        modalFooter.innerHTML = '';
        
        if (type === 'pending') {
            const approveButton = document.createElement('button');
            approveButton.className = 'approve-btn';
            approveButton.innerHTML = '<i class="fas fa-check"></i> Aprovar';
            approveButton.addEventListener('click', () => {
                approveSuggestion(suggestion.id);
                modal.classList.remove('active');
            });
            
            const rejectButton = document.createElement('button');
            rejectButton.className = 'reject-btn';
            rejectButton.innerHTML = '<i class="fas fa-times"></i> Rejeitar';
            rejectButton.addEventListener('click', () => {
                rejectSuggestion(suggestion.id);
                modal.classList.remove('active');
            });
            
            modalFooter.appendChild(approveButton);
            modalFooter.appendChild(rejectButton);
        }
        
        const deleteButton = document.createElement('button');
        deleteButton.className = 'delete-btn';
        deleteButton.innerHTML = '<i class="fas fa-trash"></i> Excluir';
        deleteButton.addEventListener('click', () => {
            modal.classList.remove('active');
            deleteSuggestion(suggestion.id);
        });
        
        modalFooter.appendChild(deleteButton);
        modal.classList.add('active');
    }
    
    // Configurar modal
    function setupModal() {
        if (!modal || !closeModal) return;
        
        closeModal.addEventListener('click', () => {
            modal.classList.remove('active');
        });
        
        window.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    }
    
    // Aprovar sugestão
    function approveSuggestion(id) {
        if (confirm('Tem certeza que deseja aprovar esta sugestão?')) {
            db.collection('sugestoes').doc(id).update({
                status: 'approved',
                approvalDate: firebase.firestore.FieldValue.serverTimestamp()
            })
            .then(() => {
                alert('Sugestão aprovada com sucesso!');
                loadPendingSuggestions();
                loadApprovedSuggestions();
            })
            .catch(error => {
                console.error('Erro ao aprovar sugestão:', error);
                alert('Erro ao aprovar sugestão. Tente novamente.');
            });
        }
    }
    
    // Rejeitar sugestão
    function rejectSuggestion(id) {
        if (confirm('Tem certeza que deseja rejeitar esta sugestão?')) {
            db.collection('sugestoes').doc(id).update({
                status: 'rejected',
                rejectionDate: firebase.firestore.FieldValue.serverTimestamp()
            })
            .then(() => {
                alert('Sugestão rejeitada com sucesso!');
                loadPendingSuggestions();
            })
            .catch(error => {
                console.error('Erro ao rejeitar sugestão:', error);
                alert('Erro ao rejeitar sugestão. Tente novamente.');
            });
        }
    }
    
    // Excluir sugestão
    function deleteSuggestion(id) {
        if (confirm('Tem certeza que deseja excluir esta sugestão? Esta ação não pode ser desfeita.')) {
            db.collection('sugestoes').doc(id).delete()
                .then(() => {
                    alert('Sugestão excluída com sucesso!');
                    loadPendingSuggestions();
                    loadApprovedSuggestions();
                })
                .catch(error => {
                    console.error('Erro ao excluir sugestão:', error);
                    alert('Erro ao excluir sugestão. Tente novamente.');
                });
        }
    }
    
    // Excluir feedback
    function deleteFeedback(id) {
        if (confirm('Tem certeza que deseja excluir este feedback?')) {
            db.collection('feedback').doc(id).delete()
                .then(() => {
                    alert('Feedback excluído com sucesso!');
                    loadFeedbacks();
                })
                .catch(error => {
                    console.error('Erro ao excluir feedback:', error);
                    alert('Erro ao excluir feedback. Tente novamente.');
                });
        }
    }
    
    // Atualizar status do feedback
    function updateFeedbackStatus(id, newStatus) {
        const statusText = newStatus === 'approved' ? 'aprovar' : 'rejeitar';
        
        if (confirm(`Tem certeza que deseja ${statusText} este feedback?`)) {
            db.collection('feedback').doc(id).update({
                status: newStatus,
                statusUpdatedAt: firebase.firestore.FieldValue.serverTimestamp()
            })
            .then(() => {
                alert(`Feedback ${newStatus === 'approved' ? 'aprovado' : 'rejeitado'} com sucesso!`);
                loadFeedbacks();
            })
            .catch(error => {
                console.error(`Erro ao ${statusText} feedback:`, error);
                alert(`Erro ao ${statusText} feedback. Tente novamente.`);
            });
        }
    }
    
    // Exportar sugestões aprovadas
    function exportApprovedSuggestions() {
        if (allApprovedSuggestions.length === 0) {
            alert('Não há sugestões aprovadas para exportar.');
            return;
        }
        
        const filteredSuggestions = filterSuggestions(allApprovedSuggestions);
        
        if (filteredSuggestions.length === 0) {
            alert('Não há sugestões que correspondam aos filtros atuais.');
            return;
        }
        
        const csvData = [
            ['Título', 'Descrição', 'Comentário', 'Categoria', 'Data de Envio', 'Data de Aprovação']
        ];
        
        filteredSuggestions.forEach(suggestion => {
            const title = suggestion.title || '';
            const text = suggestion.text || '';
            const comment = suggestion.comment || '';
            const categoryName = getCategoryName(suggestion.category || '');
            
            let dateStr = '';
            if (suggestion.date) {
                try {
                    dateStr = new Date(suggestion.date.seconds * 1000).toLocaleDateString('pt-BR');
                } catch (e) {}
            }
            
            let approvedDateStr = '';
            if (suggestion.approvalDate) {
                try {
                    approvedDateStr = new Date(suggestion.approvalDate.seconds * 1000).toLocaleDateString('pt-BR');
                } catch (e) {}
            }
            
            csvData.push([
                title,
                text,
                comment,
                categoryName,
                dateStr,
                approvedDateStr
            ]);
        });
        
        let csvContent = "data:text/csv;charset=utf-8,";
        
        csvData.forEach(row => {
            const formattedRow = row.map(cell => {
                const escaped = String(cell).replace(/"/g, '""');
                return `"${escaped}"`;
            });
            
            csvContent += formattedRow.join(',') + '\r\n';
        });
        
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `sugestoes_aprovadas_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        
        link.click();
        document.body.removeChild(link);
    }
});
  
