// Verificação imediata de autenticação (fora do DOMContentLoaded)
(function() {
    console.log('Verificação de autenticação iniciada');
    
    // Função para verificar autenticação
    function checkAuthentication() {
        // Verificar se o Firebase está inicializado
        if (typeof firebase === 'undefined' || !firebase.auth) {
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
    }
    
    // Aguardar o Firebase estar completamente carregado
    function waitForFirebase() {
        if (typeof firebase !== 'undefined' && firebase.auth && firebase.firestore) {
            checkAuthentication();
        } else {
            console.log('Aguardando Firebase carregar...');
            setTimeout(waitForFirebase, 100);
        }
    }
    
    // Iniciar verificação quando o DOM estiver pronto
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', waitForFirebase);
    } else {
        waitForFirebase();
    }
})();

// Evento DOMContentLoaded para elementos da UI
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM carregado para verificação de autenticação');
    
    // Variável para controlar throttling de atualizações
    let lastUpdateTime = 0;
    const UPDATE_THROTTLE = 30000; // Atualizar no máximo a cada 30 segundos
    
    // Aguardar Firebase estar disponível antes de configurar UI
    function setupUI() {
        if (typeof firebase === 'undefined' || !firebase.auth) {
            setTimeout(setupUI, 100);
            return;
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
        
        // Função para atualizar timestamp com throttling
        function updateTimestampThrottled() {
            const currentTime = Date.now();
            
            // Só atualizar se passou tempo suficiente desde a última atualização
            if (currentTime - lastUpdateTime < UPDATE_THROTTLE) {
                return;
            }
            
            const lastLoginTime = localStorage.getItem('lastLoginTime');
            if (lastLoginTime) {
                const sessionAge = (currentTime - parseInt(lastLoginTime)) / (1000 * 60);
                
                if (sessionAge <= 3) {
                    // Só atualiza se a sessão ainda for válida
                    localStorage.setItem('lastLoginTime', currentTime.toString());
                    lastUpdateTime = currentTime;
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
        }
        
        // Atualizar timestamp com eventos mais específicos e throttling
        // Removendo mousemove para evitar atualizações excessivas
        ['click', 'keypress', 'scroll', 'touchstart'].forEach(function(event) {
            document.addEventListener(event, updateTimestampThrottled, { passive: true });
        });
        
        // Para mousemove, usar um throttling mais agressivo
        let mouseMoveTimeout;
        document.addEventListener('mousemove', function() {
            clearTimeout(mouseMoveTimeout);
            mouseMoveTimeout = setTimeout(updateTimestampThrottled, 5000); // Só após 5 segundos de movimento
        }, { passive: true });
    }
    
    setupUI();
});
