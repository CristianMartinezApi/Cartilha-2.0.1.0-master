document.addEventListener("DOMContentLoaded", () => {
    const feedbackListContainer = document.querySelector(".recent-feedback .feedback-list");
    if (!feedbackListContainer) {
        console.error("Container de feedback recentes não encontrado!");
        return;
    }

    window.db.collection("feedback")
        .where("status", "==", "approved")
        .orderBy("date", "desc")
        .onSnapshot((snapshot) => {
            feedbackListContainer.innerHTML = ""; // Limpa a lista antes de inserir os novos itens
            
            snapshot.forEach((doc) => {
                const data = doc.data();
                let feedbackItem = document.createElement("div");
                feedbackItem.classList.add("feedback-item");
                
                feedbackItem.innerHTML = `
                    <div class="feedback-rating">Avaliação: ${data.rating}/10</div>
                    <p>"${data.text}"</p>
                    <span class="feedback-date">${data.date ? new Date(data.date.toDate()).toLocaleDateString() : "Sem data"}</span>
                `;
                feedbackListContainer.appendChild(feedbackItem);
            });
        }, (error) => {
            console.error("Erro ao carregar feedbacks recentes:", error);
        });
});