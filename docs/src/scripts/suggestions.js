// This file manages the functionality specific to the suggestions tab.
// It includes functions for submitting prompts to the admin area and displaying prompts once they are approved.

document.addEventListener('DOMContentLoaded', () => {
    const suggestionForm = document.getElementById('suggestion-form');
    const suggestionText = document.getElementById('suggestion-text');
    const suggestionsList = document.querySelector('.suggestions-list');

    suggestionForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const prompt = suggestionText.value.trim();

        if (prompt) {
            submitPrompt(prompt);
            suggestionText.value = ''; // Clear the input field
        } else {
            alert('Obrigado pela sua sugestão!');
        }
    });

    function submitPrompt(prompt) {
        // Cria a sugestão com status "pending" e data atual
        let suggestions = JSON.parse(localStorage.getItem('suggestions') || '[]');
        const newSuggestion = {
            text: prompt,
            date: new Date().toISOString(),
            status: 'pending'
        };
        suggestions.push(newSuggestion);
        localStorage.setItem('suggestions', JSON.stringify(suggestions));
        alert('Sugestão enviada para aprovação!');
    }

    function fetchApprovedPrompts() {
        // Fetch approved prompts from the server
        fetch('/api/approved-prompts')
        .then(response => response.json())
        .then(data => {
            displayApprovedPrompts(data.prompts);
        })
        .catch(error => {
            console.error('Erro ao buscar sugestões aprovadas:', error);
        });
    }

    function displayApprovedPrompts(prompts) {
        suggestionsList.innerHTML = ''; // Clear existing suggestions
        prompts.forEach(promptData => {
            if (promptData.status === "approved") {
                const suggestionItem = document.createElement('div');
                suggestionItem.classList.add('suggestion-item');
                suggestionItem.innerHTML = `
                    <p>${promptData.text}</p>
                    <div class="suggestion-votes">
                        <button class="vote-btn">👍 <span>0</span></button>
                    </div>
                    <span class="suggestion-date">${new Date(promptData.date).toLocaleDateString()}</span>
                `;
                suggestionsList.appendChild(suggestionItem);
            }
        });
    }

    // Initial fetch of approved prompts
    fetchApprovedPrompts();
});