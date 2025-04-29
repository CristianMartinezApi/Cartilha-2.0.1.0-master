document.addEventListener("DOMContentLoaded", () => {
    const feedbackList = document.querySelector(".feedback-list");
    if (!feedbackList) {
        console.error("Container de feedback não encontrado!");
        return;
    }
    
    console.log("Carregando feedbacks aprovados...");
    
    window.db.collection("sugestoes")
        .where("status", "==", "approved")
        .orderBy("date", "desc")
        .onSnapshot((snapshot) => {
            feedbackList.innerHTML = "";
            console.log("Feedbacks aprovados recebidos:", snapshot.size);
            snapshot.forEach((doc) => {
                const data = doc.data();
                let feedbackItem = document.createElement("div");
                feedbackItem.classList.add("feedback-item");
                
                // Se o documento não contiver avaliação, insira um placeholder ou ajuste conforme a sua lógica.
                // Exemplo abaixo utiliza data.text e data.date para exibição.
                feedbackItem.innerHTML = `
                    <div class="feedback-rating">Avaliação: ?/10</div>
                    <p>"${data.text}"</p>
                    <span class="feedback-date">${data.date ? new Date(data.date.toDate()).toLocaleDateString() : "Sem data"}</span>
                `;
                feedbackList.appendChild(feedbackItem);
            });
        }, (error) => {
            console.error("Erro ao carregar feedbacks aprovados:", error);
        });
});