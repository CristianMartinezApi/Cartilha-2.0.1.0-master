// This file contains the JavaScript logic for the admin area. It includes functions for fetching submitted prompts, displaying them for review, and updating their status to approved or rejected.

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