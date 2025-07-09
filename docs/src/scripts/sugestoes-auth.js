
const SugestoesAuth = {
    config: {
        sessionTimeout: Infinity, // ✅ NUNCA EXPIRA
        allowedDomains: ['pge.sc.gov.br'],
        redirectAfterLogin: null,
        redirectAfterLogout: null
    },

    /**
     * ✅ Detectar ambiente automaticamente
     */
    detectEnvironment() {
        const pathname = window.location.pathname;
        const hostname = window.location.hostname;
        
        console.log('🔍 Detectando ambiente:', { pathname, hostname });
        
        if (pathname.includes('/Cartilha-2.0.1.0-master/')) {
            this.config.redirectAfterLogin = '/Cartilha-2.0.1.0-master/sugestoes.html';
            this.config.redirectAfterLogout = '/Cartilha-2.0.1.0-master/sugestoes-login.html';
            console.log('🌐 Ambiente: GitHub Pages');
        } else if (hostname === 'localhost' || hostname === '127.0.0.1') {
            this.config.redirectAfterLogin = '/docs/sugestoes.html';
            this.config.redirectAfterLogout = '/docs/sugestoes-login.html';
            console.log('🏠 Ambiente: Live Server');
        } else {
            this.config.redirectAfterLogin = './sugestoes.html';
            this.config.redirectAfterLogout = './sugestoes-login.html';
            console.log('🌍 Ambiente: Outros');
        }
        
        console.log('✅ URLs configuradas:', {
            login: this.config.redirectAfterLogin,
            logout: this.config.redirectAfterLogout
        });
    },

    /**
     * ✅ Verificar autenticação APENAS POR DOMÍNIO - SEM VERIFICAÇÃO DE ADMIN
     */
    async checkAuthentication() {
        try {
            console.log('🔍 Verificando autenticação para USUÁRIOS GERAIS (sem admin)...');
            
            if (typeof firebase === 'undefined' || !firebase.auth) {
                throw new Error('Firebase não está inicializado');
            }

            return new Promise((resolve, reject) => {
                const unsubscribe = firebase.auth().onAuthStateChanged(async (user) => {
                    unsubscribe();
                    
                    if (!user) {
                        console.log('❌ Usuário não autenticado');
                        resolve({
                            isAuthenticated: false,
                            user: null,
                            profile: null,
                            reason: 'not_logged_in'
                        });
                        return;
                    }

                    console.log('👤 USUÁRIO DETECTADO:');
                    console.log('📧 Email:', user.email);
                    console.log('🆔 UID:', user.uid);
                    console.log('👤 DisplayName:', user.displayName);

                    try {
                        // ✅ VERIFICAR APENAS DOMÍNIO (sem admin)
                        const email = user.email;
                        const domain = email.split('@')[1];
                        
                        console.log('🔍 VERIFICAÇÃO DE DOMÍNIO:');
                        console.log('- Email completo:', email);
                        console.log('- Domínio extraído:', domain);
                        console.log('- Domínios permitidos:', this.config.allowedDomains);
                        console.log('- Domínio válido?', this.config.allowedDomains.includes(domain));

                        if (!this.config.allowedDomains.includes(domain)) {
                            console.log('❌ Domínio não autorizado:', email);
                            await firebase.auth().signOut();
                            resolve({
                                isAuthenticated: false,
                                user: null,
                                profile: null,
                                reason: 'domain_not_allowed'
                            });
                            return;
                        }

                        // ✅ USUÁRIO AUTORIZADO (qualquer @pge.sc.gov.br)
                        console.log('✅ Usuário autorizado (domínio válido):', email);
                        
                        const profile = await this.getUserProfile(user);
                        
                        console.log('📊 PERFIL GERADO:');
                        console.log('- isAuthorized:', profile.isAuthorized);
                        console.log('- role:', profile.role);
                        console.log('- permissions:', profile.permissions);

                        if (!profile.isAuthorized) {
                            console.log('❌ Perfil não autorizado:', profile.reason);
                            resolve({
                                isAuthenticated: false,
                                user: null,
                                profile: null,
                                reason: profile.reason
                            });
                            return;
                        }

                        console.log('✅ AUTENTICAÇÃO COMPLETA - SESSÃO PERMANENTE ATIVA');
                        resolve({
                            isAuthenticated: true,
                            user: user,
                            profile: profile,
                            reason: 'authenticated_domain'
                        });

                    } catch (error) {
                        console.error('❌ Erro ao verificar perfil:', error);
                        resolve({
                            isAuthenticated: false,
                            user: null,
                            profile: null,
                            reason: 'profile_error'
                        });
                    }
                });
            });

        } catch (error) {
            console.error('❌ Erro na verificação de autenticação:', error);
            return {
                isAuthenticated: false,
                user: null,
                profile: null,
                reason: 'auth_error'
            };
        }
    },

    /**
     * ✅ Obter perfil do usuário - SEM VERIFICAÇÃO DE ADMIN
     */
    async getUserProfile(user) {
        try {
            console.log('🔍 GERANDO PERFIL DO USUÁRIO (sem verificação de admin)...');
            
            const email = user.email;
            const domain = email.split('@')[1];
            
            console.log('📧 Email:', email);
            console.log('🌍 Domínio:', domain);

            // ✅ VERIFICAR APENAS DOMÍNIO
            const isAuthorized = this.config.allowedDomains.includes(domain);
            console.log('✅ Domínio autorizado?', isAuthorized);

            if (!isAuthorized) {
                console.log('❌ DOMÍNIO NÃO AUTORIZADO');
                return {
                    isAuthorized: false,
                    reason: 'domain_not_allowed'
                };
            }

            // ✅ BUSCAR DADOS ADICIONAIS DO USUÁRIO (opcional)
            let additionalData = {};
            try {
                console.log('🔍 Buscando dados adicionais...');
                const userDoc = await window.db
                    .collection('sugestoes_users')
                    .doc(user.uid)
                    .get();
                
                if (userDoc.exists) {
                    additionalData = userDoc.data();
                    console.log('📊 Dados adicionais encontrados:', additionalData);
                } else {
                    console.log('ℹ️ Nenhum dado adicional encontrado');
                }
            } catch (error) {
                console.log('ℹ️ Erro ao buscar dados adicionais:', error.message);
            }

            // ✅ DETECTAR PROVEDOR
            let authProvider = 'unknown';
            if (user.providerData && user.providerData.length > 0) {
                const providerId = user.providerData[0].providerId;
                switch (providerId) {
                    case 'google.com': authProvider = 'google'; break;
                    case 'microsoft.com': authProvider = 'microsoft'; break;
                    case 'password': authProvider = 'email'; break;
                    default: authProvider = providerId;
                }
            }

            // ✅ PERFIL FINAL - TODOS SÃO USUÁRIOS NORMAIS
            const finalProfile = {
                isAuthorized: true,
                uid: user.uid,
                email: email,
                displayName: user.displayName || additionalData.displayName || email.split('@')[0],
                photoURL: user.photoURL || additionalData.photoURL || null,
                domain: domain,
                department: additionalData.department || 'PGE-SC',
                role: 'user', // ✅ SEMPRE USER (não verificamos admin)
                permissions: ['comment', 'suggest', 'like', 'rate'], // ✅ PERMISSÕES BÁSICAS
                isInstitutional: true,
                lastLogin: new Date().toISOString(),
                authProvider: authProvider,
                sessionType: 'permanent'
            };

            console.log('✅ PERFIL FINAL GERADO:');
            console.log('- isAuthorized:', finalProfile.isAuthorized);
            console.log('- role:', finalProfile.role);
            console.log('- permissions:', finalProfile.permissions);
            console.log('- displayName:', finalProfile.displayName);

            return finalProfile;

        } catch (error) {
            console.error('❌ ERRO CRÍTICO ao obter perfil:', error);
            return {
                isAuthorized: false,
                reason: 'profile_error'
            };
        }
    },

    /**
     * ✅ Login com Google
     */
    async loginWithGoogle() {
        try {
            console.log('🔍 Iniciando login com Google...');
            
            const provider = new firebase.auth.GoogleAuthProvider();
            provider.addScope('email');
            provider.addScope('profile');
            provider.setCustomParameters({
                prompt: 'select_account',
                hd: 'pge.sc.gov.br'
            });

            const result = await firebase.auth().signInWithPopup(provider);
            const user = result.user;
            
            console.log('✅ Login com Google realizado:', user.email);

            if (!user.email.includes('@pge.sc.gov.br')) {
                await firebase.auth().signOut();
                throw new Error('Por favor, use sua conta institucional @pge.sc.gov.br');
            }

            await this.saveUserData(user);
            console.log('🔒 Sessão permanente estabelecida');

            return {
                success: true,
                user: user,
                message: 'Login realizado com sucesso! Sessão permanente ativa.'
            };

        } catch (error) {
            console.error('❌ Erro no login com Google:', error);
            
            let message = 'Erro no login com Google';
            if (error.code === 'auth/popup-closed-by-user') {
                message = 'Login cancelado pelo usuário';
            } else if (error.code === 'auth/popup-blocked') {
                message = 'Pop-up bloqueado. Permita pop-ups para este site';
            } else if (error.message.includes('institucional')) {
                message = error.message;
            }

            return {
                success: false,
                error: error,
                message: message
            };
        }
    },

    /**
     * ✅ Login com Microsoft
     */
    async loginWithMicrosoft() {
        try {
            console.log('🔍 Iniciando login com Microsoft...');
            
            const provider = new firebase.auth.OAuthProvider('microsoft.com');
            provider.addScope('email');
            provider.addScope('profile');
            provider.setCustomParameters({
                prompt: 'select_account',
                tenant: 'pge.sc.gov.br'
            });

            const result = await firebase.auth().signInWithPopup(provider);
            const user = result.user;
            
            console.log('✅ Login com Microsoft realizado:', user.email);

            if (!user.email.includes('@pge.sc.gov.br')) {
                await firebase.auth().signOut();
                throw new Error('Por favor, use sua conta institucional @pge.sc.gov.br');
            }

            await this.saveUserData(user);
            console.log('🔒 Sessão permanente estabelecida');

            return {
                success: true,
                user: user,
                message: 'Login realizado com sucesso! Sessão permanente ativa.'
            };

        } catch (error) {
            console.error('❌ Erro no login com Microsoft:', error);
            
            let message = 'Erro no login com Microsoft';
            if (error.code === 'auth/popup-closed-by-user') {
                message = 'Login cancelado pelo usuário';
            } else if (error.code === 'auth/popup-blocked') {
                message = 'Pop-up bloqueado. Permita pop-ups para este site';
            } else if (error.message.includes('institucional')) {
                message = error.message;
            }

            return {
                success: false,
                error: error,
                message: message
            };
        }
    },

    /**
     * ✅ Salvar dados do usuário
     */
    async saveUserData(user) {
        try {
            console.log('💾 Salvando dados do usuário...');
            
            const userData = {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                photoURL: user.photoURL,
                domain: user.email.split('@')[1],
                department: 'PGE-SC',
                role: 'user', // ✅ SEMPRE USER
                permissions: ['comment', 'suggest', 'like', 'rate'], // ✅ PERMISSÕES BÁSICAS
                isInstitutional: true,
                lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                authProvider: user.providerData[0]?.providerId,
                isActive: true,
                sessionType: 'permanent'
            };

            await window.db
                .collection('sugestoes_users')
                .doc(user.uid)
                .set(userData, { merge: true });

            console.log('✅ Dados do usuário salvos (sessão permanente)');

        } catch (error) {
            console.error('⚠️ Erro ao salvar dados do usuário:', error);
        }
    },

    /**
     * ✅ Logout manual
     */
    async logout() {
        try {
            console.log('🚪 Realizando logout MANUAL...');
            await firebase.auth().signOut();
            
            // Limpar dados locais
            localStorage.clear();
            
            console.log('✅ Logout manual realizado com sucesso');
            window.location.href = this.config.redirectAfterLogout;
        } catch (error) {
            console.error('❌ Erro no logout:', error);
            window.location.href = this.config.redirectAfterLogout;
        }
    },

    /**
     * ✅ NUNCA EXPIRA - sempre retorna false
     */
    isSessionExpired() {
        console.log('🔒 Verificação de expiração: SESSÃO PERMANENTE (nunca expira)');
        return false; // ✅ NUNCA EXPIRA
    },

    /**
     * ✅ NÃO FAZ NADA - não precisamos mais de timestamp
     */
    updateSessionTimestamp() {
        console.log('🔒 Timestamp não necessário - sessão permanente');
        // ✅ NÃO SALVAR NADA
    },

    /**
     * ✅ Inicialização SEM VERIFICAÇÃO DE TIMEOUT
     */
    init() {
        console.log('🚀 Inicializando sistema de autenticação PERMANENTE (sem admin)...');
        this.detectEnvironment();

        // ✅ PERMITIR ACESSO LIVRE À PÁGINA DE LOGIN
        if (window.location.pathname.includes('sugestoes-login.html')) {
            console.log('📄 Página de login - acesso livre');
            return;
        }

        // ✅ VERIFICAR AUTENTICAÇÃO SEM TIMEOUT
        this.checkAuthentication().then(auth => {
            if (!auth.isAuthenticated) {
                console.log('📄 Usuário não autenticado, redirecionando...');
                console.log('📄 Motivo:', auth.reason);
                window.location.href = this.config.redirectAfterLogout;
            } else {
                console.log('✅ Usuário autenticado - SESSÃO PERMANENTE ATIVA');
                console.log('🔒 Tipo de sessão:', auth.profile?.sessionType || 'permanent');
                console.log('👤 Usuário:', auth.user?.email);
                console.log('🎭 Role:', auth.profile?.role);
            }
        }).catch(error => {
            console.error('❌ Erro na inicialização:', error);
        });
    }
};

