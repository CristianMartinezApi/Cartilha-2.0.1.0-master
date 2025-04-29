const suggestionForm = document.getElementById('suggestion-form'); // Lembre de que sua tag form tem id="suggestion-form"
const suggestionText = document.getElementById('suggestion-text');

suggestionForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const prompt = suggestionText.value.trim();
  
    if (prompt) {
        submitPrompt(prompt);
        suggestionText.value = '';
    }
  });
// Exemplo: função para simular a inicialização do banco (Firestore)
function initializeDatabase() {
    return new Promise((resolve, reject) => {
        try {
            // Aqui você usaria o seu código real de inicialização, por exemplo:
            firebase.initializeApp(firebaseConfig);
            const db = firebase.firestore(); // Inicialize o Firestore
            window.db = db;               // Torna o db global
            console.log("Firebase inicializado. db =", window.db);
            resolve("Database initialized");
        } catch (error) {
            reject("Database initialization failed: " + error);
        }
    });
}

let isDbInitialized = false; // Flag para saber se a inicialização foi bem-sucedida

// Função principal para aguardar a inicialização
async function main() {
    try {
        await initializeDatabase();
        console.log("Database ready");
        isDbInitialized = true;
    } catch (error) {
        console.error(error);
    }
}
main();

// Altere a função submitPrompt para verificar se o banco foi inicializado
function submitPrompt(prompt) {
    if (!isDbInitialized) { 
        console.error("Database is not initialized correctly.");
        alert('Ocorreu um erro de inicialização. Tente novamente mais tarde.');
        return; // Para a execução, pois o banco não está pronto
    }
    // Se estiver inicializado, prossegue com a operação normal
    console.log("Usando db em submitPrompt:", window.db);
    window.db.collection("sugestoes").add({
        text: prompt,
        date: firebase.firestore.FieldValue.serverTimestamp(),
        status: 'pending'
    })
    .then(() => {
        alert('Sua sugestão foi enviada para aprovação!');
    })
    .catch((error) => {
        console.error("Erro ao enviar sugestão:", error);
        alert('Ocorreu um erro ao enviar sua sugestão. Tente novamente mais tarde.');
    });
}