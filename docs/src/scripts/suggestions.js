
/**
 * Script para gerenciar o envio de sugestões de prompts
 * Funciona tanto na página principal quanto na página de sugestões
 */
document.addEventListener("DOMContentLoaded", () => {
    const suggestionForm = document.getElementById("suggestion-form");
    
    if (!suggestionForm) return; // Verifica se o formulário existe na página atual

    suggestionForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const title = document.getElementById("prompt-title").value.trim();
        const comment = document.getElementById("prompt-comment").value.trim();
        const category = document.getElementById("prompt-category").value;
        const text = document.getElementById("prompt-text").value.trim();

        // Verificar se todos os campos estão preenchidos
        if (!title || !comment || !category || !text) {
            // Verificar se estamos na página de sugestões com Bootstrap ou na página principal
            if (document.querySelector('.alert-feedback')) {
                // Estamos na página de sugestões com Bootstrap
                showFeedback("Por favor, preencha todos os campos.", "danger");
            } else {
                // Estamos na página principal
                alert("Por favor, preencha todos os campos.");
            }
            return;
        }

        // Criar objeto de sugestão
        const suggestion = {
            title: title,
            comment: comment,
            category: category,
            text: text,
            status: "pending", // Aguardando aprovação
            date: firebase.firestore.FieldValue.serverTimestamp(),
            likes: 0,
            views: 0
        };

        try {
            // Enviar para o Firestore
            await window.db.collection("sugestoes").add(suggestion);
            
            // Verificar se estamos na página de sugestões com Bootstrap ou na página principal
            if (document.querySelector('.alert-feedback') || document.querySelector('.container.py-5')) {
                // Estamos na página de sugestões com Bootstrap
                showFeedback("Sua sugestão foi enviada e está aguardando aprovação.", "success");
            } else {
                // Estamos na página principal
                alert("Sua sugestão foi enviada e está aguardando aprovação.");
            }
            
            // Limpar o formulário
            suggestionForm.reset();
            
            // Resetar contadores de caracteres se existirem
            document.querySelectorAll(".char-counter").forEach(counter => {
                if (counter) {
                    counter.textContent = `0/${counter.textContent.split('/')[1]}`;
                    counter.className = "char-counter";
                }
            });
        } catch (error) {
            console.error("Erro ao enviar sugestão:", error);
            
            // Verificar se estamos na página de sugestões com Bootstrap ou na página principal
            if (document.querySelector('.alert-feedback') || document.querySelector('.container.py-5')) {
                // Estamos na página de sugestões com Bootstrap
                showFeedback("Erro ao enviar sugestão. Tente novamente.", "danger");
            } else {
                // Estamos na página principal
                alert("Erro ao enviar sugestão. Tente novamente.");
            }
        }
    });
    
    // Função para exibir feedback na página de sugestões com Bootstrap
    function showFeedback(message, type = "info") {
        // Verificar se a função já existe no escopo global
        if (typeof window.showFeedback === 'function') {
            window.showFeedback(message, type);
            return;
        }
        
        // Criar elemento de alerta
        const alertElement = document.createElement('div');
        alertElement.className = `alert alert-${type} alert-dismissible fade show alert-feedback`;
        alertElement.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Fechar"></button>
        `;
        
        // Adicionar ao corpo do documento
        document.body.appendChild(alertElement);
        
        // Remover automaticamente após 5 segundos
        setTimeout(() => {
            alertElement.classList.remove('show');
            setTimeout(() => alertElement.remove(), 300);
        }, 5000);
    }
});
