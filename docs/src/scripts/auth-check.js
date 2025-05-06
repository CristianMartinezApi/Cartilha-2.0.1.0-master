// Verificação imediata de autenticação (fora do DOMContentLoaded)
(function() {
    console.log('Verificação de autenticação iniciada');
    
    // Verificar se o Firebase está inicializado
    if (typeof firebase === 'undefined') {
      console.error('Firebase não está inicializado. Redirecionando para login...');
      window.location.href = 'login.html';
      return;
    }
  
    // Verificar estado de autenticação
    firebase.auth().onAuthStateChanged(function(user) {
      if (!user) {
        // Não está logado, redirecionar para página de login
        console.log('Usuário não logado, redirecionando para página de login');
        window.location.href = 'login.html';
        return;
      }
      
      // Verificar se o usuário é um administrador
      firebase.firestore().collection('admins').doc(user.uid).get()
        .then(function(doc) {
          if (doc.exists) {
            // Usuário é um administrador
            console.log('Usuário é admin, verificando validade da sessão');
            
            // Verificar timeout da sessão - PARTE CRÍTICA
            const lastLoginTime = localStorage.getItem('lastLoginTime');
            if (!lastLoginTime) {
              // Sem timestamp de login, redirecionar para login
              console.log('Timestamp de login não encontrado, redirecionando para login');
              window.location.href = 'login.html';
              return;
            }
            
            const currentTime = Date.now();
            const sessionAge = (currentTime - parseInt(lastLoginTime)) / (1000 * 60); // em minutos
            console.log('Idade da sessão:', Math.round(sessionAge), 'minutos');
            
            if (sessionAge > 3) { // 3 minutos de timeout da sessão
              // Sessão expirada, redirecionar para login
              console.log('Sessão expirada após', Math.round(sessionAge), 'minutos');
              
              // Importante: Remover o timestamp ANTES de fazer logout
              localStorage.removeItem('lastLoginTime');
              
              firebase.auth().signOut().then(function() {
                window.location.href = 'login.html';
              }).catch(function(error) {
                console.error('Erro ao fazer logout:', error);
                // Mesmo com erro, redirecionar para login
                window.location.href = 'login.html';
              });
              return;
            }
            
            // Atualizar timestamp de login para estender a sessão
            localStorage.setItem('lastLoginTime', currentTime.toString());
            console.log('Timestamp de sessão atualizado:', new Date(currentTime).toLocaleTimeString());
          } else {
            // Não é um administrador, deslogar
            console.error('Usuário não é admin:', user.uid);
            
            localStorage.removeItem('lastLoginTime');
            firebase.auth().signOut().then(function() {
              window.location.href = 'login.html';
            });
            return;
          }
        })
        .catch(function(error) {
          console.error('Erro ao verificar permissão de admin:', error);
          localStorage.removeItem('lastLoginTime');
          firebase.auth().signOut().then(function() {
            window.location.href = 'login.html';
          });
        });
    });
  })();
  
  // Evento DOMContentLoaded para elementos da UI
  document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM carregado para verificação de autenticação');
    
    // Adicionar botão de logout ao cabeçalho
    const adminHeader = document.querySelector('.admin-header');
    if (adminHeader && !document.getElementById('logout-button')) {
      const logoutButton = document.createElement('button');
      logoutButton.id = 'logout-button';
      logoutButton.className = 'btn btn-outline-danger logout-btn ms-auto';
      logoutButton.innerHTML = '<i class="fas fa-sign-out-alt"></i> Sair';
      adminHeader.appendChild(logoutButton);
      
      // Adicionar funcionalidade de logout
      logoutButton.addEventListener('click', function() {
        // Importante: Remover o timestamp ANTES de fazer logout
        localStorage.removeItem('lastLoginTime');
        
        firebase.auth().signOut()
          .then(function() {
            // Redirecionar para página de login
            window.location.href = 'login.html';
          })
          .catch(function(error) {
            console.error('Erro ao fazer logout:', error);
            alert('Erro ao fazer logout. Por favor, tente novamente.');
            // Mesmo com erro, redirecionar para login
            window.location.href = 'login.html';
          });
      });
    }
    
    // Configurar verificação periódica da sessão
    setInterval(function() {
      const lastLoginTime = localStorage.getItem('lastLoginTime');
      if (lastLoginTime) {
        const currentTime = Date.now();
        const sessionAge = (currentTime - parseInt(lastLoginTime)) / (1000 * 60); // em minutos
        
        if (sessionAge > 3) {
          console.log('Sessão expirada durante verificação periódica:', Math.round(sessionAge), 'minutos');
          
          // Importante: Remover o timestamp ANTES de fazer logout
          localStorage.removeItem('lastLoginTime');
          
          firebase.auth().signOut().then(function() {
            window.location.href = 'login.html';
          }).catch(function() {
            window.location.href = 'login.html';
          });
        }
      }
    }, 30000); // Verificar a cada 30 segundos
    
    // Atualizar timestamp APENAS em interações do usuário
    ['click', 'keypress', 'mousemove', 'touchstart'].forEach(function(event) {
      document.addEventListener(event, function() {
        // Verificar se ainda estamos dentro do limite de tempo antes de atualizar
        const lastLoginTime = localStorage.getItem('lastLoginTime');
        if (lastLoginTime) {
          const currentTime = Date.now();
          const sessionAge = (currentTime - parseInt(lastLoginTime)) / (1000 * 60);
          
          if (sessionAge <= 3) {
            // Só atualiza se a sessão ainda for válida
            localStorage.setItem('lastLoginTime', currentTime.toString());
            console.log('Timestamp atualizado por interação do usuário:', new Date(currentTime).toLocaleTimeString());
          } else {
            // Sessão já expirou, forçar logout
            console.log('Sessão já expirada durante interação:', Math.round(sessionAge), 'minutos');
            
            // Importante: Remover o timestamp ANTES de fazer logout
            localStorage.removeItem('lastLoginTime');
            
            firebase.auth().signOut().then(function() {
              window.location.href = 'login.html';
            }).catch(function() {
              window.location.href = 'login.html';
            });
          }
        }
      }, { passive: true });
    });
  });
  