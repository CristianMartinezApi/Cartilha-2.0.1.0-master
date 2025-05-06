/**
 * login.js - Gerencia autenticação para o painel administrativo
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('Script de login carregado');
    
    // Verificar se o Firebase está inicializado
    if (typeof firebase === 'undefined') {
      console.error('Firebase não está inicializado. Verifique se os scripts do Firebase foram carregados.');
      return;
    }
  
    // Inicializar Firebase Auth
    const auth = firebase.auth();
    
    // Obter elementos da UI
    const loginForm = document.getElementById('login-form');
    const emailInput = document.getElementById('login-email');
    const passwordInput = document.getElementById('login-password');
    const loginError = document.getElementById('login-error');
    const loginButton = document.getElementById('login-button');
    
    // Verificar se estamos na página de login
    if (loginForm) {
      console.log('Formulário de login encontrado, configurando autenticação');
      
      // Verificar se o usuário já está logado
      auth.onAuthStateChanged(function(user) {
        if (user) {
          console.log('Usuário já logado:', user.uid);
          
          // Verificar se o usuário é um administrador
          firebase.firestore().collection('admins').doc(user.uid).get()
            .then(function(doc) {
              if (doc.exists) {
                console.log('Usuário é admin, verificando validade da sessão');
                
                // Verificar se a sessão ainda é válida
                const lastLoginTime = localStorage.getItem('lastLoginTime');
                if (lastLoginTime) {
                  const currentTime = Date.now();
                  const sessionAge = (currentTime - parseInt(lastLoginTime)) / (1000 * 60); // em minutos
                  console.log('Idade da sessão:', Math.round(sessionAge), 'minutos');
                  
                  if (sessionAge <= 3) { // Sessão ainda válida
                    console.log('Sessão válida, redirecionando para painel admin');
                    // Atualizar timestamp de login
                    localStorage.setItem('lastLoginTime', currentTime.toString());
                    
                    // Redirecionar para painel admin
                    window.location.href = 'admin.html';
                    return;
                  } else {
                    console.log('Sessão expirada, necessário fazer login novamente');
                    // Sessão expirada, fazer logout
                    localStorage.removeItem('lastLoginTime');
                    auth.signOut();
                    // Não redirecionar, mostrar formulário de login
                  }
                } else {
                  console.log('Timestamp não encontrado, necessário fazer login novamente');
                  // Sem timestamp, fazer logout
                  auth.signOut();
                  // Não redirecionar, mostrar formulário de login
                }
              } else {
                // Não é um administrador, deslogar
                console.log('Usuário não é admin, deslogando');
                auth.signOut();
                
                // Mostrar mensagem de erro
                if (loginError) {
                  loginError.textContent = 'Você não tem permissão para acessar o painel de administração.';
                  loginError.style.display = 'block';
                }
              }
            })
            .catch(function(error) {
              console.error('Erro ao verificar permissão de admin:', error);
              auth.signOut();
              
              if (loginError) {
                loginError.textContent = 'Erro ao verificar permissões. Por favor, tente novamente.';
                loginError.style.display = 'block';
              }
            });
        } else {
          console.log('Nenhum usuário logado, mostrando formulário de login');
        }
      });
      
      // Tratar envio do formulário de login
      loginForm.addEventListener('submit', function(event) {
        event.preventDefault();
        console.log('Formulário de login enviado');
        
        // Limpar erros anteriores
        if (loginError) {
          loginError.textContent = '';
          loginError.style.display = 'none';
        }
        
        // Obter valores do formulário
        const email = emailInput.value.trim();
        const password = passwordInput.value;
        
        // Validar formulário
        if (!email || !password) {
          if (loginError) {
            loginError.textContent = 'Por favor, preencha todos os campos.';
            loginError.style.display = 'block';
          }
          return;
        }
        
        // Desabilitar botão de login e mostrar estado de carregamento
        if (loginButton) {
          const originalText = loginButton.innerHTML;
          loginButton.disabled = true;
          loginButton.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Entrando...';
        }
        
        console.log('Tentando fazer login com:', email);
        
        // Fazer login com email e senha
        auth.signInWithEmailAndPassword(email, password)
          .then(function(userCredential) {
            const user = userCredential.user;
            console.log('Usuário logado:', user.uid);
            
            // Verificar se o usuário é um administrador
            firebase.firestore().collection('admins').doc(user.uid).get()
              .then(function(doc) {
                if (doc.exists) {
                  console.log('Login bem-sucedido para o administrador');
                  
                  // Armazenar timestamp de login no localStorage
                  localStorage.setItem('lastLoginTime', Date.now().toString());
                  
                  // Redirecionar para painel admin
                  window.location.href = 'admin.html';
                } else {
                  console.error('Usuário não é admin:', user.uid);
                  auth.signOut(); // Deslogar usuário não autorizado
                  
                  if (loginError) {
                    loginError.textContent = 'Você não tem permissão para acessar o painel de administração.';
                    loginError.style.display = 'block';
                  }
                  
                  // Reabilitar botão de login
                  if (loginButton) {
                    loginButton.disabled = false;
                    loginButton.innerHTML = '<i class="fas fa-sign-in-alt me-2"></i>Entrar';
                  }
                }
              })
              .catch(function(error) {
                console.error('Erro ao verificar permissão de admin:', error);
                auth.signOut();
                
                if (loginError) {
                  loginError.textContent = 'Erro ao verificar permissões. Por favor, tente novamente.';
                  loginError.style.display = 'block';
                }
                
                // Reabilitar botão de login
                if (loginButton) {
                  loginButton.disabled = false;
                  loginButton.innerHTML = '<i class="fas fa-sign-in-alt me-2"></i>Entrar';
                }
              });
          })
          .catch(function(error) {
            console.error('Erro de autenticação:', error);
            
            // Mostrar mensagem de erro apropriada
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
            
            // Reabilitar botão de login
            if (loginButton) {
              loginButton.disabled = false;
              loginButton.innerHTML = '<i class="fas fa-sign-in-alt me-2"></i>Entrar';
            }
          });
      });
    }
  });
  