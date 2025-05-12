/* 

document.addEventListener("DOMContentLoaded", () => {
    const suggestionsList = document.querySelector(".suggestions-list");
    
    if (!suggestionsList) {
        console.error("Container de sugestões não encontrado!");
        return;
    }
    
    console.log("Carregando sugestões aprovadas...");
    
    // Criar o container do dropdown
    const dropdownContainer = document.createElement('div');
    dropdownContainer.className = 'suggestions-dropdown-container';
    
    // Criar o cabeçalho do dropdown (que será clicável)
    const dropdownHeader = document.createElement('div');
    dropdownHeader.className = 'suggestions-dropdown-header';
    dropdownHeader.innerHTML = `
        <h3>Prompts Aprovados <span class="dropdown-arrow">⌵</span></h3>
        <span class="suggestions-count"></span>
    `;
    
    // Criar o conteúdo do dropdown (que será expandido/recolhido)
    const dropdownContent = document.createElement('div');
    dropdownContent.className = 'suggestions-dropdown-content';
    
    // Adicionar o container de filtros dentro do conteúdo do dropdown
    const filterContainer = document.createElement('div');
    filterContainer.className = 'category-filter-container';
    filterContainer.innerHTML = `
        <h4>Filtrar por categoria:</h4>
        <div class="category-filters">
            <button class="category-filter active" data-category="all">Todas</button>
            <button class="category-filter" data-category="Jurídico">Jurídico</button>
            <button class="category-filter" data-category="Administrativo">Administrativo</button>
            <button class="category-filter" data-category="Pesquisa">Pesquisa</button>
            <button class="category-filter" data-category="Redação">Redação</button>
            <button class="category-filter" data-category="Análise de Documentos">Análise de Documentos</button>
            <button class="category-filter" data-category="Pareceres">Pareceres</button>
            <button class="category-filter" data-category="Petições">Petições</button>
            <button class="category-filter" data-category="Outros">Outros</button>
        </div>
    `;
    
    // Adicionar o container de sugestões dentro do conteúdo do dropdown
    const suggestionsContainer = document.createElement('div');
    suggestionsContainer.className = 'suggestions-list-content';
    
    // Montar a estrutura do dropdown
    dropdownContent.appendChild(filterContainer);
    dropdownContent.appendChild(suggestionsContainer);
    dropdownContainer.appendChild(dropdownHeader);
    dropdownContainer.appendChild(dropdownContent);
    
    // Substituir a lista original pelo dropdown
    suggestionsList.parentNode.replaceChild(dropdownContainer, suggestionsList);
    
    // Adicionar evento de clique para expandir/recolher o dropdown
    dropdownHeader.addEventListener('click', () => {
        dropdownContent.classList.toggle('active');
        const arrow = dropdownHeader.querySelector('.dropdown-arrow');
        arrow.textContent = '⌵';
        arrow.classList.toggle('active', dropdownContent.classList.contains('active'));
    });
    
    // Carregar as sugestões aprovadas
    window.db.collection("sugestoes")
        .where("status", "==", "approved")
        .orderBy("date", "desc")
        .onSnapshot((snapshot) => {
            suggestionsContainer.innerHTML = ""; // Limpa a lista antes de inserir os novos itens
            
            // Atualizar o contador de sugestões
            const count = snapshot.size;
            const countElement = dropdownHeader.querySelector('.suggestions-count');
            countElement.textContent = `(${count})`;
            
            snapshot.forEach((doc) => {
                console.log("Documento aprovado recebido:", doc.data());
                const data = doc.data();
                let feedbackItem = document.createElement("div");
                feedbackItem.classList.add("feedback-item");
                feedbackItem.setAttribute('data-category', data.category || 'Não categorizado');
                
                // HTML atualizado com classes específicas para título e categoria
                feedbackItem.innerHTML = `
                    <h3 class="feedback-title">${data.title || 'Sem título'}</h3>
                    <div class="feedback-details">
                        <p><strong>Texto do Prompt:</strong> "${data.text}"</p>
                        <p class="feedback-category"><strong>Categoria:</strong> <span class="category-tag">${data.category || 'Não categorizado'}</span></p>
                        <p><strong>Comentário:</strong> ${data.comment || 'Sem comentário'}</p>
                    </div>
                    <span class="feedback-date">${data.date ? new Date(data.date.toDate()).toLocaleDateString() : "Sem data"}</span>
                `;
                
                suggestionsContainer.appendChild(feedbackItem);
            });
            
            // Se não houver sugestões, mostrar mensagem
            if (count === 0) {
                suggestionsContainer.innerHTML = "<p class='no-suggestions'>Não há prompts aprovados no momento.</p>";
            }
            
            // Adicionar event listeners aos botões de filtro
            const filterButtons = document.querySelectorAll('.category-filter');
            filterButtons.forEach(button => {
                button.addEventListener('click', () => {
                    // Remover classe 'active' de todos os botões
                    filterButtons.forEach(btn => btn.classList.remove('active'));
                    
                    // Adicionar classe 'active' ao botão clicado
                    button.classList.add('active');
                    
                    // Obter a categoria selecionada
                    const selectedCategory = button.dataset.category;
                    
                    // Filtrar as sugestões
                    filterSuggestions(selectedCategory, suggestionsContainer);
                });
            });
        }, (error) => {
            console.error("Erro ao carregar sugestões aprovadas:", error);
            suggestionsContainer.innerHTML = "<p class='error-message'>Erro ao carregar prompts. Por favor, tente novamente mais tarde.</p>";
        });
    
    // Função para filtrar as sugestões
    function filterSuggestions(category, container) {
        const items = container.querySelectorAll('.feedback-item');
        
        items.forEach(item => {
            if (category === 'all') {
                item.style.display = 'block'; // Mostrar todos os itens
            } else {
                // Verificar o atributo data-category
                const itemCategory = item.getAttribute('data-category');
                
                // Verificar também o texto da tag de categoria
                const categoryTag = item.querySelector('.category-tag');
                const categoryTagText = categoryTag ? categoryTag.textContent.trim() : '';
                
                if (itemCategory === category || categoryTagText === category) {
                    item.style.display = 'block'; // Mostrar itens da categoria selecionada
                } else {
                    item.style.display = 'none'; // Esconder outros itens
                }
            }
        });
    }
});
 */

