/**
 * Script para exibir informações do usuário logado - VERSÃO CORRIGIDA
 */

console.log('🔧 Script user-display.js carregado');

document.addEventListener('DOMContentLoaded', async () => {
    console.log('🔍 Iniciando exibição de informações do usuário...');
    
    // Aguardar Firebase estar pronto e usuário autenticado
    await waitForFirebaseAuth();
    
    // Tentar exibir informações do usuário
    await displayUserInfo();
});

/**
 * Aguardar Firebase Auth estar pronto
 */
function waitForFirebaseAuth() {
    return new Promise((resolve) => {
        let attempts = 0;
        const maxAttempts = 30;
        
        const checkAuth = () => {
            attempts++;
            console.log(`🔍 Verificando Firebase Auth (tentativa ${attempts}/${maxAttempts})`);
            
            if (typeof firebase !== 'undefined' && firebase.auth) {
                // Aguardar estado de autenticação
                firebase.auth().onAuthStateChanged((user) => {
                    if (user) {
                        console.log('✅ Usuário Firebase encontrado:', user.email);
                        resolve();
                    } else if (attempts >= maxAttempts) {
                        console.warn('⚠️ Timeout aguardando autenticação');
                        resolve();
                    } else {
                        setTimeout(checkAuth, 500);
                    }
                });
            } else if (attempts >= maxAttempts) {
                console.warn('⚠️ Firebase não encontrado após várias tentativas');
                resolve();
            } else {
                setTimeout(checkAuth, 500);
            }
        };
        
        checkAuth();
    });
}

/**
 * Função principal para exibir informações do usuário
 */
async function displayUserInfo() {
    console.log('🚀 Iniciando displayUserInfo...');
    
    const userInfoDisplay = document.getElementById('user-info-display');
    const userLoadingDisplay = document.getElementById('user-loading-display');
    const userDisplayName = document.getElementById('user-display-name');
    const userDisplayEmail = document.getElementById('user-display-email');
    const logoutBtn = document.getElementById('logout-btn');
    
    if (!userInfoDisplay || !userLoadingDisplay) {
        console.error('❌ Elementos principais não encontrados');
        return;
    }
    
    try {
        console.log('📱 Mostrando loading...');
        // Mostrar loading
        userLoadingDisplay.style.display = 'block';
        userInfoDisplay.style.display = 'none';
        
        console.log('🔍 Tentando capturar informações do usuário...');
        // Tentar capturar informações do usuário
        const userInfo = await getUserInfo();
        
        console.log('📋 Informações capturadas:', userInfo);
        
        if (userInfo && (userInfo.name || userInfo.email)) {
            console.log('✅ Atualizando interface com:', userInfo);
            
            // Atualizar interface
            if (userDisplayName) {
                userDisplayName.textContent = userInfo.name || 'Usuário';
                console.log('✅ Nome atualizado:', userInfo.name);
            }
            if (userDisplayEmail) {
                userDisplayEmail.textContent = userInfo.email || '';
                console.log('✅ Email atualizado:', userInfo.email);
            }
            
            // Mostrar informações do usuário
            userLoadingDisplay.style.display = 'none';
            userInfoDisplay.style.display = 'block';
            
            console.log('✅ Interface atualizada com sucesso');
            
        } else {
            console.warn('⚠️ Nenhuma informação válida encontrada');
            showUserError('Usuário não identificado');
        }
        
    } catch (error) {
        console.error('❌ Erro ao exibir informações do usuário:', error);
        showUserError('Erro ao carregar informações');
    }
    
    // Configurar botão de logout
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
        console.log('✅ Botão de logout configurado');
    }
}

/**
 * Capturar informações do usuário - VERSÃO CORRIGIDA
 */
