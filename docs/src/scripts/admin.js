document.addEventListener("DOMContentLoaded", function () {
  console.log("Admin panel carregado");

  // Verificar se o Firebase está inicializado
  if (typeof firebase === "undefined") {
    console.error(
      "Firebase não está inicializado. Verifique se os scripts do Firebase foram carregados."
    );
    return;
  }

  // Inicializar Firebase
  const db = firebase.firestore();
  console.log("Firebase inicializado no admin");

  // Elementos DOM - com verificação de existência
  const menuToggle = document.querySelector("#menu-toggle");
  const sidebar = document.querySelector(".admin-sidebar");

  // Configurar menu toggle apenas se os elementos existirem
  if (menuToggle && sidebar) {
    menuToggle.addEventListener("click", function () {
      sidebar.classList.toggle("collapsed");
    });
  }

  // Elementos da UI
  const pendingSuggestions = document.getElementById("pending-suggestions");
  const approvedSuggestions = document.getElementById("approved-suggestions");
  const feedbackList = document.getElementById("feedback-list");
  const navItems = document.querySelectorAll(".nav-item");
  const contentTabs = document.querySelectorAll(".content-tab");
  const searchInput = document.getElementById("search-input");
  const categoryFilter = document.getElementById("category-filter");
  const pendingCount = document.getElementById("pending-count");
  const approvedCount = document.getElementById("approved-count");
  const modal = document.getElementById("suggestion-modal");
  const modalTitle = document.getElementById("modal-title");
  const modalBody = document.getElementById("modal-body");
  const modalFooter = document.getElementById("modal-footer");
  const closeModal = document.querySelector(".close-modal");

  // Variáveis de estado
  let allPendingSuggestions = [];
  let allApprovedSuggestions = [];
  let allFeedbacks = [];
  let allCategories = [];
  let currentFilter = "all";
  let currentSearch = "";
  let dashboardPeriod = {
    type: "30",
    startDate: null,
    endDate: null,
    label: "Últimos 30 dias",
  };

  // Adicionar seletor de período no HTML
  function addPeriodSelector() {
    // Procurar onde adicionar o seletor
    const exportContainer =
      document.querySelector(".export-container") ||
      document.querySelector("#export-dropdown-btn")?.parentElement ||
      document.querySelector(".admin-header") ||
      document.querySelector(".content-header");

    if (exportContainer && !document.getElementById("period-selector")) {
      const selectorHTML = `
                <div id="period-selector" class="period-selector" style="
                    margin: 15px 0;
                    padding: 15px;
                    background: white;
                    border-radius: 10px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    display: flex;
                    align-items: center;
                    gap: 15px;
                    flex-wrap: wrap;
                ">
                    <label for="report-period" style="
                        font-weight: 600;
                        color: #333;
                        display: flex;
                        align-items: center;
                        gap: 8px;
                    ">
                        <i class="fas fa-calendar-alt" style="color: #0066cc;"></i>
                        Período do Relatório:
                    </label>
                    <select id="report-period" style="
                        padding: 10px 15px;
                        border-radius: 8px;
                        border: 2px solid #e1e5e9;
                        background: white;
                        font-size: 14px;
                        font-weight: 500;
                        color: #333;
                        cursor: pointer;
                        transition: all 0.3s ease;
                        min-width: 200px;
                    ">
                        <option value="30">📊 Últimos 30 dias</option>
                        <option value="90">📈 Últimos 3 meses</option>
                        <option value="current-month">📅 Mês atual</option>
                        <option value="365">📆 Último ano</option>
                        <option value="all" selected>🗂️ Todos os dados</option>
                    </select>
                    <span id="period-info" style="
                        color: #666;
                        font-size: 13px;
                        font-style: italic;
                    ">
                        Selecione o período para análise
                    </span>
                </div>
            `;

      exportContainer.insertAdjacentHTML("afterend", selectorHTML);

      // Adicionar event listener para mudança de período
      const selector = document.getElementById("report-period");
      if (selector) {
        selector.addEventListener("change", updatePeriodInfo);
        updatePeriodInfo(); // Atualizar info inicial
      }

      console.log("✅ Seletor de período adicionado");
    }
  }

  // Atualizar informações do período selecionado
  function updatePeriodInfo() {
    const period = getSelectedPeriod();
    const infoElement = document.getElementById("period-info");

    if (infoElement && period) {
      const fromDate = period.from.toLocaleDateString("pt-BR");
      const toDate = period.to.toLocaleDateString("pt-BR");

      infoElement.innerHTML = `
                <i class="fas fa-info-circle"></i>
                ${period.label} (${fromDate} até ${toDate})
            `;
    }
  }

  // Obter período selecionado
  function getSelectedPeriod() {
    const selector = document.getElementById("report-period");
    const periodType = selector ? selector.value : "all";

    const now = new Date();
    let startDate, endDate, label;

    switch (periodType) {
      case "30":
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        endDate = now;
        label = "Últimos 30 dias";
        break;

      case "90":
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        endDate = now;
        label = "Últimos 3 meses";
        break;

      case "current-month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = now;
        label = "Mês atual";
        break;

      case "365":
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        endDate = now;
        label = "Último ano";
        break;

      case "all":
      default:
        const allDates = getAllAvailableDates();
        startDate = allDates.min;
        endDate = allDates.max;
        label = "Período completo";
        break;
    }

    return {
      from: startDate,
      to: endDate,
      label: label,
      type: periodType,
    };
  }

  // Obter todas as datas disponíveis
  function getAllAvailableDates() {
    const allSuggestions = [
      ...(allApprovedSuggestions || []),
      ...(allPendingSuggestions || []),
    ];

    const dates = allSuggestions
      .map((s) => {
        try {
          return s.date?.seconds
            ? new Date(s.date.seconds * 1000)
            : new Date(s.date);
        } catch (e) {
          return null;
        }
      })
      .filter((d) => d && !isNaN(d));

    if (dates.length === 0) {
      const now = new Date();
      return { min: now, max: now };
    }

    return {
      min: new Date(Math.min(...dates)),
      max: new Date(Math.max(...dates)),
    };
  }

  // Filtrar dados por período
  function filterDataByPeriod(data, period) {
    if (!data || !Array.isArray(data)) return [];

    return data.filter((item) => {
      try {
        const itemDate = item.date?.seconds
          ? new Date(item.date.seconds * 1000)
          : new Date(item.date);

        return itemDate >= period.from && itemDate <= period.to;
      } catch (e) {
        return false;
      }
    });
  }

  // Estatísticas padrão para período específico
  function getDefaultStatsForPeriod(period) {
    console.log("📊 Usando estatísticas padrão para período específico");

    return {
      general: {
        totalSuggestions: 0,
        totalApproved: 0,
        totalPending: 0,
        totalRejected: 0,
        overallApprovalRate: 0,
        avgApprovalTime: 0,
      },
      byCategory: {
        "Nenhum dado no período": {
          total: 0,
          approved: 0,
          pending: 0,
          approvalRate: 0,
        },
      },
      monthly: {
        [new Date().toLocaleDateString("pt-BR", {
          year: "numeric",
          month: "short",
        })]: 0,
      },
      feedback: {
        total: 0,
        approved: 0,
        pending: 0,
        rejected: 0,
        averageRating: "0.0",
      },
      currentMonth: {
        total: 0,
        approved: 0,
      },
      period: {
        from: period.from.toISOString(),
        to: period.to.toISOString(),
        label: period.label,
        type: period.type,
      },
    };
  }

  // Função para mostrar feedback de sucesso
  function showExportSuccess(message) {
    // Remover notificação anterior se existir
    const existingNotification = document.querySelector(
      ".export-success-notification"
    );
    if (existingNotification) {
      existingNotification.remove();
    }

    // Criar nova notificação
    const notification = document.createElement("div");
    notification.className = "export-success-notification";
    notification.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: linear-gradient(45deg, #28a745, #20c997);
            color: white;
            padding: 15px 25px;
            border-radius: 25px;
            box-shadow: 0 4px 20px rgba(40, 167, 69, 0.3);
            z-index: 10000;
            font-weight: 600;
            animation: slideDown 0.3s ease-out;
        `;

    notification.innerHTML = `
            <i class="fas fa-check-circle" style="margin-right: 10px;"></i>
            ${message}
        `;

    // Adicionar animação CSS
    if (!document.querySelector("#export-success-styles")) {
      const styles = document.createElement("style");
      styles.id = "export-success-styles";
      styles.textContent = `
                @keyframes slideDown {
                    from {
                        opacity: 0;
                        transform: translateX(-50%) translateY(-20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(-50%) translateY(0);
                    }
                }
            `;
      document.head.appendChild(styles);
    }

    document.body.appendChild(notification);

    // Remover após 4 segundos
    setTimeout(() => {
      if (notification.parentElement) {
        notification.style.animation = "slideDown 0.3s ease-out reverse";
        setTimeout(() => notification.remove(), 300);
      }
    }, 4000);
  }

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
    const refreshPending = document.getElementById("refresh-pending");
    const refreshApproved = document.getElementById("refresh-approved");
    const refreshFeedback = document.getElementById("refresh-feedback");

    if (refreshPending)
      refreshPending.addEventListener("click", loadPendingSuggestions);
    if (refreshApproved)
      refreshApproved.addEventListener("click", loadApprovedSuggestions);
    if (refreshFeedback)
      refreshFeedback.addEventListener("click", loadFeedbacks);

    // Configurar dropdown de exportação
    setupExportDropdown();
    setupSimpleDashboard();
  }

  // Carregar categorias
  function loadCategories() {
    allCategories = [
      { id: "Jurídico", nome: "Jurídico" },
      { id: "Administrativo", nome: "Administrativo" },
      { id: "Pesquisa", nome: "Pesquisa" },
      { id: "Redação", nome: "Redação" },
      { id: "Análise de Documentos", nome: "Análise de Documentos" },
      { id: "Pareceres", nome: "Pareceres" },
      { id: "Petições", nome: "Petições" },
      { id: "Outros", nome: "Outros" },
    ];

    populateCategoryFilter();
  }
 
/**
 * Formatar informações do usuário para exibição
 */
  function formatUserInfo(userInfo) {
    if (!userInfo) {
      return "<p><em>Informações do usuário não disponíveis</em></p>";
    }

    return `
        <div class="user-info-section">
            <h4><i class="fas fa-user"></i> Conta do Navegador</h4>
            
            <div class="info-grid">
                <div class="info-group">
                    <h5><i class="fas fa-user-circle"></i> Identificação</h5>
                    <p><strong>Nome:</strong> ${
                      userInfo.userName || "Não identificado"
                    }</p>
                    <p><strong>Email:</strong> ${
                      userInfo.userEmail || "Não identificado"
                    }</p>
                    <p><strong>Conta Institucional:</strong> ${
                      userInfo.isInstitutional ? "✅ Sim" : "❌ Não"
                    }</p>
                </div>
                
                <div class="info-group">
                    <h5><i class="fas fa-clock"></i> Data/Hora</h5>
                    <p><strong>Data/Hora:</strong> ${
                      userInfo.localTime || "N/A"
                    }</p>
                    <p><strong>Session ID:</strong> ${
                      userInfo.sessionId || "N/A"
                    }</p>
                </div>
                
                <div class="info-group full-width">
                    <h5><i class="fas fa-info-circle"></i> Captura</h5>
                    <p><strong>Método:</strong> ${
                      userInfo.captureMethod || "N/A"
                    }</p>
                    <p><strong>Domínio:</strong> ${userInfo.domain || "N/A"}</p>
                </div>
            </div>
        </div>
    `;
  }

  // Preencher dropdown de categorias
  function populateCategoryFilter() {
    if (!categoryFilter) return;

    categoryFilter.innerHTML =
      '<option value="all">Todas as categorias</option>';

    allCategories.forEach((category) => {
      const option = document.createElement("option");
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

    db.collection("sugestoes")
      .where("status", "==", "pending")
      .orderBy("date", "desc")
      .get()
      .then((snapshot) => {
        allPendingSuggestions = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        if (pendingCount)
          pendingCount.textContent = allPendingSuggestions.length;
        renderPendingSuggestions();
      })
      .catch((error) => {
        console.error("Erro ao carregar sugestões pendentes:", error);
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

    pendingSuggestions.innerHTML = "";

    filteredSuggestions.forEach((suggestion) => {
      const title = suggestion.title || "Sem título";
      const text = suggestion.text || "Sem descrição";
      const category = suggestion.category || "";

      let dateStr = "Data não disponível";
      if (suggestion.date) {
        try {
          dateStr = new Date(suggestion.date.seconds * 1000).toLocaleDateString(
            "pt-BR"
          );
        } catch (e) {
          console.error("Erro ao formatar data:", e);
        }
      }

      const categoryName = getCategoryName(category);

      const suggestionElement = document.createElement("div");
      suggestionElement.className = "suggestion-item";
      suggestionElement.innerHTML = `
                <h3 class="suggestion-title">${title}</h3>
                <div class="suggestion-details">
                    <p>${text.substring(0, 150)}${
        text.length > 150 ? "..." : ""
      }</p>
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
      suggestionElement
        .querySelector(".view-btn")
        .addEventListener("click", () => {
          openSuggestionModal(suggestion, "pending");
        });

      suggestionElement
        .querySelector(".approve-btn")
        .addEventListener("click", () => {
          approveSuggestion(suggestion.id);
        });

      suggestionElement
        .querySelector(".reject-btn")
        .addEventListener("click", () => {
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

    db.collection("sugestoes")
      .where("status", "==", "approved")
      .orderBy("date", "desc")
      .get()
      .then((snapshot) => {
        allApprovedSuggestions = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        if (approvedCount)
          approvedCount.textContent = allApprovedSuggestions.length;
        renderApprovedSuggestions();
      })
      .catch((error) => {
        console.error("Erro ao carregar sugestões aprovadas:", error);
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

    approvedSuggestions.innerHTML = "";

    filteredSuggestions.forEach((suggestion) => {
      const title = suggestion.title || "Sem título";
      const text = suggestion.text || "Sem descrição";
      const category = suggestion.category || "";

      let dateStr = "Data não disponível";
      if (suggestion.date) {
        try {
          dateStr = new Date(suggestion.date.seconds * 1000).toLocaleDateString(
            "pt-BR"
          );
        } catch (e) {
          console.error("Erro ao formatar data:", e);
        }
      }

      let approvedDateStr = "Data não disponível";
      if (suggestion.approvalDate) {
        try {
          approvedDateStr = new Date(
            suggestion.approvalDate.seconds * 1000
          ).toLocaleDateString("pt-BR");
        } catch (e) {
          console.error("Erro ao formatar data de aprovação:", e);
        }
      }

      const categoryName = getCategoryName(category);

      const suggestionElement = document.createElement("div");
      suggestionElement.className = "suggestion-item";
      suggestionElement.innerHTML = `
                <h3 class="suggestion-title">${title}</h3>
                <div class="suggestion-details">
                    <p>${text.substring(0, 150)}${
        text.length > 150 ? "..." : ""
      }</p>
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

      suggestionElement
        .querySelector(".view-btn")
        .addEventListener("click", () => {
          openSuggestionModal(suggestion, "approved");
        });

      suggestionElement
        .querySelector(".delete-btn")
        .addEventListener("click", () => {
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

    db.collection("feedback")
      .orderBy("date", "desc")
      .get()
      .then((snapshot) => {
        allFeedbacks = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        renderFeedbacks();
      })
      .catch((error) => {
        console.error("Erro ao carregar feedbacks:", error);
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

    feedbackList.innerHTML = "";

    allFeedbacks.forEach((feedback) => {
      const text = feedback.text || "Sem mensagem";
      const rating = feedback.rating || "N/A";
      const status = feedback.status || "pending";
      let statusText = "";
      switch (status) {
        case "approved":
          statusText = "Aprovado";
          break;
        case "pending":
          statusText = "Pendente";
          break;
        case "rejected":
          statusText = "Rejeitado";
          break;
        default:
          statusText = "Pendente";
      }

      let ratingClass = "";
      const ratingValue = parseInt(rating);
      if (!isNaN(ratingValue)) {
        if (ratingValue >= 8) {
          ratingClass = "high-rating";
        } else if (ratingValue >= 5) {
          ratingClass = "medium-rating";
        } else {
          ratingClass = "low-rating";
        }
      }

      let dateStr = "Data não disponível";
      if (feedback.date) {
        try {
          if (typeof feedback.date.toDate === "function") {
            dateStr = feedback.date.toDate().toLocaleDateString("pt-BR");
          } else if (feedback.date.seconds) {
            dateStr = new Date(feedback.date.seconds * 1000).toLocaleDateString(
              "pt-BR"
            );
          }
        } catch (e) {
          console.error("Erro ao formatar data do feedback:", e);
        }
      }

      const feedbackElement = document.createElement("div");
      feedbackElement.className = "feedback-item";

      if (status === "approved") {
        feedbackElement.classList.add("approved");
      } else if (status === "pending") {
        feedbackElement.classList.add("pending");
      } else if (status === "rejected") {
        feedbackElement.classList.add("rejected");
      }

      feedbackElement.innerHTML = `
            <div class="feedback-header">
                <div class="feedback-rating ${ratingClass}">Avaliação: <strong>${rating}/10</strong></div>
                <span class="feedback-date">Data: ${dateStr}</span>
            </div>
            <p class="feedback-text">"${text}"</p>
            <div class="feedback-meta">
                <span class="feedback-status">Status: ${statusText}</span>
            </div>
            <div class="feedback-actions">
                ${
                  status !== "approved"
                    ? `
                    <button class="approve-feedback-btn" data-id="${feedback.id}">
                        <i class="fas fa-check"></i> Aprovar
                    </button>
                `
                    : ""
                }
                ${
                  status !== "rejected"
                    ? `
                    <button class="reject-feedback-btn" data-id="${feedback.id}">
                        <i class="fas fa-times"></i> Rejeitar
                    </button>
                `
                    : ""
                }
                <button class="delete-feedback-btn" data-id="${feedback.id}">
                    <i class="fas fa-trash"></i> Excluir
                </button>
            </div>
        `;

      feedbackList.appendChild(feedbackElement);

      const deleteButton = feedbackElement.querySelector(
        ".delete-feedback-btn"
      );
      if (deleteButton) {
        deleteButton.addEventListener("click", () => {
          deleteFeedback(feedback.id);
        });
      }

      const approveButton = feedbackElement.querySelector(
        ".approve-feedback-btn"
      );
      if (approveButton) {
        approveButton.addEventListener("click", () => {
          updateFeedbackStatus(feedback.id, "approved");
        });
      }

      const rejectButton = feedbackElement.querySelector(
        ".reject-feedback-btn"
      );
      if (rejectButton) {
        rejectButton.addEventListener("click", () => {
          updateFeedbackStatus(feedback.id, "rejected");
        });
      }
    });
  }

  // Configurar navegação
  function setupNavigation() {
    if (!navItems) return;

    navItems.forEach((item) => {
      item.addEventListener("click", () => {
        navItems.forEach((i) => i.classList.remove("active"));
        item.classList.add("active");

        const tabId = item.getAttribute("data-tab");
        if (contentTabs) {
          contentTabs.forEach((tab) => {
            tab.classList.remove("active");
            if (tab.id === `${tabId}-tab`) {
              tab.classList.add("active");
            }
          });
        }
      });
    });
  }

  // Configurar pesquisa e filtros
  function setupSearchAndFilters() {
    if (searchInput) {
      searchInput.addEventListener("input", () => {
        currentSearch = searchInput.value.toLowerCase().trim();
        renderPendingSuggestions();
        renderApprovedSuggestions();
      });
    }

    if (categoryFilter) {
      categoryFilter.addEventListener("change", () => {
        currentFilter = categoryFilter.value;
        renderPendingSuggestions();
        renderApprovedSuggestions();
      });
    }
  }

  // Filtrar sugestões
  function filterSuggestions(suggestions) {
    return suggestions.filter((suggestion) => {
      if (currentFilter !== "all" && suggestion.category !== currentFilter) {
        return false;
      }

      if (currentSearch) {
        const title = suggestion.title || "";
        const text = suggestion.text || "";
        const comment = suggestion.comment || "";
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
    const category = allCategories.find((cat) => cat.id === categoryId);
    return category ? category.nome : "Sem categoria";
  }

  // Abrir modal de sugestão
  function openSuggestionModal(suggestion, type) {
    if (!modal || !modalTitle || !modalBody || !modalFooter) return;

    const title = suggestion.title || "Sem título";
    const text = suggestion.text || "Sem descrição";
    const comment = suggestion.comment || "";
    const category = suggestion.category || "";
    const categoryName = getCategoryName(category);

    let dateStr = "Data não disponível";
    if (suggestion.date) {
      try {
        dateStr = new Date(suggestion.date.seconds * 1000).toLocaleDateString(
          "pt-BR"
        );
      } catch (e) {
        console.error("Erro ao formatar data:", e);
      }
    }

    modalTitle.textContent = title;

    modalBody.innerHTML = `
    <div class="suggestion-details">
        <div class="detail-section">
            <h4><i class="fas fa-file-alt"></i> Detalhes da Sugestão</h4>
            <p><strong>Título:</strong> ${title}</p>
            <p><strong>Categoria:</strong> ${categoryName}</p>
            <p><strong>Data de Envio:</strong> ${dateStr}</p>
            <p><strong>Status:</strong> <span class="status-badge ${
              suggestion.status
            }">${
      suggestion.status === "pending" ? "Pendente" : "Aprovado"
    }</span></p>
            ${
              suggestion.author
                ? `<p><strong>Autor:</strong> ${suggestion.author}</p>`
                : ""
            }
            ${
              suggestion.email
                ? `<p><strong>Email:</strong> ${suggestion.email}</p>`
                : ""
            }
            ${
              suggestion.status === "approved" && suggestion.approvalDate
                ? `<p><strong>Data de aprovação:</strong> ${new Date(
                    suggestion.approvalDate.seconds * 1000
                  ).toLocaleDateString("pt-BR")}</p>`
                : ""
            }
        </div>
        
        <div class="detail-section">
            <h4><i class="fas fa-quote-left"></i> Texto do Prompt</h4>
            <div class="prompt-text">${text}</div>
        </div>
        
        ${
          comment
            ? `
        <div class="detail-section">
            <h4><i class="fas fa-comment"></i> Comentário</h4>
            <div class="comment-text">${comment}</div>
        </div>
        `
            : ""
        }
        
        ${suggestion.userInfo ? formatUserInfo(suggestion.userInfo) : ""}
    </div>
`;

    modalFooter.innerHTML = "";

    if (type === "pending") {
      const approveButton = document.createElement("button");
      approveButton.className = "approve-btn";
      approveButton.innerHTML = '<i class="fas fa-check"></i> Aprovar';
      approveButton.addEventListener("click", () => {
        approveSuggestion(suggestion.id);
        modal.classList.remove("active");
      });

      const rejectButton = document.createElement("button");
      rejectButton.className = "reject-btn";
      rejectButton.innerHTML = '<i class="fas fa-times"></i> Rejeitar';
      rejectButton.addEventListener("click", () => {
        rejectSuggestion(suggestion.id);
        modal.classList.remove("active");
      });

      modalFooter.appendChild(approveButton);
      modalFooter.appendChild(rejectButton);
    }

    const deleteButton = document.createElement("button");
    deleteButton.className = "delete-btn";
    deleteButton.innerHTML = '<i class="fas fa-trash"></i> Excluir';
    deleteButton.addEventListener("click", () => {
      modal.classList.remove("active");
      deleteSuggestion(suggestion.id);
    });

    modalFooter.appendChild(deleteButton);
    modal.classList.add("active");
  }

  // Configurar modal
  function setupModal() {
    if (!modal || !closeModal) return;

    closeModal.addEventListener("click", () => {
      modal.classList.remove("active");
    });

    window.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.classList.remove("active");
      }
    });
  }

  // Aprovar sugestão
  function approveSuggestion(id) {
    if (confirm("Tem certeza que deseja aprovar esta sugestão?")) {
      db.collection("sugestoes")
        .doc(id)
        .update({
          status: "approved",
          approvalDate: firebase.firestore.FieldValue.serverTimestamp(),
        })
        .then(() => {
          alert("Sugestão aprovada com sucesso!");
          loadPendingSuggestions();
          loadApprovedSuggestions();
        })
        .catch((error) => {
          console.error("Erro ao aprovar sugestão:", error);
          alert("Erro ao aprovar sugestão. Tente novamente.");
        });
    }
  }

  // Rejeitar sugestão
  function rejectSuggestion(id) {
    if (confirm("Tem certeza que deseja rejeitar esta sugestão?")) {
      db.collection("sugestoes")
        .doc(id)
        .update({
          status: "rejected",
          rejectionDate: firebase.firestore.FieldValue.serverTimestamp(),
        })
        .then(() => {
          alert("Sugestão rejeitada com sucesso!");
          loadPendingSuggestions();
        })
        .catch((error) => {
          console.error("Erro ao rejeitar sugestão:", error);
          alert("Erro ao rejeitar sugestão. Tente novamente.");
        });
    }
  }

  // Excluir sugestão
  function deleteSuggestion(id) {
    if (
      confirm(
        "Tem certeza que deseja excluir esta sugestão? Esta ação não pode ser desfeita."
      )
    ) {
      db.collection("sugestoes")
        .doc(id)
        .delete()
        .then(() => {
          alert("Sugestão excluída com sucesso!");
          loadPendingSuggestions();
          loadApprovedSuggestions();
        })
        .catch((error) => {
          console.error("Erro ao excluir sugestão:", error);
          alert("Erro ao excluir sugestão. Tente novamente.");
        });
    }
  }

  // Excluir feedback
  function deleteFeedback(id) {
    if (confirm("Tem certeza que deseja excluir este feedback?")) {
      db.collection("feedback")
        .doc(id)
        .delete()
        .then(() => {
          alert("Feedback excluído com sucesso!");
          loadFeedbacks();
        })
        .catch((error) => {
          console.error("Erro ao excluir feedback:", error);
          alert("Erro ao excluir feedback. Tente novamente.");
        });
    }
  }

  // Atualizar status do feedback
  function updateFeedbackStatus(id, newStatus) {
    const statusText = newStatus === "approved" ? "aprovar" : "rejeitar";

    if (confirm(`Tem certeza que deseja ${statusText} este feedback?`)) {
      db.collection("feedback")
        .doc(id)
        .update({
          status: newStatus,
          statusUpdatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        })
        .then(() => {
          alert(
            `Feedback ${
              newStatus === "approved" ? "aprovado" : "rejeitado"
            } com sucesso!`
          );
          loadFeedbacks();
        })
        .catch((error) => {
          console.error(`Erro ao ${statusText} feedback:`, error);
          alert(`Erro ao ${statusText} feedback. Tente novamente.`);
        });
    }
  }

  // Configurar dropdown de relatórios (substitui setupExportDropdown)
  function setupExportDropdown() {
    const exportDropdownBtn = document.getElementById("export-dropdown-btn");
    const exportOptions = document.getElementById("export-options");
    const exportOptionButtons = document.querySelectorAll(".export-option");

    if (!exportDropdownBtn || !exportOptions) {
      console.warn("Elementos de relatório não encontrados");
      return;
    }

    // Toggle do dropdown
    exportDropdownBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      exportOptions.classList.toggle("show");
      console.log("Dropdown de relatórios clicado");
    });

    // Fechar dropdown ao clicar fora
    document.addEventListener("click", (e) => {
      if (!e.target.closest(".export-dropdown")) {
        exportOptions.classList.remove("show");
      }
    });

    // Configurar cada opção de relatório
    exportOptionButtons.forEach((button) => {
      button.addEventListener("click", (e) => {
        e.stopPropagation();
        const format = button.getAttribute("data-format");

        console.log("Relatório selecionado:", format);

        // Fechar dropdown
        exportOptions.classList.remove("show");

        // Gerar relatório
        switch (format) {
          case "excel":
            generateStatisticsReport("excel");
            break;
          case "pdf":
            generateStatisticsReport("pdf");
            break;
          case "csv":
            generateStatisticsReport("csv");
            break;
          case "json":
            generateStatisticsReport("json");
            break;
          default:
            console.warn("Formato não reconhecido:", format);
        }
      });
    });

    console.log("✅ Dropdown de relatórios configurado");
  }

  // Gerar relatório de estatísticas (substitui exportApprovedSuggestions)
  function generateStatisticsReport(format) {
    console.log(`📊 Gerando relatório no formato: ${format}`);

    // Mostrar loading
    const exportBtn = document.getElementById("export-dropdown-btn");
    if (exportBtn) {
      exportBtn.classList.add("loading");
      exportBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Gerando...';
    }

    // Calcular estatísticas
    const stats = calculateStatistics();
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, "-");

    setTimeout(() => {
      try {
        switch (format) {
          case "csv":
            exportStatisticsToCSV(stats, timestamp);
            break;
          case "excel":
            exportStatisticsToExcel(stats, timestamp);
            break;
          case "pdf":
            generateInteractiveDashboard(stats, timestamp); // Nova função!
            break;
          case "json":
            exportStatisticsToJSON(stats, timestamp);
            break;
          default:
            console.error("Formato não suportado:", format);
            alert("Formato não suportado!");
            return;
        }
      } catch (error) {
        console.error("Erro ao gerar relatório:", error);
        alert("Erro ao gerar relatório. Tente novamente.");
      } finally {
        // Restaurar botão
        if (exportBtn) {
          exportBtn.classList.remove("loading");
          exportBtn.innerHTML =
            '<i class="fas fa-download"></i> Exportar Dados <i class="fas fa-chevron-down"></i>';
        }
      }
    }, 1000);
  }
  // Mostrar feedback de sucesso na exportação
  function showExportSuccess(message) {
    const exportBtn = document.getElementById("export-dropdown-btn");
    if (exportBtn) {
      exportBtn.classList.add("success");
      exportBtn.innerHTML = '<i class="fas fa-check"></i> Sucesso!';

      setTimeout(() => {
        exportBtn.classList.remove("success");
        exportBtn.innerHTML =
          '<i class="fas fa-download"></i> Exportar Dados <i class="fas fa-chevron-down"></i>';
      }, 2000);
    }

    // Mostrar notificação
    const notification = document.createElement("div");
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #28a745;
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        font-weight: 600;
    `;
    notification.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.remove();
    }, 3000);
  }

  // Calcular estatísticas completas
  function calculateStatistics() {
    console.log("📊 Calculando estatísticas...");

    try {
      // Verificar se os dados existem
      if (!allApprovedSuggestions || !allPendingSuggestions || !allFeedbacks) {
        console.warn("⚠️ Dados não carregados completamente");
        return getDefaultStats();
      }

      const allSuggestions = [
        ...allApprovedSuggestions,
        ...allPendingSuggestions,
      ];
      const totalSuggestions = allSuggestions.length;

      if (totalSuggestions === 0) {
        console.warn("⚠️ Nenhuma sugestão encontrada");
        return getDefaultStats();
      }

      // Estatísticas gerais
      const totalApproved = allApprovedSuggestions.length;
      const totalPending = allPendingSuggestions.length;
      const totalRejected = 0; // Assumindo que rejeitadas são excluídas

      const approvalRate =
        totalSuggestions > 0
          ? Math.round((totalApproved / totalSuggestions) * 100)
          : 0;

      // Calcular tempo médio de aprovação
      let avgApprovalTime = 0;
      if (totalApproved > 0) {
        const approvalTimes = allApprovedSuggestions
          .filter((s) => s.date && s.approvalDate)
          .map((s) => {
            try {
              const submitDate = s.date.seconds
                ? new Date(s.date.seconds * 1000)
                : new Date(s.date);
              const approvalDate = s.approvalDate.seconds
                ? new Date(s.approvalDate.seconds * 1000)
                : new Date(s.approvalDate);
              return (
                Math.abs(approvalDate - submitDate) / (1000 * 60 * 60 * 24)
              );
            } catch (e) {
              return 0;
            }
          })
          .filter((time) => time > 0);

        avgApprovalTime =
          approvalTimes.length > 0
            ? Math.round(
                approvalTimes.reduce((a, b) => a + b, 0) / approvalTimes.length
              )
            : 0;
      }

      // Estatísticas por categoria
      const byCategory = {};
      allCategories.forEach((category) => {
        const categoryId = category.id;
        const categoryName = category.nome;

        const totalInCategory = allSuggestions.filter(
          (s) => s.category === categoryId
        ).length;
        const approvedInCategory = allApprovedSuggestions.filter(
          (s) => s.category === categoryId
        ).length;
        const approvalRateCategory =
          totalInCategory > 0
            ? Math.round((approvedInCategory / totalInCategory) * 100)
            : 0;

        if (totalInCategory > 0) {
          byCategory[categoryName] = {
            total: totalInCategory,
            approved: approvedInCategory,
            pending: allPendingSuggestions.filter(
              (s) => s.category === categoryId
            ).length,
            approvalRate: approvalRateCategory,
          };
        }
      });

      // Se não há categorias, criar uma categoria padrão
      if (Object.keys(byCategory).length === 0) {
        byCategory["Geral"] = {
          total: totalSuggestions,
          approved: totalApproved,
          pending: totalPending,
          approvalRate: approvalRate,
        };
      }

      // Estatísticas mensais
      const monthly = {};
      allApprovedSuggestions.forEach((suggestion) => {
        try {
          const date = suggestion.approvalDate?.seconds
            ? new Date(suggestion.approvalDate.seconds * 1000)
            : suggestion.date?.seconds
            ? new Date(suggestion.date.seconds * 1000)
            : new Date();

          const monthKey = date.toLocaleDateString("pt-BR", {
            year: "numeric",
            month: "short",
          });

          monthly[monthKey] = (monthly[monthKey] || 0) + 1;
        } catch (e) {
          console.warn("Erro ao processar data:", e);
        }
      });

      // Se não há dados mensais, criar mês atual
      if (Object.keys(monthly).length === 0) {
        const currentMonth = new Date().toLocaleDateString("pt-BR", {
          year: "numeric",
          month: "short",
        });
        monthly[currentMonth] = totalApproved;
      }

      // Estatísticas de feedback
      const feedbackStats = {
        total: allFeedbacks.length,
        approved: allFeedbacks.filter((f) => f.status === "approved").length,
        pending: allFeedbacks.filter((f) => f.status === "pending" || !f.status)
          .length,
        rejected: allFeedbacks.filter((f) => f.status === "rejected").length,
        averageRating: 0,
      };

      // Calcular média de rating
      const validRatings = allFeedbacks
        .map((f) => parseInt(f.rating))
        .filter((r) => !isNaN(r) && r > 0);

      if (validRatings.length > 0) {
        feedbackStats.averageRating = (
          validRatings.reduce((a, b) => a + b, 0) / validRatings.length
        ).toFixed(1);
      }

      // Estatísticas do mês atual
      const currentDate = new Date();
      const currentMonthStart = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        1
      );

      const currentMonthSuggestions = allSuggestions.filter((s) => {
        try {
          const suggestionDate = s.date?.seconds
            ? new Date(s.date.seconds * 1000)
            : new Date(s.date);
          return suggestionDate >= currentMonthStart;
        } catch (e) {
          return false;
        }
      });

      // Período dos dados
      const dates = allSuggestions
        .map((s) => {
          try {
            return s.date?.seconds
              ? new Date(s.date.seconds * 1000)
              : new Date(s.date);
          } catch (e) {
            return new Date();
          }
        })
        .filter((d) => d instanceof Date && !isNaN(d));

      const minDate =
        dates.length > 0 ? new Date(Math.min(...dates)) : new Date();
      const maxDate =
        dates.length > 0 ? new Date(Math.max(...dates)) : new Date();

      const stats = {
        general: {
          totalSuggestions,
          totalApproved,
          totalPending,
          totalRejected,
          overallApprovalRate: approvalRate,
          avgApprovalTime: avgApprovalTime || 0,
        },
        byCategory,
        monthly,
        feedback: feedbackStats,
        currentMonth: {
          total: currentMonthSuggestions.length,
          approved: currentMonthSuggestions.filter((s) =>
            allApprovedSuggestions.some((a) => a.id === s.id)
          ).length,
        },
        period: {
          from: minDate.toISOString(),
          to: maxDate.toISOString(),
        },
      };

      console.log("✅ Estatísticas calculadas:", stats);
      return stats;
    } catch (error) {
      console.error("❌ Erro ao calcular estatísticas:", error);
      return getDefaultStats();
    }
  }

  // Estatísticas padrão quando há erro ou dados insuficientes
  function getDefaultStats() {
    console.log("📊 Usando estatísticas padrão");

    return {
      general: {
        totalSuggestions: 0,
        totalApproved: 0,
        totalPending: 0,
        totalRejected: 0,
        overallApprovalRate: 0,
        avgApprovalTime: 0,
      },
      byCategory: {
        "Sem dados": {
          total: 0,
          approved: 0,
          pending: 0,
          approvalRate: 0,
        },
      },
      monthly: {
        [new Date().toLocaleDateString("pt-BR", {
          year: "numeric",
          month: "short",
        })]: 0,
      },
      feedback: {
        total: 0,
        approved: 0,
        pending: 0,
        rejected: 0,
        averageRating: "0.0",
      },
      currentMonth: {
        total: 0,
        approved: 0,
      },
      period: {
        from: new Date().toISOString(),
        to: new Date().toISOString(),
      },
    };
  }

  // Função auxiliar para obter chave da semana
  function getWeekKey(date) {
    const startOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date - startOfYear) / 86400000;
    const weekNumber = Math.ceil(
      (pastDaysOfYear + startOfYear.getDay() + 1) / 7
    );
    return `${date.getFullYear()}-W${String(weekNumber).padStart(2, "0")}`;
  }

  // Função auxiliar para obter data mais antiga
  function getEarliestDate() {
    const allDates = [];

    allApprovedSuggestions.forEach((s) => {
      if (s.date && s.date.seconds) {
        allDates.push(new Date(s.date.seconds * 1000));
      }
    });

    allPendingSuggestions.forEach((s) => {
      if (s.date && s.date.seconds) {
        allDates.push(new Date(s.date.seconds * 1000));
      }
    });

    if (allDates.length === 0) return new Date().toISOString();

    const earliest = new Date(Math.min(...allDates));
    return earliest.toISOString();
  }

  // Exportar estatísticas para CSV
  function exportStatisticsToCSV(stats, timestamp) {
    console.log("📊 Exportando estatísticas para CSV...");

    let csvContent = "\uFEFF"; // BOM para UTF-8

    // Cabeçalho do relatório
    csvContent += `"RELATÓRIO DE ESTATÍSTICAS - PGE-SC"\n`;
    csvContent += `"Gerado em: ${new Date().toLocaleString("pt-BR")}"\n`;
    csvContent += `"Período: ${new Date(stats.period.from).toLocaleDateString(
      "pt-BR"
    )} até ${new Date(stats.period.to).toLocaleDateString("pt-BR")}"\n\n`;

    // Estatísticas gerais
    csvContent += `"ESTATÍSTICAS GERAIS"\n`;
    csvContent += `"Métrica","Valor"\n`;
    csvContent += `"Total de Sugestões","${stats.general.totalSuggestions}"\n`;
    csvContent += `"Sugestões Pendentes","${stats.general.totalPending}"\n`;
    csvContent += `"Sugestões Aprovadas","${stats.general.totalApproved}"\n`;
    csvContent += `"Sugestões Rejeitadas","${stats.general.totalRejected}"\n`;
    csvContent += `"Taxa de Aprovação","${stats.general.overallApprovalRate}%"\n`;
    csvContent += `"Tempo Médio de Aprovação","${stats.general.avgApprovalTime} dias"\n\n`;

    // Estatísticas do mês atual
    csvContent += `"ESTATÍSTICAS DO MÊS ATUAL"\n`;
    csvContent += `"Métrica","Valor"\n`;
    csvContent += `"Aprovadas este mês","${stats.currentMonth.approved}"\n`;
    csvContent += `"Pendentes este mês","${stats.currentMonth.pending}"\n`;
    csvContent += `"Total este mês","${stats.currentMonth.total}"\n\n`;

    // Estatísticas por categoria
    csvContent += `"ESTATÍSTICAS POR CATEGORIA"\n`;
    csvContent += `"Categoria","Pendentes","Aprovadas","Total","Taxa de Aprovação (%)"\n`;
    Object.entries(stats.categories).forEach(([category, data]) => {
      csvContent += `"${category}","${data.pending}","${data.approved}","${data.total}","${data.approvalRate}%"\n`;
    });
    csvContent += "\n";

    // Estatísticas mensais
    csvContent += `"ESTATÍSTICAS MENSAIS"\n`;
    csvContent += `"Mês","Sugestões Aprovadas"\n`;
    Object.entries(stats.monthly)
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([month, count]) => {
        csvContent += `"${month}","${count}"\n`;
      });
    csvContent += "\n";

    // Estatísticas de feedback
    csvContent += `"ESTATÍSTICAS DE FEEDBACK"\n`;
    csvContent += `"Métrica","Valor"\n`;
    csvContent += `"Total de Feedbacks","${stats.feedback.total}"\n`;
    csvContent += `"Feedbacks Aprovados","${stats.feedback.approved}"\n`;
    csvContent += `"Feedbacks Pendentes","${stats.feedback.pending}"\n`;
    csvContent += `"Feedbacks Rejeitados","${stats.feedback.rejected}"\n`;
    csvContent += `"Avaliação Média","${stats.feedback.averageRating}/10"\n`;

    // Criar e baixar arquivo
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `relatorio_estatisticas_${timestamp}.csv`;
    link.style.visibility = "hidden";
    document.body.appendChild(link);

    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    alert(
      `✅ Relatório CSV gerado com sucesso!\n\n📊 Resumo:\n• ${stats.general.totalSuggestions} sugestões totais\n• ${stats.general.overallApprovalRate}% taxa de aprovação\n• ${stats.feedback.averageRating}/10 avaliação média`
    );
  }

  // Exportar estatísticas para JSON
  function exportStatisticsToJSON(stats, timestamp) {
    console.log("📄 Exportando estatísticas para JSON...");

    const reportData = {
      metadata: {
        title: "Relatório de Estatísticas - PGE-SC",
        generatedAt: stats.generatedAt,
        period: stats.period,
        version: "1.0",
      },
      summary: {
        totalSuggestions: stats.general.totalSuggestions,
        approvalRate: `${stats.general.overallApprovalRate}%`,
        avgApprovalTime: `${stats.general.avgApprovalTime} dias`,
        averageRating: `${stats.feedback.averageRating}/10`,
      },
      statistics: stats,
    };

    const jsonString = JSON.stringify(reportData, null, 2);
    const blob = new Blob([jsonString], {
      type: "application/json;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `relatorio_estatisticas_${timestamp}.json`;
    link.style.visibility = "hidden";
    document.body.appendChild(link);

    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    alert(
      `✅ Relatório JSON gerado com sucesso!\n\n📊 Resumo:\n• ${stats.general.totalSuggestions} sugestões totais\n• ${stats.general.overallApprovalRate}% taxa de aprovação\n• ${stats.feedback.averageRating}/10 avaliação média`
    );
  }

  // Exportar estatísticas para Excel
  function exportStatisticsToExcel(stats, timestamp) {
    console.log("📊 Exportando estatísticas para Excel...");

    // Verificar se a biblioteca XLSX está disponível
    if (typeof XLSX === "undefined") {
      alert(
        "Biblioteca de exportação Excel não carregada. Usando CSV como alternativa."
      );
      exportStatisticsToCSV(stats, timestamp);
      return;
    }

    // Criar workbook
    const wb = XLSX.utils.book_new();

    // Aba 1: Resumo Executivo
    const summaryData = [
      ["RELATÓRIO DE ESTATÍSTICAS - PGE-SC"],
      [`Gerado em: ${new Date().toLocaleString("pt-BR")}`],
      [
        `Período: ${new Date(stats.period.from).toLocaleDateString(
          "pt-BR"
        )} até ${new Date(stats.period.to).toLocaleDateString("pt-BR")}`,
      ],
      [""],
      ["RESUMO EXECUTIVO"],
      ["Métrica", "Valor"],
      ["Total de Sugestões", stats.general.totalSuggestions],
      ["Sugestões Pendentes", stats.general.totalPending],
      ["Sugestões Aprovadas", stats.general.totalApproved],
      ["Sugestões Rejeitadas", stats.general.totalRejected],
      ["Taxa de Aprovação", `${stats.general.overallApprovalRate}%`],
      ["Tempo Médio de Aprovação", `${stats.general.avgApprovalTime} dias`],
      [""],
      ["FEEDBACK"],
      ["Total de Feedbacks", stats.feedback.total],
      ["Avaliação Média", `${stats.feedback.averageRating}/10`],
      ["Feedbacks Aprovados", stats.feedback.approved],
      ["Feedbacks Pendentes", stats.feedback.pending],
    ];

    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    wsSummary["!cols"] = [{ wch: 25 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(wb, wsSummary, "Resumo");

    // Aba 2: Estatísticas por Categoria
    const categoryData = [
      ["ESTATÍSTICAS POR CATEGORIA"],
      [""],
      ["Categoria", "Pendentes", "Aprovadas", "Total", "Taxa de Aprovação (%)"],
    ];

    Object.entries(stats.categories).forEach(([category, data]) => {
      categoryData.push([
        category,
        data.pending,
        data.approved,
        data.total,
        parseFloat(data.approvalRate),
      ]);
    });

    const wsCategory = XLSX.utils.aoa_to_sheet(categoryData);
    wsCategory["!cols"] = [
      { wch: 25 },
      { wch: 12 },
      { wch: 12 },
      { wch: 10 },
      { wch: 20 },
    ];
    XLSX.utils.book_append_sheet(wb, wsCategory, "Por Categoria");

    // Aba 3: Evolução Mensal
    const monthlyData = [
      ["EVOLUÇÃO MENSAL"],
      [""],
      ["Mês", "Sugestões Aprovadas"],
    ];

    Object.entries(stats.monthly)
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([month, count]) => {
        monthlyData.push([month, count]);
      });

    const wsMonthly = XLSX.utils.aoa_to_sheet(monthlyData);
    wsMonthly["!cols"] = [{ wch: 15 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, wsMonthly, "Evolução Mensal");

    // Aba 4: Dados do Mês Atual
    const currentMonthData = [
      ["ESTATÍSTICAS DO MÊS ATUAL"],
      [
        `Mês: ${new Date().toLocaleDateString("pt-BR", {
          month: "long",
          year: "numeric",
        })}`,
      ],
      [""],
      ["Métrica", "Valor"],
      ["Aprovadas este mês", stats.currentMonth.approved],
      ["Pendentes este mês", stats.currentMonth.pending],
      ["Total este mês", stats.currentMonth.total],
    ];

    const wsCurrentMonth = XLSX.utils.aoa_to_sheet(currentMonthData);
    wsCurrentMonth["!cols"] = [{ wch: 20 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(wb, wsCurrentMonth, "Mês Atual");

    // Salvar arquivo
    const fileName = `relatorio_estatisticas_${timestamp}.xlsx`;
    XLSX.writeFile(wb, fileName);

    alert(
      `✅ Relatório Excel gerado com sucesso!\n\n📊 Resumo:\n• ${stats.general.totalSuggestions} sugestões totais\n• ${stats.general.overallApprovalRate}% taxa de aprovação\n• ${stats.feedback.averageRating}/10 avaliação média\n\n📋 4 abas criadas: Resumo, Por Categoria, Evolução Mensal, Mês Atual`
    );
  }

  // Gerar Dashboard HTML Interativo
  function generateInteractiveDashboard(stats, timestamp) {
    console.log("🎨 Gerando Dashboard HTML Interativo...");

    const dashboardHTML = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard PGE-SC - Relatório de Estatísticas</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/chartjs-adapter-date-fns"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            color: #333;
        }
        
        .dashboard-container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 20px;
        }
        
        .dashboard-header {
            background: white;
            border-radius: 20px;
            padding: 30px;
            margin-bottom: 30px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            text-align: center;
            position: relative;
            overflow: hidden;
        }
        
        .dashboard-header::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 5px;
            background: linear-gradient(90deg, #0066cc, #004499, #0066cc);
        }
        
        .dashboard-header h1 {
            color: #0066cc;
            font-size: 2.5rem;
            margin-bottom: 10px;
            font-weight: 700;
        }
        
        .dashboard-header h2 {
            color: #666;
            font-size: 1.3rem;
            margin-bottom: 20px;
            font-weight: 400;
        }
        
        .header-info {
            display: flex;
            justify-content: center;
            gap: 40px;
            flex-wrap: wrap;
            margin-top: 20px;
        }
        
        .header-info-item {
            display: flex;
            align-items: center;
            gap: 8px;
            color: #666;
            font-size: 0.95rem;
        }
        
        .header-info-item i {
            color: #0066cc;
        }
        
        .kpi-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 25px;
            margin-bottom: 40px;
        }
        
        .kpi-card {
            background: white;
            border-radius: 20px;
            padding: 30px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            position: relative;
            overflow: hidden;
            transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        
        .kpi-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 20px 40px rgba(0,0,0,0.15);
        }
        
        .kpi-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: var(--accent-color);
        }
        
        .kpi-card.primary { --accent-color: #0066cc; }
        .kpi-card.success { --accent-color: #28a745; }
        .kpi-card.warning { --accent-color: #ffc107; }
        .kpi-card.info { --accent-color: #17a2b8; }
        
        .kpi-icon {
            width: 60px;
            height: 60px;
            border-radius: 15px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            color: white;
            margin-bottom: 20px;
            background: var(--accent-color);
        }
        
        .kpi-value {
            font-size: 2.5rem;
            font-weight: 700;
            color: #333;
            margin-bottom: 8px;
        }
        
        .kpi-label {
            color: #666;
            font-size: 1rem;
            font-weight: 500;
        }
        
        .kpi-trend {
            position: absolute;
            top: 20px;
            right: 20px;
            background: rgba(40, 167, 69, 0.1);
            color: #28a745;
            padding: 5px 10px;
            border-radius: 20px;
            font-size: 0.8rem;
            font-weight: 600;
        }
        
        .charts-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            margin-bottom: 40px;
        }
        
        .chart-card {
            background: white;
            border-radius: 20px;
            padding: 30px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            position: relative;
        }
        
        .chart-card h3 {
            color: #333;
            font-size: 1.3rem;
            margin-bottom: 25px;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .chart-card h3 i {
            color: #0066cc;
        }
        
        .chart-container {
            position: relative;
            height: 300px;
        }
        
        .full-width {
            grid-column: 1 / -1;
        }
        
        .table-card {
            background: white;
            border-radius: 20px;
            padding: 30px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            margin-bottom: 30px;
        }
        
        .table-card h3 {
            color: #333;
            font-size: 1.3rem;
            margin-bottom: 25px;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .data-table {
            width: 100%;
            border-collapse: collapse;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
        }
        
        .data-table th {
            background: linear-gradient(135deg, #0066cc, #004499);
            color: white;
            padding: 15px;
            text-align: left;
            font-weight: 600;
        }
        
        .data-table td {
            padding: 15px;
            border-bottom: 1px solid #eee;
            transition: background-color 0.2s ease;
        }
        
        .data-table tr:hover td {
            background-color: #f8f9fa;
        }
        
        .data-table tr:last-child td {
            border-bottom: none;
        }
        
        .progress-bar {
            width: 100%;
            height: 8px;
            background: #e9ecef;
            border-radius: 4px;
            overflow: hidden;
            margin-top: 5px;
        }
        
        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #28a745, #20c997);
            border-radius: 4px;
            transition: width 0.8s ease;
        }
        
        .footer {
            background: white;
            border-radius: 20px;
            padding: 25px;
            text-align: center;
            color: #666;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            margin-top: 30px;
        }
        
        .print-btn {
            position: fixed;
            top: 20px;
            right: 20px;
            background: #0066cc;
            color: white;
            border: none;
            padding: 15px 20px;
            border-radius: 50px;
            cursor: pointer;
            font-size: 16px;
            box-shadow: 0 5px 15px rgba(0,102,204,0.3);
            transition: all 0.3s ease;
            z-index: 1000;
        }
        
        .print-btn:hover {
            background: #0052a3;
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(0,102,204,0.4);
        }
        
        @media (max-width: 768px) {
            .charts-grid {
                grid-template-columns: 1fr;
            }
            
            .header-info {
                flex-direction: column;
                gap: 15px;
            }
            
            .kpi-grid {
                grid-template-columns: 1fr;
            }
            
            .dashboard-header h1 {
                font-size: 2rem;
            }
            
            .print-btn {
                position: relative;
                margin: 20px auto;
                display: block;
            }
        }
        
        @media print {
            body {
                background: white;
            }
            
            .print-btn {
                display: none;
            }
            
            .chart-card, .kpi-card, .table-card {
                break-inside: avoid;
                box-shadow: none;
                border: 1px solid #ddd;
            }
        }
        
        .loading {
            display: flex;
            align-items: center;
            justify-content: center;
            height: 200px;
            color: #666;
        }
        
        .loading i {
            margin-right: 10px;
            animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
        
        .fade-in {
            animation: fadeIn 0.8s ease-in;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
    </style>
</head>
<body>
    <button class="print-btn" onclick="window.print()">
        <i class="fas fa-print"></i> Imprimir/Salvar PDF
    </button>
    
    <div class="dashboard-container">
        <!-- Header -->
        <div class="dashboard-header fade-in">
            <h1><i class="fas fa-chart-line"></i> Dashboard PGE-SC</h1>
            <h2>Relatório de Estatísticas - Sistema de Sugestões</h2>
            <div class="header-info">
                <div class="header-info-item">
                    <i class="fas fa-calendar"></i>
                    <span>Gerado em: ${new Date().toLocaleString(
                      "pt-BR"
                    )}</span>
                </div>
                <div class="header-info-item">
                    <i class="fas fa-clock"></i>
                    <span>Período: ${new Date(
                      stats.period.from
                    ).toLocaleDateString("pt-BR")} até ${new Date(
      stats.period.to
    ).toLocaleDateString("pt-BR")}</span>
                </div>
                <div class="header-info-item">
                    <i class="fas fa-database"></i>
                    <span>Dados em tempo real</span>
                </div>
            </div>
        </div>
        
        <!-- KPIs -->
        <div class="kpi-grid fade-in">
            <div class="kpi-card primary">
                <div class="kpi-icon">
                    <i class="fas fa-lightbulb"></i>
                </div>
                <div class="kpi-value">${stats.general.totalSuggestions}</div>
                <div class="kpi-label">Total de Sugestões</div>
                <div class="kpi-trend">+${
                  stats.currentMonth.total
                } este mês</div>
            </div>
            
            <div class="kpi-card success">
                <div class="kpi-icon">
                    <i class="fas fa-check-circle"></i>
                </div>
                <div class="kpi-value">${
                  stats.general.overallApprovalRate
                }%</div>
                <div class="kpi-label">Taxa de Aprovação</div>
                <div class="kpi-trend">${
                  stats.general.totalApproved
                } aprovadas</div>
            </div>
            
            <div class="kpi-card warning">
                <div class="kpi-icon">
                    <i class="fas fa-clock"></i>
                </div>
                <div class="kpi-value">${stats.general.avgApprovalTime}</div>
                <div class="kpi-label">Dias Médios para Aprovação</div>
                <div class="kpi-trend">${
                  stats.general.totalPending
                } pendentes</div>
            </div>
            
            <div class="kpi-card info">
                <div class="kpi-icon">
                    <i class="fas fa-star"></i>
                </div>
                <div class="kpi-value">${stats.feedback.averageRating}/10</div>
                <div class="kpi-label">Avaliação Média</div>
                <div class="kpi-trend">${stats.feedback.total} feedbacks</div>
            </div>
        </div>
        
        <!-- Gráficos -->
        <div class="charts-grid fade-in">
            <div class="chart-card">
                <h3><i class="fas fa-chart-pie"></i> Distribuição
por Status</h3>
                <div class="chart-container">
                    <canvas id="statusChart"></canvas>
                </div>
            </div>
            
            <div class="chart-card">
                <h3><i class="fas fa-chart-bar"></i> Sugestões por Categoria</h3>
                <div class="chart-container">
                    <canvas id="categoryChart"></canvas>
                </div>
            </div>
            
            <div class="chart-card full-width">
                <h3><i class="fas fa-chart-line"></i> Evolução Mensal</h3>
                <div class="chart-container">
                    <canvas id="monthlyChart"></canvas>
                </div>
            </div>
        </div>
        
        <!-- Tabela Detalhada -->
        <div class="table-card fade-in">
            <h3><i class="fas fa-table"></i> Análise Detalhada por Categoria</h3>
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Categoria</th>
                        <th>Total</th>
                        <th>Aprovadas</th>
                        <th>Taxa de Aprovação</th>
                        <th>Progresso</th>
                    </tr>
                </thead>
                <tbody>
                    ${Object.entries(stats.byCategory)
                      .map(
                        ([category, data]) => `
                        <tr>
                            <td><strong>${category}</strong></td>
                            <td>${data.total}</td>
                            <td>${data.approved}</td>
                            <td>${data.approvalRate}%</td>
                            <td>
                                <div class="progress-bar">
                                    <div class="progress-fill" style="width: ${data.approvalRate}%"></div>
                                </div>
                            </td>
                        </tr>
                    `
                      )
                      .join("")}
                </tbody>
            </table>
        </div>
        
        <!-- Estatísticas de Feedback -->
        <div class="table-card fade-in">
            <h3><i class="fas fa-comments"></i> Análise de Feedback</h3>
            <div class="kpi-grid" style="margin-bottom: 20px;">
                <div class="kpi-card success">
                    <div class="kpi-icon">
                        <i class="fas fa-thumbs-up"></i>
                    </div>
                    <div class="kpi-value">${stats.feedback.approved}</div>
                    <div class="kpi-label">Feedbacks Aprovados</div>
                </div>
                
                <div class="kpi-card warning">
                    <div class="kpi-icon">
                        <i class="fas fa-hourglass-half"></i>
                    </div>
                    <div class="kpi-value">${stats.feedback.pending}</div>
                    <div class="kpi-label">Feedbacks Pendentes</div>
                </div>
                
                <div class="kpi-card info">
                    <div class="kpi-icon">
                        <i class="fas fa-times-circle"></i>
                    </div>
                    <div class="kpi-value">${stats.feedback.rejected}</div>
                    <div class="kpi-label">Feedbacks Rejeitados</div>
                </div>
            </div>
        </div>
        
        <!-- Footer -->
        <div class="footer fade-in">
            <p><strong>© ${new Date().getFullYear()} - Procuradoria Geral do Estado de Santa Catarina</strong></p>
            <p>Relatório gerado automaticamente pelo Sistema de Administração PGE-SC</p>
            <p style="margin-top: 10px; color: #999; font-size: 0.9rem;">
                <i class="fas fa-info-circle"></i> 
                Este dashboard é interativo - passe o mouse sobre os gráficos para mais detalhes
            </p>
        </div>
    </div>
    
    <script>
        // Dados para os gráficos
        const statsData = ${JSON.stringify(stats)};
        
        // Configuração global dos gráficos
        Chart.defaults.font.family = "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";
        Chart.defaults.font.size = 12;
        Chart.defaults.color = '#666';
        
        // Gráfico de Status (Pizza)
        const statusCtx = document.getElementById('statusChart').getContext('2d');
        new Chart(statusCtx, {
            type: 'doughnut',
            data: {
                labels: ['Aprovadas', 'Pendentes', 'Rejeitadas'],
                datasets: [{
                    data: [
                        statsData.general.totalApproved,
                        statsData.general.totalPending,
                        statsData.general.totalRejected
                    ],
                    backgroundColor: [
                        '#28a745',
                        '#ffc107',
                        '#dc3545'
                    ],
                    borderWidth: 0,
                    hoverOffset: 10
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true,
                            font: {
                                size: 13,
                                weight: '600'
                            }
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0,0,0,0.8)',
                        titleColor: 'white',
                        bodyColor: 'white',
                        borderColor: '#0066cc',
                        borderWidth: 1,
                        cornerRadius: 8,
                        callbacks: {
                            label: function(context) {
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((context.parsed * 100) / total).toFixed(1);
                                return context.label + ': ' + context.parsed + ' (' + percentage + '%)';
                            }
                        }
                    }
                },
                animation: {
                    animateRotate: true,
                    duration: 2000
                }
            }
        });
        
        // Gráfico de Categorias (Barras)
        const categoryCtx = document.getElementById('categoryChart').getContext('2d');
        const categoryLabels = Object.keys(statsData.byCategory);
        const categoryData = Object.values(statsData.byCategory).map(cat => cat.total);
        
        new Chart(categoryCtx, {
            type: 'bar',
            data: {
                labels: categoryLabels,
                datasets: [{
                    label: 'Sugestões',
                    data: categoryData,
                    backgroundColor: 'rgba(0, 102, 204, 0.8)',
                    borderColor: '#0066cc',
                    borderWidth: 2,
                    borderRadius: 8,
                    borderSkipped: false,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0,0,0,0.8)',
                        titleColor: 'white',
                        bodyColor: 'white',
                        borderColor: '#0066cc',
                        borderWidth: 1,
                        cornerRadius: 8
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        },
                        grid: {
                            color: 'rgba(0,0,0,0.1)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            maxRotation: 45
                        }
                    }
                },
                animation: {
                    duration: 2000,
                    easing: 'easeOutQuart'
                }
            }
        });
        
        // Gráfico de Evolução Mensal (Linha)
        const monthlyCtx = document.getElementById('monthlyChart').getContext('2d');
        const monthlyLabels = Object.keys(statsData.monthly).sort();
        const monthlyData = monthlyLabels.map(month => statsData.monthly[month]);
        
        new Chart(monthlyCtx, {
            type: 'line',
            data: {
                labels: monthlyLabels,
                datasets: [{
                    label: 'Sugestões Aprovadas',
                    data: monthlyData,
                    borderColor: '#0066cc',
                    backgroundColor: 'rgba(0, 102, 204, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#0066cc',
                    pointBorderColor: 'white',
                    pointBorderWidth: 2,
                    pointRadius: 6,
                    pointHoverRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0,0,0,0.8)',
                        titleColor: 'white',
                        bodyColor: 'white',
                        borderColor: '#0066cc',
                        borderWidth: 1,
                        cornerRadius: 8
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        },
                        grid: {
                            color: 'rgba(0,0,0,0.1)'
                        }
                    },
                    x: {
                        grid: {
                            color: 'rgba(0,0,0,0.1)'
                        }
                    }
                },
                animation: {
                    duration: 2000,
                    easing: 'easeOutQuart'
                }
            }
        });
        
        // Animações de entrada
        document.addEventListener('DOMContentLoaded', function() {
            const cards = document.querySelectorAll('.fade-in');
            cards.forEach((card, index) => {
                setTimeout(() => {
                    card.style.opacity = '0';
                    card.style.transform = 'translateY(20px)';
                    card.style.transition = 'all 0.6s ease';
                    
                    setTimeout(() => {
                        card.style.opacity = '1';
                        card.style.transform = 'translateY(0)';
                    }, 100);
                }, index * 200);
            });
        });
        
        // Função para imprimir
        function printDashboard() {
            window.print();
        }
        
        console.log('📊 Dashboard HTML Interativo carregado com sucesso!');
    </script>
</body>
</html>`;

    // Abrir dashboard em nova janela
    const dashboardWindow = window.open("", "_blank");
    dashboardWindow.document.write(dashboardHTML);
    dashboardWindow.document.close();

    // Focar na nova janela
    dashboardWindow.focus();

    console.log("✅ Dashboard HTML Interativo gerado com sucesso!");

    // Feedback visual
    showExportSuccess("Dashboard HTML gerado com sucesso!");
  }

  /**
   * Monitorar novos feedbacks e atualizar contadores automaticamente
   */
  let lastFeedbackCount = 0;
  let feedbackListener = null;
  let isFirstLoad = true;

  function startFeedbackMonitoring() {
    console.log("🔍 Iniciando monitoramento de feedbacks...");

    if (feedbackListener) {
      feedbackListener();
    }

    try {
      feedbackListener = db.collection("feedback").onSnapshot(
        (snapshot) => {
          console.log(`📊 Total de feedbacks: ${snapshot.size}`);

          const currentCount = snapshot.size;

          // SEMPRE atualizar contadores (primeira carga ou não)
          updateFeedbackStats(snapshot);
          updateFeedbackTabCounter(currentCount);

          // Se não é primeira carga e houve mudança
          if (!isFirstLoad && currentCount > lastFeedbackCount) {
            const newFeedbacksCount = currentCount - lastFeedbackCount;

            console.log(
              `🎉 NOVO FEEDBACK DETECTADO! Quantidade: ${newFeedbacksCount}`
            );

            // Alerta visual
            alert(
              `🎉 Novo Feedback Recebido!\n\n${newFeedbacksCount} novo${
                newFeedbacksCount > 1 ? "s" : ""
              } feedback${newFeedbacksCount > 1 ? "s" : ""} foi${
                newFeedbacksCount > 1 ? "ram" : ""
              } enviado${newFeedbacksCount > 1 ? "s" : ""}!`
            );

            // Recarregar lista automaticamente
            if (typeof loadFeedbacks === "function") {
              loadFeedbacks();
            }

            // Destacar a aba de feedback brevemente
            highlightFeedbackTab();
          } else if (isFirstLoad) {
            console.log("📊 Primeira carga - definindo contagem inicial");
            isFirstLoad = false;
          }

          lastFeedbackCount = currentCount;
        },
        (error) => {
          console.error("❌ Erro no monitoramento:", error);
        }
      );
    } catch (error) {
      console.error("❌ Erro ao configurar listener:", error);
    }
  }

  /**
   * Atualizar estatísticas de feedback
   */
  function updateFeedbackStats(snapshot) {
    try {
      const totalFeedbacks = snapshot.size;
      let totalRating = 0;
      let validRatings = 0;

      // Calcular média das avaliações
      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        const rating = parseInt(data.rating);
        if (!isNaN(rating)) {
          totalRating += rating;
          validRatings++;
        }
      });

      const averageRating =
        validRatings > 0 ? (totalRating / validRatings).toFixed(1) : 0.0;

      // Atualizar elementos na tela
      const totalElement = document.getElementById("total-feedback-count");
      const averageElement = document.getElementById("avg-rating");

      if (totalElement) {
        totalElement.textContent = totalFeedbacks;
        console.log(`✅ Total atualizado: ${totalFeedbacks}`);
      }

      if (averageElement) {
        averageElement.textContent = averageRating;
        console.log(`✅ Média atualizada: ${averageRating}`);
      }
    } catch (error) {
      console.error("❌ Erro ao atualizar estatísticas:", error);
    }
  }

  /**
   * Atualizar contador na aba de feedback
   */
  function updateFeedbackTabCounter(count) {
    const feedbackCountElement = document.getElementById("feedback-count");
    if (feedbackCountElement) {
      feedbackCountElement.textContent = count;
      console.log(`✅ Contador da aba atualizado: ${count}`);
    }
  }

  /**
   * Destacar aba de feedback quando chegar novo feedback
   */
  function highlightFeedbackTab() {
    const feedbackTab = document.querySelector('[data-tab="feedback"]');
    const feedbackBadge = document.getElementById("feedback-count");

    if (feedbackTab && feedbackBadge) {
      // Adicionar classe de destaque
      feedbackBadge.style.backgroundColor = "#ff4444";
      feedbackBadge.style.animation = "pulse 1s ease-in-out 3";

      // Remover destaque após 3 segundos
      setTimeout(() => {
        feedbackBadge.style.backgroundColor = "";
        feedbackBadge.style.animation = "";
      }, 3000);
    }
  }

  function stopFeedbackMonitoring() {
    if (feedbackListener) {
      feedbackListener();
      feedbackListener = null;
    }
  }

  // Inicializar monitoramento
  setTimeout(() => {
    if (typeof db !== "undefined" && db) {
      startFeedbackMonitoring();
      console.log("✅ Monitoramento de feedbacks ativado");
    }
  }, 500);

  // Parar monitoramento ao sair da página
  window.addEventListener("beforeunload", stopFeedbackMonitoring);
  
// Nova função para configurar dashboard simplificado
function setupSimpleDashboard() {
    console.log('Configurando dashboard simplificado...');
    
    // Event listeners
    const periodSelect = document.getElementById('dashboard-period-select');
    const customInputs = document.getElementById('custom-period-inputs');
    const applyBtn = document.getElementById('apply-custom-period');
    const refreshBtn = document.getElementById('refresh-dashboard');
    const fullReportBtn = document.getElementById('open-full-report');
    
    // Mudança de período
    if (periodSelect) {
        periodSelect.addEventListener('change', function() {
            if (this.value === 'custom') {
                customInputs.style.display = 'inline-flex';
                setDefaultCustomDates();
            } else {
                customInputs.style.display = 'none';
                updateDashboardPeriod(this.value);
                loadSimpleDashboard();
            }
        });
    }
    
    // Aplicar período personalizado
    if (applyBtn) {
        applyBtn.addEventListener('click', applyCustomDashboardPeriod);
    }
    
    // Refresh dashboard
    if (refreshBtn) {
        refreshBtn.addEventListener('click', loadSimpleDashboard);
    }
    
    // Botão relatório completo (mantém sistema atual)
    if (fullReportBtn) {
        fullReportBtn.addEventListener('click', function() {
            // Usar a função existente do sistema atual
            const stats = calculateStatistics();
            const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
            generateInteractiveDashboard(stats, timestamp);
        });
    }
    
    // Carregar dashboard inicial
    updateDashboardPeriod('30');
    setTimeout(() => {
        loadSimpleDashboard();
    }, 1000);
}

// Definir datas padrão para período personalizado
function setDefaultCustomDates() {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    
    document.getElementById('dashboard-start-date').value = formatDateForInput(startDate);
    document.getElementById('dashboard-end-date').value = formatDateForInput(endDate);
}

// Formatar data para input
function formatDateForInput(date) {
    return date.toISOString().split('T')[0];
}

// Atualizar período do dashboard
function updateDashboardPeriod(periodType) {
    const now = new Date();
    let startDate, endDate, label;
    
    switch (periodType) {
        case '7':
            startDate = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
            endDate = now;
            label = 'Últimos 7 dias';
            break;
        case '30':
            startDate = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
            endDate = now;
            label = 'Últimos 30 dias';
            break;
        case '90':
            startDate = new Date(now.getTime() - (90 * 24 * 60 * 60 * 1000));
            endDate = now;
            label = 'Últimos 3 meses';
            break;
        default:
            startDate = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
            endDate = now;
            label = 'Últimos 30 dias';
    }
    
    dashboardPeriod = {
        type: periodType,
        startDate: startDate,
        endDate: endDate,
        label: label
    };
    
    // Atualizar display do período
    const periodDisplay = document.getElementById('period-display');
    if (periodDisplay) {
        periodDisplay.textContent = label;
    }
    
    console.log('Período do dashboard atualizado:', dashboardPeriod);
}

// Aplicar período personalizado
function applyCustomDashboardPeriod() {
    const startDateValue = document.getElementById('dashboard-start-date').value;
    const endDateValue = document.getElementById('dashboard-end-date').value;
    
    if (!startDateValue || !endDateValue) {
        alert('Por favor, selecione ambas as datas.');
        return;
    }
    
    const startDate = new Date(startDateValue);
    const endDate = new Date(endDateValue);
    
    if (startDate > endDate) {
        alert('A data inicial deve ser anterior à data final.');
        return;
    }
    
    // Calcular diferença em dias
    const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
    
    dashboardPeriod = {
        type: 'custom',
        startDate: startDate,
        endDate: endDate,
        label: `${startDate.toLocaleDateString('pt-BR')} até ${endDate.toLocaleDateString('pt-BR')} (${daysDiff} dias)`
    };
    
    // Atualizar display
    const periodDisplay = document.getElementById('period-display');
    if (periodDisplay) {
        periodDisplay.textContent = dashboardPeriod.label;
    }
    
    // Feedback visual no botão
    const applyBtn = document.getElementById('apply-custom-period');
    const originalText = applyBtn.innerHTML;
    applyBtn.innerHTML = '<i class="fas fa-check"></i> Aplicado!';
    applyBtn.style.background = '#28a745';
    
    setTimeout(() => {
        applyBtn.innerHTML = originalText;
        applyBtn.style.background = '';
    }, 2000);
    
    // Carregar dados
    loadSimpleDashboard();
    
    console.log('Período personalizado aplicado:', dashboardPeriod);
}

// Carregar dados do dashboard simplificado
function loadSimpleDashboard() {
    console.log('Carregando dashboard simplificado para período:', dashboardPeriod);
    
    // Mostrar loading nos KPIs
    showDashboardLoading();
    
    // Filtrar dados baseado no período selecionado
    const filteredData = filterDataByDashboardPeriod();
    
    // Atualizar KPIs
    updateDashboardKPIs(filteredData);
    
    // Atualizar resumo por categoria
    updateCategoriesSummary(filteredData);
    
    // Atualizar atividade recente
    updateRecentActivity(filteredData);
}

// Mostrar loading no dashboard
function showDashboardLoading() {
    const kpiElements = [
        'kpi-total-suggestions',
        'kpi-approved',
        'kpi-pending',
        'kpi-approval-rate',
        'kpi-avg-rating'
    ];
    
    kpiElements.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        }
    });
}

// Filtrar dados baseado no período do dashboard
function filterDataByDashboardPeriod() {
    const startTime = dashboardPeriod.startDate.getTime();
    const endTime = dashboardPeriod.endDate.getTime();
    
    // Filtrar sugestões aprovadas
    const filteredApproved = allApprovedSuggestions.filter(suggestion => {
        if (!suggestion.date) return false;
        try {
            const suggestionTime = suggestion.date.seconds ? 
                suggestion.date.seconds * 1000 : 
                new Date(suggestion.date).getTime();
            return suggestionTime >= startTime && suggestionTime <= endTime;
        } catch (e) {
            return false;
        }
    });
    
    // Filtrar sugestões pendentes
    const filteredPending = allPendingSuggestions.filter(suggestion => {
        if (!suggestion.date) return false;
        try {
            const suggestionTime = suggestion.date.seconds ? 
                suggestion.date.seconds * 1000 : 
                new Date(suggestion.date).getTime();
            return suggestionTime >= startTime && suggestionTime <= endTime;
        } catch (e) {
            return false;
        }
    });
    
    // Filtrar feedbacks
    const filteredFeedbacks = allFeedbacks.filter(feedback => {
        if (!feedback.date) return false;
        try {
            const feedbackTime = feedback.date.seconds ? 
                feedback.date.seconds * 1000 : 
                new Date(feedback.date).getTime();
            return feedbackTime >= startTime && feedbackTime <= endTime;
        } catch (e) {
            return false;
        }
    });
    
    return {
        approved: filteredApproved,
        pending: filteredPending,
        feedbacks: filteredFeedbacks,
        total: filteredApproved.length + filteredPending.length
    };
}

// Atualizar KPIs do dashboard
function updateDashboardKPIs(data) {
    // Total de sugestões
    document.getElementById('kpi-total-suggestions').textContent = data.total;
    
    // Aprovadas
    document.getElementById('kpi-approved').textContent = data.approved.length;
    
    // Pendentes
    document.getElementById('kpi-pending').textContent = data.pending.length;
    
    // Taxa de aprovação
    const approvalRate = data.total > 0 ? 
        Math.round((data.approved.length / data.total) * 100) : 0;
    document.getElementById('kpi-approval-rate').textContent = `${approvalRate}%`;
    
    // Avaliação média
    let avgRating = 0;
    if (data.feedbacks.length > 0) {
        const validRatings = data.feedbacks
            .map(f => parseInt(f.rating))
            .filter(r => !isNaN(r) && r > 0);
        
        if (validRatings.length > 0) {
            avgRating = (validRatings.reduce((a, b) => a + b, 0) / validRatings.length).toFixed(1);
        }
    }
    document.getElementById('kpi-avg-rating').textContent = `${avgRating}/10`;
    
    console.log('KPIs atualizados:', {
        total: data.total,
        approved: data.approved.length,
        pending: data.pending.length,
        approvalRate: `${approvalRate}%`,
        avgRating: `${avgRating}/10`
    });
}

// Atualizar resumo por categoria
function updateCategoriesSummary(data) {
    const categoriesContainer = document.getElementById('categories-summary');
    
    if (!categoriesContainer) return;
    
    // Agrupar por categoria
    const categoryStats = {};
    
    // Processar sugestões aprovadas
    data.approved.forEach(suggestion => {
        const category = suggestion.category || 'Sem categoria';
        if (!categoryStats[category]) {
            categoryStats[category] = { approved: 0, pending: 0, total: 0 };
        }
        categoryStats[category].approved++;
        categoryStats[category].total++;
    });
    
    // Processar sugestões pendentes
    data.pending.forEach(suggestion => {
        const category = suggestion.category || 'Sem categoria';
        if (!categoryStats[category]) {
            categoryStats[category] = { approved: 0, pending: 0, total: 0 };
        }
        categoryStats[category].pending++;
        categoryStats[category].total++;
    });
    
    // Renderizar categorias
    if (Object.keys(categoryStats).length === 0) {
        categoriesContainer.innerHTML = `
            <div style="text-align: center; color: #666; padding: 20px;">
                <i class="fas fa-info-circle"></i>
                Nenhuma sugestão encontrada no período selecionado.
            </div>
        `;
        return;
    }
    
    categoriesContainer.innerHTML = '';
    
    Object.entries(categoryStats).forEach(([category, stats]) => {
        const categoryName = getCategoryName(category);
        const approvalRate = stats.total > 0 ? 
            Math.round((stats.approved / stats.total) * 100) : 0;
        
        const categoryElement = document.createElement('div');
        categoryElement.className = 'category-item';
         categoryElement.innerHTML = `
            <div class="category-name">${categoryName}</div>
            <div class="category-stats">
                <span>Total: ${stats.total}</span>
                <span>Aprovadas: ${stats.approved}</span>
                <span>Taxa: ${approvalRate}%</span>
            </div>
        `;
        
        categoriesContainer.appendChild(categoryElement);
    });
}

// Atualizar atividade recente
function updateRecentActivity(data) {
    const activityContainer = document.getElementById('recent-activity');
    
    if (!activityContainer) return;
    
    // Combinar todas as atividades
    const activities = [];
    
    // Sugestões aprovadas
    data.approved.forEach(suggestion => {
        activities.push({
            type: 'approved',
            title: suggestion.title || 'Sugestão sem título',
            time: suggestion.date,
            icon: 'check'
        });
    });
    
    // Sugestões pendentes
    data.pending.forEach(suggestion => {
        activities.push({
            type: 'pending',
            title: suggestion.title || 'Sugestão sem título',
            time: suggestion.date,
            icon: 'clock'
        });
    });
    
    // Feedbacks
    data.feedbacks.forEach(feedback => {
        activities.push({
            type: 'feedback',
            title: `Feedback: ${feedback.text?.substring(0, 50) || 'Sem texto'}...`,
            time: feedback.date,
            icon: 'comment'
        });
    });
    
    // Ordenar por data (mais recente primeiro)
    activities.sort((a, b) => {
        const timeA = a.time?.seconds ? a.time.seconds * 1000 : new Date(a.time).getTime();
        const timeB = b.time?.seconds ? b.time.seconds * 1000 : new Date(b.time).getTime();
        return timeB - timeA;
    });
    
    // Mostrar apenas os 10 mais recentes
    const recentActivities = activities.slice(0, 10);
    
    if (recentActivities.length === 0) {
        activityContainer.innerHTML = `
            <div style="text-align: center; color: #666; padding: 20px;">
                <i class="fas fa-info-circle"></i>
                Nenhuma atividade encontrada no período selecionado.
            </div>
        `;
        return;
    }
    
    activityContainer.innerHTML = '';
    
    recentActivities.forEach(activity => {
        const timeStr = formatActivityTime(activity.time);
        
        const activityElement = document.createElement('div');
        activityElement.className = 'activity-item';
        activityElement.innerHTML = `
            <div class="activity-icon activity-${activity.type}">
                <i class="fas fa-${activity.icon}"></i>
            </div>
            <div class="activity-content">
                <div class="activity-title">${activity.title}</div>
                <div class="activity-time">${timeStr}</div>
            </div>
        `;
        
        activityContainer.appendChild(activityElement);
    });
}

// Formatar tempo da atividade
function formatActivityTime(time) {
    try {
        const date = time?.seconds ? 
            new Date(time.seconds * 1000) : 
            new Date(time);
        
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        
        if (diffMins < 1) {
            return 'Agora mesmo';
        } else if (diffMins < 60) {
            return `${diffMins} min atrás`;
        } else if (diffHours < 24) {
            return `${diffHours}h atrás`;
        } else if (diffDays < 7) {
            return `${diffDays} dias atrás`;
        } else {
            return date.toLocaleDateString('pt-BR');
        }
    } catch (e) {
        return 'Data inválida';
    }
}

// Auto-refresh do dashboard (opcional)
function startDashboardAutoRefresh() {
    // Refresh a cada 5 minutos
    setInterval(() => {
        console.log('Auto-refresh do dashboard...');
        loadSimpleDashboard();
    }, 5 * 60 * 1000);
}
});