/**
 * Script para gerenciar o envio de sugestões de prompts
 * Funciona tanto na página principal quanto na página de sugestões
 */
document.addEventListener("DOMContentLoaded", () => {
    const suggestionForm = document.getElementById("suggestion-form");
    
    if (!suggestionForm) return; // Verifica se o formulário existe na página atual

    suggestionForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const title = document.getElementById("prompt-title").value.trim();
        const comment = document.getElementById("prompt-comment").value.trim();
        const category = document.getElementById("prompt-category").value;
        const text = document.getElementById("prompt-text").value.trim();

        // Verificar se todos os campos estão preenchidos
        if (!title || !comment || !category || !text) {
            // Verificar se estamos na página de sugestões com Bootstrap ou na página principal
            if (document.querySelector('.alert-feedback')) {
                // Estamos na página de sugestões com Bootstrap
                showFeedback("Por favor, preencha todos os campos.", "danger");
            } else {
                // Estamos na página principal
                alert("Por favor, preencha todos os campos.");
            }
            return;
        }

        // Criar objeto de sugestão
        const suggestion = {
            title: title,
            comment: comment,
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
            
            // Verificar se estamos na página de sugestões com Bootstrap ou na página principal
            if (document.querySelector('.alert-feedback') || document.querySelector('.container.py-5')) {
                // Estamos na página de sugestões com Bootstrap
                showFeedback("Sua sugestão foi enviada e está aguardando aprovação.", "success");
            } else {
                // Estamos na página principal
                alert("Sua sugestão foi enviada e está aguardando aprovação.");
            }
            
            // Limpar o formulário
            suggestionForm.reset();
            
            // Resetar contadores de caracteres se existirem
            document.querySelectorAll(".char-counter").forEach(counter => {
                if (counter) {
                    counter.textContent = `0/${counter.textContent.split('/')[1]}`;
                    counter.className = "char-counter";
                }
            });
        } catch (error) {
            console.error("Erro ao enviar sugestão:", error);
            
            // Verificar se estamos na página de sugestões com Bootstrap ou na página principal
            if (document.querySelector('.alert-feedback') || document.querySelector('.container.py-5')) {
                // Estamos na página de sugestões com Bootstrap
                showFeedback("Erro ao enviar sugestão. Tente novamente.", "danger");
            } else {
                // Estamos na página principal
                alert("Erro ao enviar sugestão. Tente novamente.");
            }
        }
    });
    
    // Função para exibir feedback na página de sugestões com Bootstrap
    function showFeedback(message, type = "info") {
        // Verificar se a função já existe no escopo global
        if (typeof window.showFeedback === 'function') {
            window.showFeedback(message, type);
            return;
        }
        
        // Criar elemento de alerta
        const alertElement = document.createElement('div');
        alertElement.className = `alert alert-${type} alert-dismissible fade show alert-feedback`;
        alertElement.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Fechar"></button>
        `;
        
        // Adicionar ao corpo do documento
        document.body.appendChild(alertElement);
        
        // Remover automaticamente após 5 segundos
        setTimeout(() => {
            alertElement.classList.remove('show');
            setTimeout(() => alertElement.remove(), 300);
        }, 5000);
    }
});
