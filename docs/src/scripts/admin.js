document.addEventListener('DOMContentLoaded', () => {
    const pendingContainer = document.getElementById('pending-suggestions');
    const approvedContainer = document.getElementById('approved-suggestions');
    console.log("pendingContainer:", pendingContainer, "approvedContainer:", approvedContainer);

    function fetchSuggestionsForAdmin() {
        console.log("Carregando as sugestões para o admin...");
        window.db.collection("sugestoes")
        .orderBy("date", "desc")
        .onSnapshot((snapshot) => {
            pendingContainer.innerHTML = '';
            approvedContainer.innerHTML = '';
            console.log("Atualizações em tempo real, documentos recebidos:", snapshot.size);
            snapshot.forEach((doc) => {
                console.log("Documento recebido:", doc.id, doc.data());
                const data = doc.data();
                let suggestionItem = document.createElement('div');
                suggestionItem.classList.add('suggestion-item');
                suggestionItem.innerHTML = `
                    <p>${data.text}</p>
                    <span>${data.date ? new Date(data.date.toDate()).toLocaleString() : "Sem data"}</span>
                    <button class="approve-btn" data-id="${doc.id}">Aprovar</button>
                    <button class="reject-btn" data-id="${doc.id}">Rejeitar</button>
                `;
                if (data.status === 'pending') {
                    pendingContainer.appendChild(suggestionItem);
                } else if (data.status === 'approved') {
                    approvedContainer.appendChild(suggestionItem);
                }
            });
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
        window.db.collection("sugestoes").doc(suggestionId).update({
            status: 'approved'
        }).then(() => {
            fetchSuggestionsForAdmin(); // Atualize a lista se necessário
        }).catch((error) => {
            console.error("Erro ao aprovar sugestão:", error);
        });
    }

    function rejectSuggestion(suggestionId) {
        window.db.collection("sugestoes").doc(suggestionId).delete()
            .then(() => {
                fetchSuggestionsForAdmin();
            }).catch((error) => {
                console.error("Erro ao rejeitar sugestão:", error);
            });
    }

    // Chama a função para carregar as sugestões
    fetchSuggestionsForAdmin();
});
