// Espera até que o conteúdo da página esteja completamente carregado
document.addEventListener('DOMContentLoaded', () => {
    const suggestionsList = document.querySelector('.suggestions-list');

    function fetchApprovedPrompts() {
        db.collection("sugestoes")
            .where("status", "==", "approved")
            .orderBy("date", "desc")
            .get()
            .then((querySnapshot) => {
                suggestionsList.innerHTML = ""; // Limpa a lista de sugestões
                querySnapshot.forEach((doc) => {
                    const data = doc.data();
                    const div = document.createElement('div');
                    div.classList.add('suggestion-item');
                    div.innerHTML = `
                        <p>${data.text}</p>
                        <small>${new Date(data.date).toLocaleDateString()}</small>
                    `;
                    suggestionsList.appendChild(div);
                });
            })
            .catch((error) => {
                console.error("Erro ao buscar sugestões:", error);
            });
    }

    // Chama a função para buscar as sugestões quando a página for carregada
    fetchApprovedPrompts();
});
