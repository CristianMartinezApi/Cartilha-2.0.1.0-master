document.addEventListener('DOMContentLoaded', function() {
    // Inicialização do Firebase
    const db = firebase.firestore();
    
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
      document.getElementById('refresh-pending').addEventListener('click', loadPendingSuggestions);
      document.getElementById('refresh-approved').addEventListener('click', loadApprovedSuggestions);
      
      // Configurar exportação
      document.getElementById('export-approved').addEventListener('click', exportApprovedSuggestions);
    }
    
    // Carregar categorias
    function loadCategories() {
      // Aqui você pode carregar categorias do Firebase ou usar uma lista estática
      // Por enquanto, vamos usar uma lista estática baseada no que vimos nos dados
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
      
      // Preencher dropdown de categorias
      populateCategoryFilter();
    }
    
    // Preencher dropdown de categorias
    function populateCategoryFilter() {
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
      // Mostrar loading
      pendingSuggestions.innerHTML = `
        <div class="loading">
          <i class="fas fa-spinner fa-spin"></i>
          <span>Carregando sugestões...</span>
        </div>
      `;
      
      db.collection('sugestoes')
        .where('status', '==', 'pending')
        .orderBy('date', 'desc')  // Usando 'date' em vez de 'data'
        .get()
        .then(snapshot => {
          allPendingSuggestions = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          
          // Atualizar contador
          pendingCount.textContent = allPendingSuggestions.length;
          
          // Renderizar sugestões
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
      if (allPendingSuggestions.length === 0) {
        pendingSuggestions.innerHTML = `
          <div class="empty-state">
            <i class="fas fa-check-circle"></i>
            <span>Não há sugestões pendentes no momento.</span>
          </div>
        `;
        return;
      }
      
      // Filtrar sugestões
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
        // Usar os nomes corretos dos campos
        const title = suggestion.title || 'Sem título';
        const text = suggestion.text || 'Sem descrição';
        const category = suggestion.category || '';
        const comment = suggestion.comment || '';
        
        // Formatar data
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
      // Mostrar loading
      approvedSuggestions.innerHTML = `
        <div class="loading">
          <i class="fas fa-spinner fa-spin"></i>
          <span>Carregando sugestões...</span>
        </div>
      `;
      
      db.collection('sugestoes')
        .where('status', '==', 'approved')
        .orderBy('date', 'desc')  // Usando 'date' em vez de 'data'
        .get()
        .then(snapshot => {
          allApprovedSuggestions = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          
          // Atualizar contador
          approvedCount.textContent = allApprovedSuggestions.length;
          
          // Renderizar sugestões
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
  if (allApprovedSuggestions.length === 0) {
    approvedSuggestions.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-info-circle"></i>
        <span>Não há sugestões aprovadas no momento.</span>
      </div>
    `;
    return;
  }
  
  // Filtrar sugestões
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
    // Usar os nomes corretos dos campos
    const title = suggestion.title || 'Sem título';
    const text = suggestion.text || 'Sem descrição';
    const category = suggestion.category || '';
    
    // Formatar data
    let dateStr = 'Data não disponível';
    if (suggestion.date) {
      try {
        dateStr = new Date(suggestion.date.seconds * 1000).toLocaleDateString('pt-BR');
      } catch (e) {
        console.error("Erro ao formatar data:", e);
      }
    }
    
    // Formatar data de aprovação
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
    
    // Adicionar event listener para o botão de visualização
    suggestionElement.querySelector('.view-btn').addEventListener('click', () => {
      openSuggestionModal(suggestion, 'approved');
    });
    
    // Adicionar event listener para o botão de exclusão
    suggestionElement.querySelector('.delete-btn').addEventListener('click', () => {
      deleteSuggestion(suggestion.id);
    });
  });
}
    
    // Carregar feedbacks
    function loadFeedbacks() {
      // Mostrar loading
      feedbackList.innerHTML = `
        <div class="loading">
          <i class="fas fa-spinner fa-spin"></i>
          <span>Carregando feedbacks...</span>
        </div>
      `;
      
      db.collection('feedbacks')
        .orderBy('date', 'desc')  // Ajuste para o nome correto do campo
        .get()
        .then(snapshot => {
          allFeedbacks = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          
          // Renderizar feedbacks
          renderFeedbacks();
        })
        .catch(error => {
          console.error('Erro ao carregar feedbacks:', error);
          feedbackList.innerHTML = `
            <div class="error-message">
              <i class="fas fa-exclamation-circle"></i>
              <span>Erro ao carregar feedbacks. Tente novamente.</span>
            </div>
          `;
        });
    }
    
    // Renderizar feedbacks
    function renderFeedbacks() {
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
        // Formatar data
        let dateStr = 'Data não disponível';
        if (feedback.date) {
          try {
            dateStr = new Date(feedback.date.seconds * 1000).toLocaleDateString('pt-BR');
          } catch (e) {
            console.error("Erro ao formatar data:", e);
          }
        }
        
        const feedbackElement = document.createElement('div');
        feedbackElement.className = 'feedback-item';
        feedbackElement.innerHTML = `
          <p class="feedback-text">${feedback.message || feedback.text || 'Sem mensagem'}</p>
          <div class="feedback-meta">
            <span>Enviado por: ${feedback.name || feedback.author || 'Anônimo'}</span>
            <span>Data: ${dateStr}</span>
          </div>
        `;
        
        feedbackList.appendChild(feedbackElement);
      });
    }
    
    // Configurar navegação
    function setupNavigation() {
      navItems.forEach(item => {
        item.addEventListener('click', () => {
          // Remover classe ativa de todos os itens
          navItems.forEach(i => i.classList.remove('active'));
          
          // Adicionar classe ativa ao item clicado
          item.classList.add('active');
          
          // Mostrar a tab correspondente
          const tabId = item.getAttribute('data-tab');
          contentTabs.forEach(tab => {
            tab.classList.remove('active');
            if (tab.id === `${tabId}-tab`) {
              tab.classList.add('active');
            }
          });
        });
      });
    }
    
    // Configurar pesquisa e filtros
    function setupSearchAndFilters() {
      // Pesquisa
      searchInput.addEventListener('input', () => {
        currentSearch = searchInput.value.toLowerCase().trim();
        renderPendingSuggestions();
        renderApprovedSuggestions();
      });
      
      // Filtro de categoria
      categoryFilter.addEventListener('change', () => {
        currentFilter = categoryFilter.value;
        renderPendingSuggestions();
        renderApprovedSuggestions();
      });
    }
    
    // Filtrar sugestões
    function filterSuggestions(suggestions) {
      return suggestions.filter(suggestion => {
        // Filtrar por categoria
        if (currentFilter !== 'all' && suggestion.category !== currentFilter) {
          return false;
        }
        
        // Filtrar por pesquisa
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
  const title = suggestion.title || 'Sem título';
  const text = suggestion.text || 'Sem descrição';
  const comment = suggestion.comment || '';
  const category = suggestion.category || '';
  const categoryName = getCategoryName(category);
  
  // Formatar data
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
  
  // Adicionar botões de ação
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
  
  // Adicionar botão de exclusão para todos os tipos de sugestões
  const deleteButton = document.createElement('button');
  deleteButton.className = 'delete-btn';
  deleteButton.innerHTML = '<i class="fas fa-trash"></i> Excluir';
  deleteButton.addEventListener('click', () => {
    modal.classList.remove('active');
    deleteSuggestion(suggestion.id);
  });
  
  modalFooter.appendChild(deleteButton);
  
  // Mostrar modal
  modal.classList.add('active');
}
    
    // Configurar modal
    function setupModal() {
      // Fechar modal ao clicar no X
      closeModal.addEventListener('click', () => {
        modal.classList.remove('active');
      });
      
      // Fechar modal ao clicar fora
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
    
    // Exportar sugestões aprovadas
    function exportApprovedSuggestions() {
      if (allApprovedSuggestions.length === 0) {
        alert('Não há sugestões aprovadas para exportar.');
        return;
      }
      
      // Filtrar sugestões
      const filteredSuggestions = filterSuggestions(allApprovedSuggestions);
      
      if (filteredSuggestions.length === 0) {
        alert('Não há sugestões que correspondam aos filtros atuais.');
        return;
      }
      
      // Preparar dados para CSV
      const csvData = [
        ['Título', 'Descrição', 'Comentário', 'Categoria', 'Data de Envio', 'Data de Aprovação']
      ];
      
      filteredSuggestions.forEach(suggestion => {
        const title = suggestion.title || '';
        const text = suggestion.text || '';
        const comment = suggestion.comment || '';
        const categoryName = getCategoryName(suggestion.category || '');
        
        // Formatar datas
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
      
      // Converter para CSV
      let csvContent = "data:text/csv;charset=utf-8,";
      
      csvData.forEach(row => {
        const formattedRow = row.map(cell => {
          // Escapar aspas e adicionar aspas ao redor de cada célula
          const escaped = String(cell).replace(/"/g, '""');
          return `"${escaped}"`;
        });
        
        csvContent += formattedRow.join(',') + '\r\n';
      });
      
      // Criar link de download
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `sugestoes_aprovadas_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      
      // Trigger download
      link.click();
      
      // Limpar
      document.body.removeChild(link);
    }
  });
  

  



  // Variáveis globais para feedbacks
let feedbackList;
let allFeedbacks = [];

// Adicione isso à sua função de inicialização existente
document.addEventListener("DOMContentLoaded", function() {
  // Inicializar Firebase (se você já não fez isso)
  const db = firebase.firestore();
  
  // Inicializar elementos da UI
  initUI();
  
  // Configurar navegação (se você já não fez isso)
  setupNavigation();
  
  // Carregar dados iniciais
  loadInitialData();
});

// Função para inicializar elementos da UI
function initUI() {
  // Elementos existentes que você já inicializa
  // ...
  
  // Inicializar elementos de feedback
  feedbackList = document.getElementById('feedback-list');
  
  // Inicializar botão de atualizar feedbacks
  const refreshFeedbackBtn = document.getElementById('refresh-feedback');
  if (refreshFeedbackBtn) {
    refreshFeedbackBtn.addEventListener('click', loadFeedbacks);
  }
}

// Função para configurar navegação (se você já não tem uma)
function setupNavigation() {
  const navItems = document.querySelectorAll('.nav-item');
  
  navItems.forEach(item => {
    item.addEventListener('click', function() {
      // Remover classe active de todos os itens
      navItems.forEach(navItem => {
        navItem.classList.remove('active');
      });
      
      // Adicionar classe active ao item clicado
      this.classList.add('active');
      
      // Obter o ID da aba
      const tabId = this.getAttribute('data-tab');
      
      // Esconder todas as abas
      document.querySelectorAll('.content-tab').forEach(tab => {
        tab.classList.remove('active');
      });
      
      // Mostrar a aba selecionada
      document.getElementById(`${tabId}-tab`).classList.add('active');
      
      // Carregar dados específicos da aba
      if (tabId === 'pending') {
        // Carregar sugestões pendentes (você já deve ter essa função)
        loadPendingSuggestions();
      } else if (tabId === 'approved') {
        // Carregar sugestões aprovadas (você já deve ter essa função)
        loadApprovedSuggestions();
      } else if (tabId === 'feedback') {
        // Carregar feedbacks
        loadFeedbacks();
      }
    });
  });
}

// Função para carregar dados iniciais
function loadInitialData() {
  // Verificar qual aba está ativa inicialmente
  const activeTab = document.querySelector('.nav-item.active');
  if (activeTab) {
    const tabId = activeTab.getAttribute('data-tab');
    
    if (tabId === 'pending') {
      loadPendingSuggestions();
    } else if (tabId === 'approved') {
      loadApprovedSuggestions();
    } else if (tabId === 'feedback') {
      loadFeedbacks();
    }
  }
}

// Carregar feedbacks
function loadFeedbacks() {
  // Verificar se o elemento feedbackList existe
  if (!feedbackList) {
    console.error("Elemento feedbackList não está disponível!");
    return;
  }
  
  // Mostrar loading
  feedbackList.innerHTML = `
    <div class="loading">
      <i class="fas fa-spinner fa-spin"></i>
      <span>Carregando feedbacks...</span>
    </div>
  `;
  
  console.log("Carregando feedbacks...");
  
  // Usar a coleção 'feedback' (singular) e ordenar por data
  firebase.firestore().collection('feedback')
    .orderBy('date', 'desc')
    .get()
    .then(snapshot => {
      console.log(`Feedbacks encontrados: ${snapshot.size}`);
      
      allFeedbacks = snapshot.docs.map(doc => {
        const data = doc.data();
        console.log("Dados do feedback:", data);
        return {
          id: doc.id,
          ...data
        };
      });
      
      // Renderizar feedbacks
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
  if (allFeedbacks.length === 0) {
    feedbackList.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-comments"></i>
        <span>Não há feedbacks no momento.</span>
      </div>
    `;
    return;
  }
  
  // Calcular estatísticas
  calculateFeedbackStats();
  
  feedbackList.innerHTML = '';
  
  allFeedbacks.forEach(feedback => {
    // Extrair dados do feedback com base na estrutura exata
    const text = feedback.text || 'Sem mensagem';
    const rating = feedback.rating || 'N/A';
    const status = feedback.status || 'pending';
    
    // Determinar a classe de cor com base na avaliação
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
    
    // Formatar data usando o método toDate() do Firestore
    let dateStr = 'Data não disponível';
    if (feedback.date) {
      try {
        if (typeof feedback.date.toDate === 'function') {
          // Método específico do Firestore Timestamp
          dateStr = feedback.date.toDate().toLocaleDateString('pt-BR');
        } else if (feedback.date.seconds) {
          // Fallback para o formato seconds/nanoseconds
          dateStr = new Date(feedback.date.seconds * 1000).toLocaleDateString('pt-BR');
        }
      } catch (e) {
        console.error("Erro ao formatar data do feedback:", e);
      }
    }
    
    const feedbackElement = document.createElement('div');
    feedbackElement.className = 'feedback-item';
    
    // Adicionar classe baseada no status
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
    
    // Adicionar event listeners para os botões
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

// Calcular estatísticas dos feedbacks
function calculateFeedbackStats() {
  const totalFeedbacks = allFeedbacks.length;
  const totalFeedbackCount = document.getElementById('total-feedback-count');
  const avgRatingElement = document.getElementById('avg-rating');
  
  if (!totalFeedbackCount || !avgRatingElement) {
    console.error("Elementos de estatísticas não encontrados!");
    return;
  }
  
  totalFeedbackCount.textContent = totalFeedbacks;
  
  if (totalFeedbacks === 0) {
    avgRatingElement.textContent = '0.0';
    return;
  }
  
  // Calcular média das avaliações
  let totalRating = 0;
  let validRatings = 0;
  
  allFeedbacks.forEach(feedback => {
    if (feedback.rating) {
      const ratingValue = parseInt(feedback.rating);
      if (!isNaN(ratingValue)) {
        totalRating += ratingValue;
        validRatings++;
      }
    }
  });
  
  const avgRating = validRatings > 0 ? (totalRating / validRatings).toFixed(1) : '0.0';
  avgRatingElement.textContent = avgRating;
}

// Função para excluir feedback
function deleteFeedback(id) {
  if (confirm('Tem certeza que deseja excluir este feedback?')) {
    firebase.firestore().collection('feedback').doc(id).delete()
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

// Função para atualizar o status do feedback
function updateFeedbackStatus(id, newStatus) {
  const statusText = newStatus === 'approved' ? 'aprovar' : 'rejeitar';
  
  if (confirm(`Tem certeza que deseja ${statusText} este feedback?`)) {
    firebase.firestore().collection('feedback').doc(id).update({
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





// Adicione isso no início do seu arquivo admin.js
document.addEventListener('DOMContentLoaded', function() {
  // Configurar o tempo máximo de sessão (em minutos)
  const SESSION_TIMEOUT_MINUTES = 60; // 1 hora
  
  // Verificar autenticação antes de inicializar o painel
  firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
      // Verificar quando o usuário fez login pela última vez
      const lastLoginTime = localStorage.getItem('lastLoginTime');
      const currentTime = Date.now();
      
      if (lastLoginTime) {
        const sessionAge = (currentTime - parseInt(lastLoginTime)) / (1000 * 60); // em minutos
        
        if (sessionAge > SESSION_TIMEOUT_MINUTES) {
          // Sessão expirada, redirecionar para login
          console.log('Sessão expirada após', Math.round(sessionAge), 'minutos. Redirecionando para login...');
          localStorage.removeItem('lastLoginTime');
          window.location.href = 'login.html';
          return;
        }
      } else {
        // Não há timestamp de login, redirecionar para login
        console.log('Timestamp de login não encontrado. Redirecionando para login...');
        window.location.href = 'login.html';
        return;
      }
      
      // Verificar se o usuário tem permissão de admin
      checkAdminPermission(user.uid)
        .then(isAdmin => {
          if (isAdmin) {
            // Atualizar timestamp de login para renovar a sessão
            localStorage.setItem('lastLoginTime', currentTime.toString());
            
            // Usuário autenticado e é admin, inicializar o painel
            console.log('Usuário autenticado e é admin:', user.email);
            initAdminPanel();
            
            // Configurar verificação periódica da sessão
            setupSessionCheck(SESSION_TIMEOUT_MINUTES);
          } else {
            // Não é admin, redirecionar para login
            console.log('Usuário não tem permissão de admin. Redirecionando...');
            firebase.auth().signOut().then(() => {
              localStorage.removeItem('lastLoginTime');
              window.location.href = 'login.html';
            });
          }
        })
        .catch(error => {
          console.error('Erro ao verificar permissão de admin:', error);
          window.location.href = 'login.html';
        });
    } else {
      // Usuário não autenticado, redirecionar para a página de login
      console.log('Usuário não autenticado, redirecionando...');
      window.location.href = 'login.html';
    }
  });
});

// Função para verificar se o usuário tem permissão de admin
function checkAdminPermission(uid) {
  return new Promise((resolve, reject) => {
    // Verificar na coleção 'admins' se o usuário é um administrador
    firebase.firestore().collection('admins').doc(uid).get()
      .then(doc => {
        if (doc.exists) {
          resolve(true);
        } else {
          // Alternativa: verificar em uma coleção 'users' com campo 'role'
          firebase.firestore().collection('users').doc(uid).get()
            .then(userDoc => {
              if (userDoc.exists && userDoc.data().role === 'admin') {
                resolve(true);
              } else {
                resolve(false);
              }
            })
            .catch(error => {
              console.error('Erro ao verificar role do usuário:', error);
              resolve(false);
            });
        }
      })
      .catch(error => {
        console.error('Erro ao verificar permissão de admin:', error);
        reject(error);
      });
  });
}

// Configurar verificação periódica da sessão
function setupSessionCheck(timeoutMinutes) {
  // Verificar a cada 5 minutos
  const CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutos em milissegundos
  
  setInterval(() => {
    const lastLoginTime = localStorage.getItem('lastLoginTime');
    const currentTime = Date.now();
    
    if (lastLoginTime) {
      const sessionAge = (currentTime - parseInt(lastLoginTime)) / (1000 * 60); // em minutos
      
      if (sessionAge > timeoutMinutes) {
        // Sessão expirada, fazer logout e redirecionar
        console.log('Sessão expirada durante uso. Redirecionando para login...');
        firebase.auth().signOut().then(() => {
          localStorage.removeItem('lastLoginTime');
          window.location.href = 'login.html';
        });
      } else if (sessionAge > timeoutMinutes - 5) {
        // Sessão prestes a expirar, mostrar aviso
        alert(`Sua sessão expirará em aproximadamente ${Math.round(timeoutMinutes - sessionAge)} minutos. Faça logout e login novamente para continuar.`);
      }
    }
  }, CHECK_INTERVAL);
  
  // Atualizar timestamp a cada interação do usuário
  ['click', 'keypress', 'scroll', 'mousemove'].forEach(eventType => {
    document.addEventListener(eventType, () => {
      localStorage.setItem('lastLoginTime', Date.now().toString());
    }, { passive: true });
  });
}

// Função para inicializar o painel admin (mova seu código existente para cá)
function initAdminPanel() {
  // Inicializar elementos da UI
  initUI();
  
  // Configurar navegação
  setupNavigation();
  
  // Carregar dados iniciais
  loadInitialData();
  
  // Carregar categorias
  loadCategories();
  
  // Adicionar botão de logout
  setupLogout();
  
  // Configurar modal de adicionar administrador
  setupAddAdminModal();
}


// Selecione o botão de menu
const menuToggle = document.querySelector('#menu-toggle');

// Selecione a sidebar
const sidebar = document.querySelector('.admin-sidebar');

// Adicione o evento de clique no botão de menu
menuToggle.addEventListener('click', () => {
  // Alterna a classe 'active' na sidebar
  sidebar.classList.toggle('active');
});

// Função para excluir sugestões (versão alternativa)
function deleteSuggestion(id) {
  if (confirm('Tem certeza que deseja excluir esta sugestão? Esta ação não pode ser desfeita.')) {
    db.collection('sugestoes').doc(id).delete()
      .then(() => {
        alert('Sugestão excluída com sucesso!');
        
        // Recarregar a página atual
        window.location.reload();
      })
      .catch(error => {
        console.error('Erro ao excluir sugestão:', error);
        alert('Erro ao excluir sugestão. Tente novamente.');
      });
  }
}
