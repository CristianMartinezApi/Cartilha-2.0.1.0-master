/* document.addEventListener("DOMContentLoaded", () => {
    const suggestionForm = document.getElementById("suggestion-form");

    suggestionForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const title = document.getElementById("prompt-title").value.trim();
        const comment = document.getElementById("prompt-comment").value.trim();
        const category = document.getElementById("prompt-category").value.trim();
        const text = document.getElementById("prompt-text").value.trim();

        if (!title || !comment || !category || !text) {
            alert("Por favor, preencha todos os campos.");
            return;
        }

        const suggestion = {
            
            title: title,
            comment: comment,
            category: category,
            text: text,
            status: "pending", // ou "approved"
            date: firebase.firestore.FieldValue.serverTimestamp()
        
          };

        try {
            await window.db.collection("sugestoes").add(suggestion);
            alert("Sua sugestão foi enviada e está aguardando aprovação.");
            suggestionForm.reset();
        } catch (error) {
            console.error("Erro ao enviar sugestão:", error);
            alert("Erro ao enviar sugestão. Tente novamente.");
        }
    });
});

// Exemplo: função para simular a inicialização do banco (Firestore)
function initializeDatabase() {
    return new Promise((resolve, reject) => {
        try {
            // Aqui você usaria o seu código real de inicialização, por exemplo:
            firebase.initializeApp(firebaseConfig);
            const db = firebase.firestore(); // Inicialize o Firestore
            window.db = db;               // Torna o db global
            console.log("Firebase inicializado. db =", window.db);
            resolve("Database initialized");
        } catch (error) {
            reject("Database initialization failed: " + error);
        }
    });
}

let isDbInitialized = false; // Flag para saber se a inicialização foi bem-sucedida

// Função principal para aguardar a inicialização
async function main() {
    try {
        await initializeDatabase();
        console.log("Database ready");
        isDbInitialized = true;
    } catch (error) {
        console.error(error);
    }
}
main(); */


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