/**
 * ✅ Sistema de inicialização
 */
function initSugestoesAuth() {
    console.log('📄 Inicializando SugestoesAuth (versão permanente sem admin)...');
    
    if (typeof firebase === 'undefined') {
        console.log('⏳ Firebase não carregado ainda...');
        return false;
    }
    
    if (!firebase.auth) {
        console.log('⏳ Firebase Auth não carregado ainda...');
        return false;
    }
    
    if (typeof window.db === 'undefined') {
        console.log('⏳ Firestore não carregado ainda...');
        return false;
    }

    console.log('✅ Firebase disponível, inicializando sessão permanente...');
    SugestoesAuth.init();
    return true;
}

/**
 * ✅ Inicialização com múltiplas tentativas
 */
document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOM carregado - iniciando sistema permanente (sem admin)...');
    
    if (initSugestoesAuth()) return;

    const delays = [500, 1000, 2000, 3000];
    delays.forEach((delay, index) => {
        setTimeout(() => {
            console.log(`📄 Tentativa ${index + 2} após ${delay}ms...`);
            if (initSugestoesAuth()) {
                console.log('✅ Sistema de autenticação permanente inicializado!');
            } else if (index === delays.length - 1) {
                console.error('❌ Falha na inicialização após múltiplas tentativas');
                console.error('🔍 Diagnóstico:', {
                    firebase: typeof firebase,
                    auth: typeof firebase !== 'undefined' ? !!firebase.auth : 'N/A',
                    db: typeof window.db,
                    location: window.location.href
                });
            }
        }, delay);
    });
});

