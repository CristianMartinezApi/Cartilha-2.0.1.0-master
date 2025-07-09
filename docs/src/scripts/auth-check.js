/**
 * ✅ VERIFICAÇÃO DE AUTENTICAÇÃO SEM TIMEOUT E SEM VERIFICAÇÃO DE ADMIN
 * Versão permanente - sessão nunca expira automaticamente
 * APENAS para páginas administrativas - NÃO afeta sugestões
 */

console.log('🔒 Sistema de verificação PERMANENTE carregado (APENAS ADMIN PAGES)');

(function() {
    console.log('🚀 Verificação de autenticação PERMANENTE iniciada (ADMIN ONLY)');
    
    // ✅ VERIFICAR SE ESTAMOS EM UMA PÁGINA ADMINISTRATIVA
    const isAdminPage = window.location.pathname.includes('admin.html') || 
                       window.location.pathname.includes('login.html');
    
    if (!isAdminPage) {
        console.log('📄 NÃO é página administrativa - auth-check.js não será executado');
        return; // ✅ SAIR IMEDIATAMENTE SE NÃO FOR PÁGINA ADMIN
    }
    
    console.log('📄 Página administrativa detectada - executando verificação de admin');
    
    function checkAuthentication() {
        console.log('🔍 Verificando autenticação (modo permanente ADMIN)...');
        
        // Verificar se o Firebase está inicializado
        if (typeof firebase === 'undefined' || !firebase.auth) {
            console.error('❌ Firebase não inicializado. Redirecionando...');
            window.location.href = 'login.html';
            return;
        }
      
        // Verificar estado de autenticação
        firebase.auth().onAuthStateChanged(function(user) {
            if (!user) {
                console.log('❌ Usuário não logado, redirecionando...');
                window.location.href = 'login.html';
                return;
            }
            
            console.log('✅ Usuário logado:', user.email);
            
            // ✅ VERIFICAR SE O USUÁRIO É UM ADMINISTRADOR (APENAS PARA PÁGINAS ADMIN)
            firebase.firestore().collection('admins').doc(user.uid).get()
                .then(function(doc) {
                    if (doc.exists) {
                        console.log('✅ Usuário é admin - SESSÃO PERMANENTE ATIVA (ADMIN PAGE)');
                        
                        // ✅ REMOVER COMPLETAMENTE A VERIFICAÇÃO DE TIMEOUT
                        // ✅ NÃO VERIFICAR lastLoginTime
                        // ✅ NÃO VERIFICAR sessionAge
                        // ✅ NÃO FAZER LOGOUT AUTOMÁTICO
                        
                        console.log('🔒 Sessão permanente estabelecida para admin:', user.email);
                        console.log('⏰ Timeout desabilitado - sessão nunca expira');
                        
                        // ✅ OPCIONAL: Salvar timestamp apenas para referência (não para verificação)
                        const currentTime = Date.now();
                        localStorage.setItem('lastLoginTime', currentTime.toString());
                        console.log('📝 Timestamp salvo para referência:', new Date(currentTime).toLocaleString());
                        
                    } else {
                        // Não é um administrador
                        console.error('❌ Usuário não é admin:', user.uid);
                        
                        localStorage.removeItem('lastLoginTime');
                        firebase.auth().signOut().then(function() {
                            window.location.href = 'login.html';
                        });
                        return;
                    }
                })
                .catch(function(error) {
                    console.error('❌ Erro ao verificar permissão de admin:', error);
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
            console.log('⏳ Aguardando Firebase carregar...');
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

// ✅ EVENTO DOMContentLoaded SEM VERIFICAÇÕES DE TIMEOUT (APENAS ADMIN PAGES)
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 DOM carregado - configurando UI permanente (ADMIN ONLY)');
    
    // ✅ VERIFICAR SE ESTAMOS EM UMA PÁGINA ADMINISTRATIVA
    const isAdminPage = window.location.pathname.includes('admin.html') || 
                       window.location.pathname.includes('login.html');
    
    if (!isAdminPage) {
        console.log('📄 NÃO é página administrativa - eventos não serão configurados');
        return; // ✅ SAIR IMEDIATAMENTE SE NÃO FOR PÁGINA ADMIN
    }
    
    function setupUI() {
        if (typeof firebase === 'undefined' || !firebase.auth) {
            setTimeout(setupUI, 100);
            return;
        }
        
        console.log('🔒 Configurando interface para sessão permanente ADMIN...');
        
        // ✅ REMOVER COMPLETAMENTE A VERIFICAÇÃO PERIÓDICA DE TIMEOUT
        // ✅ NÃO FAZER setInterval para verificar sessão
        // ✅ NÃO VERIFICAR sessionAge
        
        // ✅ OPCIONAL: Monitoramento apenas para log (sem ação)
        setInterval(function() {
            const user = firebase.auth().currentUser;
            if (user) {
                const lastLoginTime = localStorage.getItem('lastLoginTime');
                if (lastLoginTime) {
                    const sessionAge = (Date.now() - parseInt(lastLoginTime)) / (1000 * 60);
                    console.log('📊 Sessão ADMIN ativa há:', Math.round(sessionAge), 'minutos (sem timeout)');
                } else {
                    console.log('📊 Sessão ADMIN ativa (sem timestamp)');
                }
            }
        }, 5 * 60 * 1000); // Log a cada 5 minutos apenas para informação
        
        // ✅ ATUALIZAR TIMESTAMP APENAS PARA REFERÊNCIA (não para verificação)
        function updateTimestampForReference() {
            const user = firebase.auth().currentUser;
            if (user) {
                const currentTime = Date.now();
                localStorage.setItem('lastLoginTime', currentTime.toString());
                console.log('📝 Timestamp ADMIN atualizado (referência):', new Date(currentTime).toLocaleTimeString());
            }
        }
        
        // ✅ EVENTOS DE INTERAÇÃO (apenas para atualizar referência, não para verificar timeout)
        ['click', 'keypress', 'scroll', 'touchstart'].forEach(function(event) {
            document.addEventListener(event, updateTimestampForReference, { passive: true });
        });
        
        console.log('✅ Interface ADMIN configurada para sessão permanente');
    }
    
    setupUI();
});

/**
 * ✅ FUNÇÃO DE DEBUG GLOBAL (APENAS ADMIN)
 */
window.debugAuthCheck = function() {
    console.log('🔍 DEBUG AUTH-CHECK (ADMIN ONLY):');
    console.log('- Firebase disponível:', typeof firebase !== 'undefined');
    console.log('- Usuário atual:', firebase.auth().currentUser?.email || 'Nenhum');
    console.log('- LastLoginTime:', localStorage.getItem('lastLoginTime'));
    console.log('- Sessão permanente:', 'SIM - sem timeout (ADMIN)');
    console.log('- Página atual:', window.location.pathname);
    
    const lastLoginTime = localStorage.getItem('lastLoginTime');
    if (lastLoginTime) {
        const sessionAge = (Date.now() - parseInt(lastLoginTime)) / (1000 * 60);
        console.log('- Idade da sessão ADMIN:', Math.round(sessionAge), 'minutos (informativo apenas)');
    }
};

/**
 * ✅ FUNÇÃO PARA LOGOUT MANUAL (APENAS ADMIN)
 */
window.forceLogoutAdmin = function() {
    console.log('🚪 Forçando logout manual ADMIN...');
    localStorage.removeItem('lastLoginTime');
    firebase.auth().signOut().then(function() {
        window.location.href = 'login.html';
    }).catch(function() {
        window.location.href = 'login.html';
    });
};

console.log('🔒 auth-check.js carregado - MODO PERMANENTE (APENAS PÁGINAS ADMIN)');
console.log('🎯 Use window.debugAuthCheck() para debug');
console.log('🚪 Use window.forceLogoutAdmin() para logout manual');
console.log('📄 Este script SÓ funciona em páginas administrativas');
