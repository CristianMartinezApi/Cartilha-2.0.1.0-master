/**
 * main.js - Handles user interactions for the Cartilha application
 * Primarily manages suggestion submissions and displaying approved suggestions
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM fully loaded');
    
    // Check if Firebase is initialized
    if (typeof firebase === 'undefined') {
      console.error('Firebase não está inicializado. Verifique se os scripts do Firebase foram carregados.');
      return;
    }
    
    // Initialize Firestore
    const db = firebase.firestore();
    console.log('Firebase initialized');
    
    // Handle suggestion form submission
    const suggestionForm = document.getElementById('suggestion-form');
    if (suggestionForm) {
      console.log('Formulário de sugestão encontrado na página');
      
      suggestionForm.addEventListener('submit', function(event) {
        event.preventDefault();
        console.log('Formulário submetido');
        
        // Get form fields - using the correct IDs from your HTML
        const titleField = document.getElementById('prompt-title');
        const textField = document.getElementById('prompt-text');
        const categoryField = document.getElementById('prompt-category');
        const commentField = document.getElementById('prompt-comment');
        
        console.log('Form fields found:', {
          titleField: titleField !== null,
          textField: textField !== null,
          categoryField: categoryField !== null,
          commentField: commentField !== null
        });
        
        // Check if required fields exist
        if (!titleField || !textField || !categoryField) {
          console.error('Campos obrigatórios não encontrados no formulário');
          alert('Erro no formulário: campos obrigatórios não encontrados.');
          return;
        }
        
        // Get field values
        const title = titleField.value.trim();
        const text = textField.value.trim();
        const category = categoryField.value;
        const comment = commentField ? commentField.value.trim() : '';
        
        console.log('Form values:', { title, text, category, comment });
        
        // Validate required fields
        if (!title) {
          alert('Por favor, insira um título para a sugestão.');
          titleField.focus();
          return;
        }
        
        if (!text) {
          alert('Por favor, insira o texto da sugestão.');
          textField.focus();
          return;
        }
        
        if (!category || category === '') {
          alert('Por favor, selecione uma categoria.');
          categoryField.focus();
          return;
        }
        
        // Create suggestion object
        const suggestion = {
          title: title,
          text: text,
          category: category,
          comment: comment,
          status: 'pending',
          date: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        // Disable submit button and show loading state
        const submitButton = document.getElementById('submit-suggestion');
        if (submitButton) {
          submitButton.disabled = true;
          submitButton.textContent = 'Enviando...';
        }
        
        // Submit to Firebase
        db.collection('sugestoes').add(suggestion)
          .then(function() {
            console.log('Sugestão enviada com sucesso');
            alert('Sugestão enviada com sucesso! Obrigado pela sua contribuição.');
            suggestionForm.reset();
          })
          .catch(function(error) {
            console.error('Erro ao enviar sugestão:', error);
            alert('Ocorreu um erro ao enviar sua sugestão. Por favor, tente novamente.');
          })
          .finally(function() {
            // Re-enable submit button
            if (submitButton) {
              submitButton.disabled = false;
              submitButton.textContent = 'Enviar Sugestão';
            }
          });
      });
    } else {
      console.log('Formulário de sugestão não encontrado na página atual');
    }
    
    // Display approved suggestions if we're on the suggestions page
    const suggestionsList = document.querySelector('.suggestions-list');
    if (suggestionsList) {
      console.log('Lista de sugestões encontrada, carregando sugestões aprovadas');
      
      // Show loading indicator
      suggestionsList.innerHTML = '<div class="loading">Carregando sugestões...</div>';
      
      // Load approved suggestions from Firebase
      db.collection('sugestoes')
        .where('status', '==', 'approved')
        .orderBy('date', 'desc')
        .get()
        .then(function(snapshot) {
          if (snapshot.empty) {
            suggestionsList.innerHTML = '<div class="empty-message">Não há sugestões aprovadas no momento.</div>';
            return;
          }
          
          // Clear loading indicator
          suggestionsList.innerHTML = '';
          
          // Display each suggestion
          snapshot.forEach(function(doc) {
            const data = doc.data();
            
            // Create suggestion element
            const suggestionItem = document.createElement('div');
            suggestionItem.className = 'suggestion-item';
            
            // Format date
            let dateStr = 'Data não disponível';
            if (data.date) {
              try {
                if (typeof data.date.toDate === 'function') {
                  dateStr = data.date.toDate().toLocaleDateString('pt-BR');
                } else if (data.date.seconds) {
                  dateStr = new Date(data.date.seconds * 1000).toLocaleDateString('pt-BR');
                }
              } catch (e) {
                console.error('Erro ao formatar data:', e);
              }
            }
            
            // Build HTML content
            suggestionItem.innerHTML = `
              <h3 class="feedback-title">${data.title || 'Sem título'}</h3>
              <div class="feedback-details">
                <p><strong>Texto do Prompt:</strong> "${data.text || ''}"</p>
                <p class="feedback-category"><strong>Categoria:</strong> <span class="category-tag">${data.category || 'Não categorizado'}</span></p>
                ${data.comment ? `<p><strong>Comentário:</strong> ${data.comment}</p>` : ''}
              </div>
              <div class="suggestion-meta">
                <span class="suggestion-date">Aprovado em: ${dateStr}</span>
              </div>
            `;
            
            // Add to list
            suggestionsList.appendChild(suggestionItem);
          });
        })
        .catch(function(error) {
          console.error('Erro ao carregar sugestões:', error);
          suggestionsList.innerHTML = '<div class="error-message">Erro ao carregar sugestões. Por favor, tente novamente mais tarde.</div>';
        });
    }
  });
  