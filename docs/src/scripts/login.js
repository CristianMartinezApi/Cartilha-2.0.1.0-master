/**
 * login.js - Handles authentication for the admin panel
 */
document.addEventListener('DOMContentLoaded', function() {
    // Check if Firebase is initialized
    if (typeof firebase === 'undefined') {
      console.error('Firebase não está inicializado. Verifique se os scripts do Firebase foram carregados.');
      return;
    }
  
    // Initialize Firebase Auth
    const auth = firebase.auth();
    
    // Get UI elements
    const loginForm = document.getElementById('login-form');
    const emailInput = document.getElementById('login-email');
    const passwordInput = document.getElementById('login-password');
    const loginError = document.getElementById('login-error');
    const loginButton = document.getElementById('login-button');
    
    // Check if we're on the login page
    if (loginForm) {
      console.log('Login form found, setting up authentication');
      
      // Check if user is already logged in
      auth.onAuthStateChanged(function(user) {
        if (user && user.uid === '6MWhhenutOTp1GuiJFlyu6S16VO2') {
          // User is already logged in and is the admin, redirect to admin panel
          window.location.href = 'admin.html';
        }
      });
      
      // Handle login form submission
      loginForm.addEventListener('submit', function(event) {
        event.preventDefault();
        
        // Clear previous errors
        if (loginError) {
          loginError.textContent = '';
          loginError.style.display = 'none';
        }
        
        // Get form values
        const email = emailInput.value.trim();
        const password = passwordInput.value;
        
        // Validate form
        if (!email || !password) {
          if (loginError) {
            loginError.textContent = 'Por favor, preencha todos os campos.';
            loginError.style.display = 'block';
          }
          return;
        }
        
        // Disable login button and show loading state
        if (loginButton) {
          const originalText = loginButton.innerHTML;
          loginButton.disabled = true;
          loginButton.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Entrando...';
        }
        
        // Sign in with email and password
        auth.signInWithEmailAndPassword(email, password)
          .then(function(userCredential) {
            // Check if the user has the correct UID
            const user = userCredential.user;
            if (user.uid === '6MWhhenutOTp1GuiJFlyu6S16VO2') {
              console.log('Login bem-sucedido para o administrador');
              
              // Store login timestamp in localStorage
              localStorage.setItem('lastLoginTime', Date.now().toString());
              
              // Redirect to admin panel
              window.location.href = 'admin.html';
            } else {
              console.error('Usuário não autorizado:', user.uid);
              auth.signOut(); // Sign out unauthorized user
              
              if (loginError) {
                loginError.textContent = 'Você não tem permissão para acessar o painel de administração.';
                loginError.style.display = 'block';
              }
              
              // Re-enable login button
              if (loginButton) {
                loginButton.disabled = false;
                loginButton.innerHTML = '<i class="fas fa-sign-in-alt me-2"></i>Entrar';
              }
            }
          })
          .catch(function(error) {
            console.error('Erro de autenticação:', error);
            
            // Show appropriate error message
            if (loginError) {
              switch (error.code) {
                case 'auth/user-not-found':
                  loginError.textContent = 'Usuário não encontrado.';
                  break;
                case 'auth/wrong-password':
                  loginError.textContent = 'Senha incorreta.';
                  break;
                case 'auth/invalid-email':
                  loginError.textContent = 'Email inválido.';
                  break;
                case 'auth/too-many-requests':
                  loginError.textContent = 'Muitas tentativas de login. Tente novamente mais tarde.';
                  break;
                default:
                  loginError.textContent = 'Erro ao fazer login. Por favor, tente novamente.';
              }
              loginError.style.display = 'block';
            }
            
            // Re-enable login button
            if (loginButton) {
              loginButton.disabled = false;
              loginButton.innerHTML = '<i class="fas fa-sign-in-alt me-2"></i>Entrar';
            }
          });
      });
    }
    
    // Add logout functionality to any logout buttons on the page
    const logoutButtons = document.querySelectorAll('.logout-btn, #logout-button');
    logoutButtons.forEach(button => {
      if (button) {
        button.addEventListener('click', function() {
          auth.signOut()
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
    });
    
    // Check authentication state on admin pages
    const isAdminPage = window.location.pathname.includes('admin.html');
    if (isAdminPage) {
      auth.onAuthStateChanged(function(user) {
        if (!user) {
          // Not logged in, redirect to login page
          window.location.href = 'login.html';
          return;
        }
        
        // Check if the user has the correct UID
        if (user.uid !== '6MWhhenutOTp1GuiJFlyu6S16VO2') {
          console.error('Usuário não autorizado tentando acessar o painel admin:', user.uid);
          
          // Sign out unauthorized user and redirect to login
          auth.signOut().then(function() {
            localStorage.removeItem('lastLoginTime');
            window.location.href = 'login.html';
          });
          return;
        }
        
        // Check session timeout
        const lastLoginTime = localStorage.getItem('lastLoginTime');
        if (!lastLoginTime) {
          // No login timestamp, redirect to login
          window.location.href = 'login.html';
          return;
        }
        
        const currentTime = Date.now();
        const sessionAge = (currentTime - parseInt(lastLoginTime)) / (1000 * 60 * 60); // in hours
        
        if (sessionAge > 1) { // 1 hour session timeout
          // Session expired, redirect to login
          console.log('Sessão expirada após', Math.round(sessionAge * 60), 'minutos');
          auth.signOut().then(function() {
            localStorage.removeItem('lastLoginTime');
            window.location.href = 'login.html';
          });
          return;
        }
        
        // Update login timestamp to extend session
        localStorage.setItem('lastLoginTime', currentTime.toString());
        
        console.log('Usuário autenticado como administrador');
      });
    }
  });
  