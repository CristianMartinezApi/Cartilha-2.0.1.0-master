// This file contains the main JavaScript logic for the application. It handles user interactions, such as submitting prompts and displaying approved prompts in the suggestions tab.

document.addEventListener('DOMContentLoaded', () => {
    const suggestionForm = document.getElementById('suggestion-form');
    const suggestionText = document.getElementById('suggestion-text');
    const suggestionsList = document.querySelector('.suggestions-list');

    suggestionForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const prompt = suggestionText.value.trim();

        if (prompt) {
            submitPrompt(prompt);
            suggestionText.value = '';
        }
    });

    function submitPrompt(prompt) {
        // Recupera o array existente ou inicia um array vazio
        let suggestions = JSON.parse(localStorage.getItem('suggestions') || '[]');
        const newSuggestion = {
            text: prompt,
            date: new Date().toISOString(), // ou use toLocaleDateString() conforme desejar
            status: 'pending'
        };
        suggestions.push(newSuggestion);
        localStorage.setItem('suggestions', JSON.stringify(suggestions));
        alert('Seu prompt foi enviado para aprovação!');
    }

    function fetchApprovedPrompts() {
        // Obtenha as sugestões aprovadas do localStorage
        const suggestions = JSON.parse(localStorage.getItem('suggestions') || '[]');
        const approved = suggestions.filter(s => s.status === 'approved');
        approved.forEach(prompt => {
            displayPrompt(prompt);
        });
    }

    function displayPrompt(prompt) {
        const suggestionItem = document.createElement('div');
        suggestionItem.classList.add('suggestion-item');
        suggestionItem.innerHTML = `
            <p>${prompt.text}</p>
            <div class="suggestion-votes">
                
            </div>
            <span class="suggestion-date">${new Date(prompt.date).toLocaleDateString()}</span>
        `;
        suggestionsList.appendChild(suggestionItem);
    }

    // Initial fetch of approved prompts
    fetchApprovedPrompts();
});