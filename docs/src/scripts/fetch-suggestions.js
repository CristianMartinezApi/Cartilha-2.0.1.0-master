// Manter apenas uma versão da função - remover a duplicada no final do arquivo
document.addEventListener('DOMContentLoaded', () => {
    const suggestionsList = document.querySelector('.suggestions-list');
    
    // Verificar se o elemento existe
    if (!suggestionsList) {
        console.log("Lista de sugestões não encontrada nesta página");
        return;
    }
    
    // Verificar se o db está disponível
    if (typeof db === 'undefined') {
        console.log("Firebase não inicializado ainda");
        return;
    }

    function fetchApprovedPrompts() {
        db.collection("sugestoes")
            .where("status", "==", "approved")
            .orderBy("date", "desc")
            .get()
            .then((querySnapshot) => {
                suggestionsList.innerHTML = "";
                querySnapshot.forEach((doc) => {
                    const data = doc.data();
                    const div = document.createElement('div');
                    div.classList.add('suggestion-item');
                    
                    // Formatação da data
                    let dateStr = 'Data não disponível';
                    if (data.date) {
                        try {
                            if (typeof data.date.toDate === 'function') {
                                dateStr = data.date.toDate().toLocaleDateString('pt-BR');
                            } else if (data.date.seconds) {
                                dateStr = new Date(data.date.seconds * 1000).toLocaleDateString('pt-BR');
                            }
                        } catch (e) {
                            console.error("Erro ao formatar data:", e);
                        }
                    }
                    
                    div.innerHTML = `
                        <p>${data.text}</p>
                        <small>${dateStr}</small>
                    `;
                    suggestionsList.appendChild(div);
                });
            })
            .catch((error) => {
                console.error("Erro ao buscar sugestões:", error);
            });
    }

    fetchApprovedPrompts();
});
