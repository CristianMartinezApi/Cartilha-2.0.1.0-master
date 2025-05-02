document.addEventListener("DOMContentLoaded", () => {
    const feedbackList = document.querySelector(".suggestions-list");
    
    if (!feedbackList) {
        console.error("Container de feedback não encontrado!");
        return;
    }
    
    console.log("Carregando feedbacks aprovados...");
    
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
                        <p><strong>Texto do Prompt:</strong> "${data.text}"</p>
                        <p class="feedback-category"><strong>Categoria:</strong> <span class="category-tag">${data.category || 'Não categorizado'}</span></p>
                        <p><strong>Comentário:</strong> ${data.comment || 'Sem comentário'}</p>
                    </div>
                    <span class="feedback-date">${data.date ? new Date(data.date.toDate()).toLocaleDateString() : "Sem data"}</span>
                `;
                
                feedbackList.appendChild(feedbackItem);
            });
        }, (error) => {
            console.error("Erro ao carregar feedbacks aprovados:", error);
        });
});
