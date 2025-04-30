document.addEventListener("DOMContentLoaded", () => {
    const submitSurveyBtn = document.getElementById("submit-survey");
    if (!submitSurveyBtn) return;

    const ratingBtns = document.querySelectorAll(".rating-btn");
    if (ratingBtns.length > 0) {
        ratingBtns.forEach(btn => {
            btn.addEventListener("click", function() {
                // Remove a classe active de todos os botões
                ratingBtns.forEach(b => b.classList.remove("active"));
                // Adiciona a classe active no botão clicado
                this.classList.add("active");
            });
        });
    }

    submitSurveyBtn.addEventListener("click", (event) => {
        event.preventDefault();

        const feedbackText = document.getElementById("feedback").value.trim();
        const activeRatingBtn = document.querySelector(".rating-btn.active");
        const rating = activeRatingBtn ? activeRatingBtn.getAttribute("data-value") : null;

        if (!feedbackText || rating === null) {
            alert("Por favor, selecione uma avaliação e preencha o feedback.");
            return;
        }

        const newFeedback = {
            text: feedbackText,
            rating: rating,
            date: firebase.firestore.FieldValue.serverTimestamp(),
            status: "approved"
        };

        window.db.collection("feedback")
            .add(newFeedback)
            .then(() => {
                console.log("Feedback salvo com sucesso.");
                document.getElementById("feedback").value = "";
                document.querySelectorAll(".rating-btn").forEach(btn => btn.classList.remove("active"));
            })
            .catch((error) => {
                console.error("Erro ao salvar feedback:", error);
            });
    });
});