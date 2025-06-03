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
    
    // Adicionar funcionalidade de mostrar/ocultar senha
    setupPasswordToggle();
    
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

    // Função para configurar o toggle de mostrar/ocultar senha
    function setupPasswordToggle() {
        const passwordInput = document.getElementById('login-password');
        
        if (!passwordInput) {
            console.warn('Campo de senha não encontrado');
            return;
        }

        // Verificar se já existe um toggle
        if (passwordInput.parentElement.querySelector('.password-toggle')) {
            return;
        }

        // Criar container para o input e botão
        const passwordContainer = passwordInput.parentElement;
        passwordContainer.style.position = 'relative';

        // Criar botão de toggle
        const toggleButton = document.createElement('button');
        toggleButton.type = 'button';
        toggleButton.className = 'password-toggle';
        toggleButton.innerHTML = '<i class="fas fa-eye"></i>';
        
        // Estilos do botão
        toggleButton.style.cssText = `
            position: absolute;
            right: 15px;
            top: 50%;
            transform: translateY(-50%);
            background: none;
            border: none;
            color: #6c757d;
            cursor: pointer;
            padding: 8px;
            border-radius: 6px;
            transition: all 0.3s ease;
            z-index: 10;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 35px;
            height: 35px;
        `;

        // Adicionar estilos CSS para hover e estados
        if (!document.querySelector('#password-toggle-styles')) {
            const styles = document.createElement('style');
            styles.id = 'password-toggle-styles';
            styles.textContent = `
                .password-toggle:hover {
                    background-color: rgba(0, 102, 204, 0.1) !important;
                    color: #0066cc !important;
                    transform: translateY(-50%) scale(1.1) !important;
                }
                
                .password-toggle:active {
                    transform: translateY(-50%) scale(0.95) !important;
                }
                
                .password-toggle.active {
                    color: #0066cc !important;
                    background-color: rgba(0, 102, 204, 0.1) !important;
                }
                
                .password-toggle i {
                    font-size: 16px;
                    transition: all 0.2s ease;
                }
                
                /* Ajustar padding do input para dar espaço ao botão */
                #login-password {
                    padding-right: 50px !important;
                }
                
                /* Animação de transição do ícone */
                .password-toggle.active i {
                    transform: scale(1.1);
                }
            `;
            document.head.appendChild(styles);
        }

        // Adicionar o botão ao container
        passwordContainer.appendChild(toggleButton);

        // Variável para controlar o estado
        let isPasswordVisible = false;

        // Event listener para o botão
        toggleButton.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            isPasswordVisible = !isPasswordVisible;
            
            if (isPasswordVisible) {
                // Mostrar senha
                passwordInput.type = 'text';
                toggleButton.innerHTML = '<i class="fas fa-eye-slash"></i>';
                toggleButton.classList.add('active');
                toggleButton.title = 'Ocultar senha';
                
                // Efeito visual de confirmação
                toggleButton.style.transform = 'translateY(-50%) scale(1.2)';
                setTimeout(() => {
                    toggleButton.style.transform = 'translateY(-50%) scale(1)';
                }, 150);
                
            } else {
                // Ocultar senha
                passwordInput.type = 'password';
                toggleButton.innerHTML = '<i class="fas fa-eye"></i>';
                toggleButton.classList.remove('active');
                toggleButton.title = 'Mostrar senha';
                
                // Efeito visual de confirmação
                toggleButton.style.transform = 'translateY(-50%) scale(1.2)';
                setTimeout(() => {
                    toggleButton.style.transform = 'translateY(-50%) scale(1)';
                }, 150);
            }
            
            // Manter o foco no input
            passwordInput.focus();
            
            console.log('Senha', isPasswordVisible ? 'visível' : 'oculta');
        });

        // Adicionar tooltip inicial
toggleButton.title = 'Mostrar senha';

// Criar indicador de Caps Lock
const capsLockIndicator = document.createElement('div');
capsLockIndicator.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Caps Lock ativado';
capsLockIndicator.style.cssText = `
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: #dc3545;
    color: white;
    padding: 8px 12px;
    border-radius: 0 0 8px 8px;
    font-size: 12px;
    font-weight: 600;
    display: none;
    z-index: 15;
`;

passwordContainer.appendChild(capsLockIndicator);

// Detectar Caps Lock
passwordInput.addEventListener('keyup', function(event) {
    const isCapsLock = event.getModifierState('CapsLock');
    capsLockIndicator.style.display = isCapsLock ? 'block' : 'none';
});

// Event listener para quando o input recebe foco
passwordInput.addEventListener('focus', function() {
    toggleButton.style.opacity = '1';
});


        // Event listener para quando o input perde foco
        passwordInput.addEventListener('blur', function() {
            // Pequeno delay para permitir clique no botão
            setTimeout(() => {
                if (document.activeElement !== toggleButton) {
                    toggleButton.style.opacity = '0.7';
                }
            }, 100);
        });

        // Atalho de teclado (Ctrl + Shift + H) para toggle
        passwordInput.addEventListener('keydown', function(e) {
            if (e.ctrlKey && e.shiftKey && e.key === 'H') {
                e.preventDefault();
                toggleButton.click();
            }
        });

        console.log('✅ Toggle de senha configurado com sucesso!');
    }
});