/**
 * ✅ EXPOR GLOBALMENTE PARA DEBUG
 */
if (typeof window !== 'undefined') {
    window.SugestoesAuth = SugestoesAuth;
    
    // ✅ Função de debug
    window.debugAuth = function() {
        console.log('🔍 DEBUG DO SISTEMA DE AUTENTICAÇÃO:');
        console.log('- Config:', SugestoesAuth.config);
        console.log('- Session Timeout:', SugestoesAuth.config.sessionTimeout);
        console.log('- Is Expired:', SugestoesAuth.isSessionExpired());
        console.log('- Current User:', firebase.auth().currentUser);
        console.log('- Local Storage:', {
            sessionTimestamp: localStorage.getItem('sessionTimestamp'),
            likedPrompts: localStorage.getItem('likedPrompts'),
            ratedPrompts: localStorage.getItem('ratedPrompts')
        });
        
        // ✅ TESTE COMPLETO
        if (firebase.auth().currentUser) {
            SugestoesAuth.checkAuthentication().then(result => {
                console.log('- Resultado da verificação:', result);
            });
        }
    };
    
    // ✅ Função para forçar logout
    window.forceLogout = function() {
        console.log('🚪 Forçando logout...');
        SugestoesAuth.logout();
    };
    
    console.log('🎯 Funções de debug disponíveis:');
    console.log('- window.debugAuth() - Ver status do sistema');
    console.log('- window.forceLogout() - Forçar logout');
}

