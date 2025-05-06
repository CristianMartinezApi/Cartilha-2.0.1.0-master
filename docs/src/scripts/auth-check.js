/**
 * auth-check.js - Verifies authentication before allowing access to admin panel
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('Auth check script loaded');
    
    // Check if Firebase is initialized
    if (typeof firebase === 'undefined') {
      console.error('Firebase não está inicializado. Verifique se os scripts do Firebase foram carregados.');
      return;
    }
  
    // Add logout button to the header
    const adminHeader = document.querySelector('.admin-header');
    if (adminHeader && !document.getElementById('logout-button')) {
      const logoutButton = document.createElement('button');
      logoutButton.id = 'logout-button';
      logoutButton.className = 'btn btn-outline-danger logout-btn ms-auto';
      logoutButton.innerHTML = '<i class="fas fa-sign-out-alt"></i> Sair';
      adminHeader.appendChild(logoutButton);
      
      // Add logout functionality
      logoutButton.addEventListener('click', function() {
        firebase.auth().signOut()
          .then(function() {
            // Clear login timestamp
            localStorage.removeItem('lastLoginTime');
            
            // Redirect to login page
            window.location.href = 'login.html';
          })
          .catch(function(error) {
            console.error('Erro ao fazer logout:', error);
            alert('Erro ao fazer logout. Por favor, tente novamente.');
          });
      });
    }
    
    // Check authentication state
    firebase.auth().onAuthStateChanged(function(user) {
      if (!user) {
        // Not logged in, redirect to login page
        console.log('User not logged in, redirecting to login page');
        window.location.href = 'login.html';
        return;
      }
      
      // Check if the user has the correct UID
      if (user.uid !== '6MWhhenutOTp1GuiJFlyu6S16VO2') {
        console.error('Usuário não autorizado tentando acessar o painel admin:', user.uid);
        
        // Sign out unauthorized user and redirect to login
        firebase.auth().signOut().then(function() {
          localStorage.removeItem('lastLoginTime');
          window.location.href = 'login.html';
        });
        return;
      }
      
      // Check session timeout
      const lastLoginTime = localStorage.getItem('lastLoginTime');
      if (!lastLoginTime) {
        // No login timestamp, redirect to login
        console.log('No login timestamp found, redirecting to login');
        window.location.href = 'login.html';
        return;
      }
      
      const currentTime = Date.now();
      const sessionAge = (currentTime - parseInt(lastLoginTime)) / (1000 * 60 * 60); // in hours
      
      if (sessionAge > 1) { // 1 hour session timeout
        // Session expired, redirect to login
        console.log('Sessão expirada após', Math.round(sessionAge * 60), 'minutos');
        firebase.auth().signOut().then(function() {
          localStorage.removeItem('lastLoginTime');
          window.location.href = 'login.html';
        });
        return;
      }
      
      // Update login timestamp to extend session
      localStorage.setItem('lastLoginTime', currentTime.toString());
      
      console.log('User authenticated as admin');
      
      // Set up session refresh
      setupSessionRefresh();
    });
    
    // Set up periodic session refresh
    function setupSessionRefresh() {
      // Refresh session every 10 minutes
      setInterval(function() {
        const lastLoginTime = localStorage.getItem('lastLoginTime');
        if (lastLoginTime) {
          localStorage.setItem('lastLoginTime', Date.now().toString());
        }
      }, 10 * 60 * 1000); // 10 minutes
      
      // Also refresh on user activity
      ['click', 'keypress', 'mousemove', 'touchstart'].forEach(function(event) {
        document.addEventListener(event, function() {
          const lastLoginTime = localStorage.getItem('lastLoginTime');
          if (lastLoginTime) {
            localStorage.setItem('lastLoginTime', Date.now().toString());
          }
        }, { passive: true });
      });
    }
  });
  