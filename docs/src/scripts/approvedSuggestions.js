document.addEventListener("DOMContentLoaded", () => {
    // Verifique se estamos em uma página que deve mostrar sugestões aprovadas
    const feedbackList = document.querySelector(".suggestions-list");
    
    // Se o elemento não existir nesta página, simplesmente retorne sem mostrar erro
    if (!feedbackList) {
        console.log("Container de sugestões aprovadas não encontrado nesta página - ignorando.");
        return; // Saia da função sem mostrar erro
    }
    
    console.log("Carregando sugestões aprovadas...");
    
    // O resto do seu código para carregar sugestões aprovadas...
    window.db.collection("sugestoes")
        .where("status", "==", "approved")
        .orderBy("date", "desc")
        .onSnapshot((snapshot) => {
            feedbackList.innerHTML = ""; // Limpa a lista antes de inserir os novos itens
                       
            snapshot.forEach((doc) => {
                console.log("Documento aprovado recebido:", doc.data());
                const data = doc.data();
                let feedbackItem = document.createElement("div");
                feedbackItem.classList.add("feedback-item");
                               
                // Adicionando um atributo data-category para facilitar a filtragem
                feedbackItem.setAttribute('data-category', data.category || 'Não categorizado');
                               
                // HTML atualizado com classes específicas para título e categoria
                feedbackItem.innerHTML = `
                    <h3 class="feedback-title">${data.title || 'Sem título'}</h3>
                    <div class="feedback-details">
                        <p><strong>Texto do Prompt:</strong> <span class="prompt-content">"${data.text}"</span></p>
                        <p class="feedback-category"><strong>Categoria:</strong> <span class="category-tag">${data.category || 'Não categorizado'}</span></p>
                        <p><strong>Comentário:</strong> ${data.comment || 'Sem comentário'}</p>
                    </div>
                    <span class="feedback-date">${data.date ? new Date(data.date.toDate()).toLocaleDateString() : "Sem data"}</span>
                    <button class="copy-btn" data-id="${doc.id}">Copiar Prompt</button>
                `;
                               
                feedbackList.appendChild(feedbackItem);
            });
            
            // Adicionar event listeners para os botões de cópia APÓS adicionar os itens ao DOM
            document.querySelectorAll('.copy-btn').forEach(button => {
                button.addEventListener('click', function() {
                    const docId = this.getAttribute('data-id');
                    const promptElement = this.closest('.feedback-item').querySelector('.prompt-content');
                    const promptText = promptElement.textContent.replace(/^"|"$/g, ''); // Remove aspas
                    
                    copyTextToClipboard(promptText, this);
                });
            });
        }, (error) => {
            console.error("Erro ao carregar sugestões aprovadas:", error);
        });
        
    /**
     * Função para copiar texto para a área de transferência
     * @param {string} text - Texto a ser copiado
     * @param {HTMLElement} button - Botão que foi clicado
     */
    function copyTextToClipboard(text, button) {
        // Método 1: Usando elemento temporário
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'absolute';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        
        textarea.select();
        let success = false;
        
        try {
            success = document.execCommand('copy');
            if (success) {
                updateButtonText(button, "Copiado!");
            } else {
                throw new Error('Falha ao copiar');
            }
        } catch (err) {
            console.error('Falha no método 1 de cópia:', err);
            
            // Método 2: Usando a API Clipboard
            try {
                navigator.clipboard.writeText(text).then(
                    function() {
                        updateButtonText(button, "Copiado!");
                    }, 
                    function() {
                        console.error('Falha no método 2 de cópia');
                        alert('Não foi possível copiar o texto. Por favor, copie manualmente.');
                    }
                );
            } catch (err2) {
                console.error('Falha em ambos os métodos de cópia:', err2);
                alert('Não foi possível copiar o texto. Por favor, copie manualmente.');
            }
        } finally {
            document.body.removeChild(textarea);
        }
    }
    
    /**
     * Atualiza o texto do botão temporariamente
     * @param {HTMLElement} button - Botão a ser atualizado
     * @param {string} text - Novo texto
     */
    function updateButtonText(button, text) {
        const originalText = button.textContent;
        button.textContent = text;
        
        setTimeout(() => {
            button.textContent = originalText;
        }, 2000);
    }
});