/**
 * ✅ MONITORAMENTO CONTÍNUO (OPCIONAL)
 */
setInterval(() => {
    if (typeof firebase !== 'undefined' && firebase.auth) {
        const user = firebase.auth().currentUser;
        if (user) {
            console.log('🔒 Sessão permanente ativa para:', user.email);
        }
    }
}, 5 * 60 * 1000); // Log a cada 5 minutos para confirmar que está funcionando

/**
 * ✅ INTERCEPTAR TENTATIVAS DE LOGOUT AUTOMÁTICO
 */
setTimeout(() => {
    if (typeof firebase !== 'undefined' && firebase.auth) {
        const originalSignOut = firebase.auth().signOut;
        firebase.auth().signOut = function() {
            console.warn('🚨 TENTATIVA DE LOGOUT DETECTADA!');
            console.trace('Stack trace do logout:');
            
            // ✅ PERMITIR APENAS LOGOUT MANUAL
            const stack = new Error().stack;
            if (stack.includes('forceLogout') || stack.includes('logout')) {
                console.log('✅ Logout manual autorizado');
                return originalSignOut.call(this);
            } else {
                console.error('❌ LOGOUT AUTOMÁTICO BLOQUEADO!');
                console.log('🔒 Mantendo sessão ativa');
                return Promise.resolve(); // Não fazer logout
            }
        };
    }
}, 1000);

console.log('🔒 Sistema de autenticação permanente carregado (SEM VERIFICAÇÃO DE ADMIN)!');
console.log('⚠️ ATENÇÃO: Sessões nunca expiram automaticamente');
console.log('🚪 Use window.forceLogout() para sair manualmente');
console.log('✅ REMOVIDA: Verificação da coleção "admins" do Firebase');