async function getUserInfo() {
    console.log('🔍 Iniciando captura de informações do usuário...');
    
    // Método 1: Firebase Auth - VERSÃO MELHORADA
    console.log('🔍 Tentando Firebase Auth...');
    if (typeof firebase !== 'undefined' && firebase.auth) {
        console.log('✅ Firebase disponível, verificando usuário atual...');
        
        try {
            // Aguardar estado de autenticação de forma síncrona
            const currentUser = firebase.auth().currentUser;
            
            if (currentUser && currentUser.email) {
                console.log('✅ Usuário Firebase encontrado:', {
                    email: currentUser.email,
                    displayName: currentUser.displayName,
                    uid: currentUser.uid
                });
                
                // Extrair nome do email se não tiver displayName
                let userName = currentUser.displayName;
                if (!userName && currentUser.email) {
                    userName = currentUser.email.split('@')[0];
                    // Capitalizar primeira letra
                    userName = userName.charAt(0).toUpperCase() + userName.slice(1);
                }
                
                return {
                    name: userName || 'Usuário',
                    email: currentUser.email,
                    source: 'Firebase Auth'
                };
            } else {
                console.log('⚠️ Nenhum usuário logado no Firebase no momento');
                
                // Tentar aguardar um pouco mais
                return new Promise((resolve) => {
                    const unsubscribe = firebase.auth().onAuthStateChanged((user) => {
                        unsubscribe();
                        if (user && user.email) {
                            let userName = user.displayName;
                            if (!userName && user.email) {
                                userName = user.email.split('@')[0];
                                userName = userName.charAt(0).toUpperCase() + userName.slice(1);
                            }
                            
                            resolve({
                                name: userName || 'Usuário',
                                email: user.email,
                                source: 'Firebase Auth (async)'
                            });
                        } else {
                            resolve(null);
                        }
                    });
                    
                    // Timeout após 3 segundos
                    setTimeout(() => {
                        unsubscribe();
                        resolve(null);
                    }, 3000);
                });
            }
        } catch (error) {
            console.error('Erro ao acessar Firebase Auth:', error);
        }
    } else {
        console.log('⚠️ Firebase não disponível');
    }
    
    // Método 2: Intranet (procurar por texto na página)
    console.log('🔍 Tentando captura via Intranet...');
    const bodyText = document.body.innerText || document.body.textContent;
    const loginMatch = bodyText.match(/Você está logado\(a\) como\s+(\w+)/i);
    
    if (loginMatch && loginMatch[1]) {
        const username = loginMatch[1];
        console.log('✅ Usuário da intranet encontrado:', username);
        
        return {
            name: username.charAt(0).toUpperCase() + username.slice(1),
            email: `${username}@pge.sc.gov.br`,
            source: 'Intranet PGE-SC'
        };
    } else {
        console.log('⚠️ Padrão de intranet não encontrado');
    }
    
    // Método 3: LocalStorage
    console.log('🔍 Tentando LocalStorage...');
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
        try {
            const userData = JSON.parse(storedUser);
            console.log('📦 Dados do localStorage:', userData);
            
            if (userData.userName || userData.userEmail) {
                return {
                    name: userData.userName || 'Usuário',
                    email: userData.userEmail || '',
                    source: 'Dados armazenados'
                };
            }
        } catch (e) {
            console.warn('⚠️ Erro ao ler dados armazenados:', e);
        }
    } else {
        console.log('⚠️ Nenhum dado no localStorage');
    }
    
    // Método 4: Fallback
    console.log('🔄 Usando fallback...');
    return {
        name: 'Usuário PGE-SC',
        email: 'usuario@pge.sc.gov.br',
        source: 'Padrão'
    };
}

/**
 * Mostrar erro nas informações do usuário
 */
function showUserError(message) {
    console.log('❌ Mostrando erro:', message);
    
    const userLoadingDisplay = document.getElementById('user-loading-display');
    const userInfoDisplay = document.getElementById('user-info-display');
    
    if (userLoadingDisplay) {
        userLoadingDisplay.style.display = 'none';
    }
    
    if (userInfoDisplay) {
        userInfoDisplay.innerHTML = `
            <div class="alert alert-warning alert-sm mb-0" role="alert">
                <i class="fas fa-exclamation-triangle me-1"></i>
                ${message}
            </div>
        `;
        userInfoDisplay.style.display = 'block';
    }
}

/**
 * Lidar com logout
 */
async function handleLogout() {
    console.log('🚪 Iniciando logout...');
    
    const confirmLogout = confirm('Tem certeza que deseja sair?');
    if (!confirmLogout) return;
    
    try {
        // Logout do Firebase se disponível
        if (typeof firebase !== 'undefined' && firebase.auth) {
            await firebase.auth().signOut();
            console.log('✅ Logout do Firebase realizado');
        }
        
        // Limpar dados locais
        localStorage.removeItem('currentUser');
        localStorage.removeItem('lastLoginTime');
        sessionStorage.clear();
        console.log('✅ Dados locais limpos');
        
        // Redirecionar
        window.location.href = 'login.html';
        
    } catch (error) {
        console.error('❌ Erro ao fazer logout:', error);
        alert('Erro ao sair. Tente novamente.');
    }
}
