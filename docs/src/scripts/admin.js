/* // This file contains the JavaScript logic for the admin area. It includes functions for fetching submitted prompts, displaying them for review, and updating their status to approved or rejected.

document.addEventListener('DOMContentLoaded', () => {
    // Containers da página admin
    const pendingContainer = document.getElementById('pending-suggestions');
    const approvedContainer = document.getElementById('approved-suggestions');

    // Função para atualizar os displays do admin com as sugestões do localStorage
    function updateAdminDisplay() {
        let suggestions = JSON.parse(localStorage.getItem('suggestions') || '[]');

        // Se a propriedade "status" não existir, defina-a como "pending"
        suggestions = suggestions.map(suggestion => {
            if (!suggestion.status) {
                suggestion.status = 'pending';
            }
            return suggestion;
        });

        console.log("Sugestões armazenadas:", suggestions);
        pendingContainer.innerHTML = '';
        approvedContainer.innerHTML = '';

        suggestions.forEach((suggestion, index) => {
            if (suggestion.status === 'pending') {
                const promptItem = document.createElement('div');
                promptItem.classList.add('prompt-item');
                promptItem.innerHTML = `
                    <p>${suggestion.text}</p>
                    <button class="approve-btn" data-index="${index}">Aprovar</button>
                    <button class="reject-btn" data-index="${index}">Rejeitar</button>
                `;
                pendingContainer.appendChild(promptItem);
            } else if (suggestion.status === 'approved') {
                const promptItem = document.createElement('div');
                promptItem.classList.add('prompt-item');
                promptItem.innerHTML = `
                    <p>${suggestion.text}</p>
                    <span>${new Date(suggestion.date).toLocaleDateString()}</span>
                `;
                approvedContainer.appendChild(promptItem);
            }
        });
    }

    // Delegar eventos para botões
    pendingContainer.addEventListener('click', (event) => {
        if (event.target.classList.contains('approve-btn')) {
            const index = event.target.getAttribute('data-index');
            approvePrompt(index);
        } else if (event.target.classList.contains('reject-btn')) {
            const index = event.target.getAttribute('data-index');
            rejectPrompt(index);
        }
    });

    // Funções para alterar o status
    function approvePrompt(index) {
        let suggestions = JSON.parse(localStorage.getItem('suggestions') || '[]');
        suggestions[index].status = 'approved';
        localStorage.setItem('suggestions', JSON.stringify(suggestions));
        updateAdminDisplay();
    }

    function rejectPrompt(index) {
        let suggestions = JSON.parse(localStorage.getItem('suggestions') || '[]');
        suggestions[index].status = 'rejected';
        localStorage.setItem('suggestions', JSON.stringify(suggestions));
        updateAdminDisplay();
    }

    // Chama a função ao carregar a página
    updateAdminDisplay();
});


const approveBtn = document.getElementById('approve-btn');
const rejectBtn = document.getElementById('reject-btn');

function approveSuggestion(suggestionId) {
  db.collection("sugestoes").doc(suggestionId).update({
    status: 'approved'
  }).then(() => {
    alert("Sugestão aprovada!");
    location.reload(); // Recarrega a página para refletir as mudanças
  }).catch((error) => {
    console.error("Erro ao aprovar sugestão:", error);
  });
}

function rejectSuggestion(suggestionId) {
  db.collection("sugestoes").doc(suggestionId).delete()
    .then(() => {
      alert("Sugestão rejeitada!");
      location.reload();
    }).catch((error) => {
      console.error("Erro ao rejeitar sugestão:", error);
    });
}

// Lógica de exibição e manipulação das sugestões para o admin
function fetchSuggestionsForAdmin() {
  db.collection("sugestoes")
    .where("status", "==", "pending")
    .get()
    .then((querySnapshot) => {
      // Lógica para listar as sugestões pendentes para aprovação
    })
    .catch((error) => {
      console.error("Erro ao buscar sugestões pendentes:", error);
    });
}

fetchSuggestionsForAdmin();
 */

// admin.js - Gerencia sugestões no painel admin com Firebase

// admin.js – Interface de moderação usando apenas Firebase

document.addEventListener('DOMContentLoaded', () => {
    const pendingContainer = document.getElementById('pending-suggestions');
    const approvedContainer = document.getElementById('approved-suggestions');

    function fetchSuggestionsForAdmin() {
        db.collection("sugestoes")
            .orderBy("date", "desc")
            .get()
            .then((querySnapshot) => {
                pendingContainer.innerHTML = '';
                approvedContainer.innerHTML = '';

                querySnapshot.forEach((doc) => {
                    const data = doc.data();
                    const suggestionItem = document.createElement('div');
                    suggestionItem.classList.add('prompt-item');

                    if (data.status === 'pending') {
                        suggestionItem.innerHTML = `
                            <p>${data.text}</p>
                            <button class="approve-btn" data-id="${doc.id}">Aprovar</button>
                            <button class="reject-btn" data-id="${doc.id}">Rejeitar</button>
                        `;
                        pendingContainer.appendChild(suggestionItem);
                    } else if (data.status === 'approved') {
                        suggestionItem.innerHTML = `
                            <p>${data.text}</p>
                            <span>${new Date(data.date.toDate()).toLocaleDateString()}</span>
                        `;
                        approvedContainer.appendChild(suggestionItem);
                    }
                });
            })
            .catch((error) => {
                console.error("Erro ao buscar sugestões:", error);
            });
    }

    // Evento de clique nos botões (aproveita o container pai)
    document.body.addEventListener('click', (event) => {
        const id = event.target.dataset.id;
        if (event.target.classList.contains('approve-btn')) {
            approveSuggestion(id);
        } else if (event.target.classList.contains('reject-btn')) {
            rejectSuggestion(id);
        }
    });

    function approveSuggestion(suggestionId) {
        db.collection("sugestoes").doc(suggestionId).update({
            status: 'approved'
        }).then(() => {
            fetchSuggestionsForAdmin();
        }).catch((error) => {
            console.error("Erro ao aprovar sugestão:", error);
        });
    }

    function rejectSuggestion(suggestionId) {
        db.collection("sugestoes").doc(suggestionId).delete()
            .then(() => {
                fetchSuggestionsForAdmin();
            }).catch((error) => {
                console.error("Erro ao rejeitar sugestão:", error);
            });
    }

    fetchSuggestionsForAdmin();
});
