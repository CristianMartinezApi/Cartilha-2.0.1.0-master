document.addEventListener('DOMContentLoaded', () => {
    // Corrigindo a seleção dos containers
    const pendingContainer = document.getElementById('pending-suggestions');
    const approvedContainer = document.getElementById('approved-suggestions');
    
    console.log("pendingContainer:", pendingContainer, "approvedContainer:", approvedContainer);
    
    function fetchSuggestionsForAdmin() {
        window.db.collection("sugestoes")
        .orderBy("date", "desc")
        .onSnapshot((snapshot) => {
            // Limpar os containers antes de adicionar novos itens
            pendingContainer.innerHTML = "";
            approvedContainer.innerHTML = "";
            
            snapshot.forEach((doc) => {
                const data = doc.data();
                let suggestionItem = document.createElement('div');
                suggestionItem.classList.add('suggestion-item');
                
                if (data.status && data.status.toLowerCase().trim() === 'pending') {
                    // Exibir os itens pendentes com botões para aprovação ou rejeição
                    suggestionItem.innerHTML = `
                        <h4>${data.title}</h4>
                        <p><strong>Comentário:</strong> ${data.comment}</p>
                        <p><strong>Categoria:</strong> ${data.category}</p>
                        <p><strong>Texto do Prompt:</strong> ${data.text}</p>
                        <span>${data.date ? new Date(data.date.toDate()).toLocaleString() : "Sem data"}</span>
                        <div class="action-buttons">
                            <button class="approve-btn" data-id="${doc.id}">Aprovar</button>
                            <button class="reject-btn" data-id="${doc.id}">Rejeitar</button>
                        </div>
                    `;
                    pendingContainer.appendChild(suggestionItem);
                } else if (data.status && data.status.toLowerCase().trim() === 'approved') {
                    // Exibir os itens aprovados na ordem solicitada: título, texto, categoria, comentário
                    suggestionItem.innerHTML = `
                        <h4>${data.title}</h4>
                        <p><strong>Texto do Prompt:</strong> ${data.text}</p>
                        <p><strong>Categoria:</strong> ${data.category}</p>
                        <p><strong>Comentário:</strong> ${data.comment}</p>
                        <span>${data.date ? new Date(data.date.toDate()).toLocaleString() : "Sem data"}</span>
                    `;
                    approvedContainer.appendChild(suggestionItem);
                }
            });
            
            // Verificar se há itens pendentes
            if (pendingContainer.children.length === 0) {
                pendingContainer.innerHTML = "<p>Não há sugestões pendentes.</p>";
            }
            
            // Verificar se há itens aprovados
            if (approvedContainer.children.length === 0) {
                approvedContainer.innerHTML = "<p>Não há sugestões aprovadas.</p>";
            }
        }, (error) => {
            console.error("Erro no onSnapshot:", error);
        });
    }
    
    // Eventos de clique para aprovar/rejeitar
    document.body.addEventListener('click', (event) => {
        const id = event.target.dataset.id;
        if (event.target.classList.contains('approve-btn')) {
            approveSuggestion(id);
        } else if (event.target.classList.contains('reject-btn')) {
            rejectSuggestion(id);
        }
    });
    
    function approveSuggestion(suggestionId) {
        // Adicionar indicador visual de que a ação está em andamento
        const button = document.querySelector(`.approve-btn[data-id="${suggestionId}"]`);
        const originalText = button.textContent;
        button.textContent = "Aprovando...";
        button.disabled = true;
        
        window.db.collection("sugestoes").doc(suggestionId).update({
            status: 'approved',
            approvedAt: firebase.firestore.FieldValue.serverTimestamp()
        }).then(() => {
            console.log(`Sugestão ${suggestionId} atualizada para "approved".`);
            // O listener onSnapshot já vai atualizar a interface
        }).catch((error) => {
            console.error("Erro ao aprovar sugestão:", error);
            // Restaurar o botão em caso de erro
            button.textContent = originalText;
            button.disabled = false;
            alert("Erro ao aprovar sugestão. Por favor, tente novamente.");
        });
    }
    
    function rejectSuggestion(suggestionId) {
        // Adicionar indicador visual de que a ação está em andamento
        const button = document.querySelector(`.reject-btn[data-id="${suggestionId}"]`);
        const originalText = button.textContent;
        button.textContent = "Rejeitando...";
        button.disabled = true;
        
        window.db.collection("sugestoes").doc(suggestionId).delete()
            .then(() => {
                console.log(`Sugestão ${suggestionId} rejeitada e excluída.`);
                // O listener onSnapshot já vai atualizar a interface
            }).catch((error) => {
                console.error("Erro ao rejeitar sugestão:", error);
                // Restaurar o botão em caso de erro
                button.textContent = originalText;
                button.disabled = false;
                alert("Erro ao rejeitar sugestão. Por favor, tente novamente.");
            });
    }
    
    // Verificar se o Firebase está inicializado
    const checkFirebaseInterval = setInterval(() => {
        if (window.db) {
            clearInterval(checkFirebaseInterval);
            console.log("Firebase inicializado, carregando sugestões...");
            fetchSuggestionsForAdmin();
        }
    }, 100);
});
