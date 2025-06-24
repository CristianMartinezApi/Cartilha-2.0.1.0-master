/**
 * ✅ VERIFICAÇÃO DE AUTENTICAÇÃO SEM TIMEOUT
 * Versão permanente - sessão nunca expira automaticamente
 */

console.log('🔒 Sistema de verificação PERMANENTE carregado');

(function() {
    console.log('🚀 Verificação de autenticação PERMANENTE iniciada');
    
    function checkAuthentication() {
        console.log('🔍 Verificando autenticação (modo permanente)...');
        
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
            
            // Verificar se o usuário é um administrador
            firebase.firestore().collection('admins').doc(user.uid).get()
                .then(function(doc) {
                    if (doc.exists) {
                        console.log('✅ Usuário é admin - SESSÃO PERMANENTE ATIVA');
                        
                        // ✅ REMOVER COMPLETAMENTE A VERIFICAÇÃO DE TIMEOUT
                        // ✅ NÃO VERIFICAR lastLoginTime
                        // ✅ NÃO VERIFICAR sessionAge
                        // ✅ NÃO FAZER LOGOUT AUTOMÁTICO
                        
                        console.log('🔒 Sessão permanente estabelecida para:', user.email);
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

// ✅ EVENTO DOMContentLoaded SEM VERIFICAÇÕES DE TIMEOUT
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 DOM carregado - configurando UI permanente');
    
    function setupUI() {
        if (typeof firebase === 'undefined' || !firebase.auth) {
            setTimeout(setupUI, 100);
            return;
        }
        
        console.log('🔒 Configurando interface para sessão permanente...');
        
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
                    console.log('📊 Sessão ativa há:', Math.round(sessionAge), 'minutos (sem timeout)');
                } else {
                    console.log('📊 Sessão ativa (sem timestamp)');
                }
            }
        }, 5 * 60 * 1000); // Log a cada 5 minutos apenas para informação
        
        // ✅ ATUALIZAR TIMESTAMP APENAS PARA REFERÊNCIA (não para verificação)
        function updateTimestampForReference() {
            const user = firebase.auth().currentUser;
            if (user) {
                const currentTime = Date.now();
                localStorage.setItem('lastLoginTime', currentTime.toString());
                console.log('📝 Timestamp atualizado (referência):', new Date(currentTime).toLocaleTimeString());
            }
        }
        
        // ✅ EVENTOS DE INTERAÇÃO (apenas para atualizar referência, não para verificar timeout)
        ['click', 'keypress', 'scroll', 'touchstart'].forEach(function(event) {
            document.addEventListener(event, updateTimestampForReference, { passive: true });
        });
        
        console.log('✅ Interface configurada para sessão permanente');
    }
    
    setupUI();
});

/**
 * ✅ FUNÇÃO DE DEBUG GLOBAL
 */
window.debugAuthCheck = function() {
    console.log('🔍 DEBUG AUTH-CHECK:');
    console.log('- Firebase disponível:', typeof firebase !== 'undefined');
    console.log('- Usuário atual:', firebase.auth().currentUser?.email || 'Nenhum');
    console.log('- LastLoginTime:', localStorage.getItem('lastLoginTime'));
    console.log('- Sessão permanente:', 'SIM - sem timeout');
    
    const lastLoginTime = localStorage.getItem('lastLoginTime');
    if (lastLoginTime) {
        const sessionAge = (Date.now() - parseInt(lastLoginTime)) / (1000 * 60);
        console.log('- Idade da sessão:', Math.round(sessionAge), 'minutos (informativo apenas)');
    }
};

/**
 * ✅ FUNÇÃO PARA LOGOUT MANUAL
 */
window.forceLogoutAdmin = function() {
    console.log('🚪 Forçando logout manual...');
    localStorage.removeItem('lastLoginTime');
    firebase.auth().signOut().then(function() {
        window.location.href = 'login.html';
    }).catch(function() {
        window.location.href = 'login.html';
    });
};

console.log('🔒 auth-check.js carregado - MODO PERMANENTE');
console.log('🎯 Use window.debugAuthCheck() para debug');
console.log('🚪 Use window.forceLogoutAdmin() para logout manual');
