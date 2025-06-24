/**
 * Sistema de Autenticação para Área de Sugestões
 * Versão 2.0 - Integração com Firebase Auth
 */

const SugestoesAuth = {
    config: {
    sessionTimeout: 30 * 60 * 1000, // 30 minutos
    allowedDomains: ['pge.sc.gov.br'],
    redirectAfterLogin: null,    // Será definido automaticamente
    redirectAfterLogout: null    // Será definido automaticamente
},
/**
 * Detectar ambiente automaticamente
 */
detectEnvironment() {
    const pathname = window.location.pathname;
    const hostname = window.location.hostname;
    
    console.log('🔍 Detectando ambiente:', { pathname, hostname });
    
    if (pathname.includes('/Cartilha-2.0.1.0-master/')) {
        // GitHub Pages
        this.config.redirectAfterLogin = '/Cartilha-2.0.1.0-master/sugestoes.html';
        this.config.redirectAfterLogout = '/Cartilha-2.0.1.0-master/sugestoes-login.html';
        console.log('🐙 Ambiente: GitHub Pages');
    } else if (hostname === 'localhost' || hostname === '127.0.0.1') {
        // Live Server
        this.config.redirectAfterLogin = '/docs/sugestoes.html';
        this.config.redirectAfterLogout = '/docs/sugestoes-login.html';
        console.log('🏠 Ambiente: Live Server');
    } else {
        // Outros ambientes (fallback)
        this.config.redirectAfterLogin = './sugestoes.html';
        this.config.redirectAfterLogout = './sugestoes-login.html';
        console.log('🌐 Ambiente: Outros');
    }
    
    console.log('✅ URLs configuradas:', {
        login: this.config.redirectAfterLogin,
        logout: this.config.redirectAfterLogout
    });
},



    /**
     * Verificar se usuário está autenticado
     */
    async checkAuthentication() {
        try {
            console.log('🔍 Verificando autenticação...');
            
            // Verificar se Firebase está disponível
            if (typeof firebase === 'undefined' || !firebase.auth) {
                throw new Error('Firebase não está inicializado');
            }

            return new Promise((resolve, reject) => {
                const unsubscribe = firebase.auth().onAuthStateChanged(async (user) => {
                    unsubscribe(); // Cancelar listener
                    
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

                    try {
                        // Verificar se é usuário autorizado
                        const profile = await this.getUserProfile(user);
                        
                        if (!profile.isAuthorized) {
                            console.log('❌ Usuário não autorizado:', user.email);
                            await firebase.auth().signOut();
                            resolve({
                                isAuthenticated: false,
                                user: null,
                                profile: null,
                                reason: 'not_authorized'
                            });
                            return;
                        }

                        // Verificar timeout da sessão
                        if (this.isSessionExpired()) {
                            console.log('⏰ Sessão expirada');
                            await firebase.auth().signOut();
                            resolve({
                                isAuthenticated: false,
                                user: null,
                                profile: null,
                                reason: 'session_expired'
                            });
                            return;
                        }

                        console.log('✅ Usuário autenticado:', user.email);
                        
                        // Atualizar timestamp da sessão
                        this.updateSessionTimestamp();
                        
                        resolve({
                            isAuthenticated: true,
                            user: user,
                            profile: profile,
                            reason: 'authenticated'
                        });

                    } catch (error) {
                        console.error('❌ Erro ao verificar perfil do usuário:', error);
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
     * Obter perfil do usuário
     */
    async getUserProfile(user) {
        try {
            const email = user.email;
            const domain = email.split('@')[1];
            
            // Verificar se é domínio autorizado
            const isAuthorized = this.config.allowedDomains.includes(domain);
            
            if (!isAuthorized) {
                return {
                    isAuthorized: false,
                    reason: 'domain_not_allowed'
                };
            }

            // Buscar dados adicionais no Firestore (se existir)
            let additionalData = {};
            try {
                const userDoc = await window.db
                    .collection('sugestoes_users')
                    .doc(user.uid)
                    .get();
                
                if (userDoc.exists) {
                    additionalData = userDoc.data();
                }
            } catch (error) {
                console.log('ℹ️ Dados adicionais não encontrados, usando dados básicos');
            }

            return {
                isAuthorized: true,
                uid: user.uid,
                email: email,
                displayName: user.displayName || additionalData.displayName || email.split('@')[0],
                photoURL: user.photoURL || additionalData.photoURL || null,
                domain: domain,
                department: additionalData.department || 'PGE-SC',
                role: additionalData.role || 'user',
                permissions: additionalData.permissions || ['comment', 'suggest', 'like', 'rate'],
                isInstitutional: true,
                lastLogin: new Date().toISOString(),
                authProvider: user.providerData[0]?.providerId || 'unknown'
            };

        } catch (error) {
            console.error('Erro ao obter perfil do usuário:', error);
            return {
                isAuthorized: false,
                reason: 'profile_error'
            };
        }
    },

    /**
     * Login com Google
     */
    async loginWithGoogle() {
        try {
            console.log('🔐 Iniciando login com Google...');
            
            const provider = new firebase.auth.GoogleAuthProvider();
            provider.addScope('email');
            provider.addScope('profile');
            
            // Forçar seleção de conta
            provider.setCustomParameters({
                prompt: 'select_account',
                hd: 'pge.sc.gov.br' // Sugerir domínio institucional
            });

            const result = await firebase.auth().signInWithPopup(provider);
            const user = result.user;
            
            console.log('✅ Login com Google realizado:', user.email);
            
            // Verificar domínio
            if (!user.email.includes('@pge.sc.gov.br')) {
                await firebase.auth().signOut();
                throw new Error('Por favor, use sua conta institucional @pge.sc.gov.br');
            }

            // Salvar dados do usuário
            await this.saveUserData(user);
            
            // Atualizar timestamp da sessão
            this.updateSessionTimestamp();
            
            return {
                success: true,
                user: user,
                message: 'Login realizado com sucesso!'
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
     * Login com Microsoft
     */
    async loginWithMicrosoft() {
        try {
            console.log('🔐 Iniciando login com Microsoft...');
            
            const provider = new firebase.auth.OAuthProvider('microsoft.com');
            provider.addScope('email');
            provider.addScope('profile');
            
            // Configurar tenant (se necessário)
            provider.setCustomParameters({
                prompt: 'select_account',
                tenant: 'pge.sc.gov.br'
            });

            const result = await firebase.auth().signInWithPopup(provider);
            const user = result.user;
            
            console.log('✅ Login com Microsoft realizado:', user.email);
            
            // Verificar domínio
            if (!user.email.includes('@pge.sc.gov.br')) {
                await firebase.auth().signOut();
                throw new Error('Por favor, use sua conta institucional @pge.sc.gov.br');
            }

            // Salvar dados do usuário
            await this.saveUserData(user);
            
            // Atualizar timestamp da sessão
            this.updateSessionTimestamp();
            
            return {
                success: true,
                user: user,
                message: 'Login realizado com sucesso!'
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
     * Salvar dados do usuário no Firestore
     */
    async saveUserData(user) {
        try {
            const userData = {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                photoURL: user.photoURL,
                domain: user.email.split('@')[1],
                department: 'PGE-SC',
                role: 'user',
                permissions: ['comment', 'suggest', 'like', 'rate'],
                isInstitutional: true,
                lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                authProvider: user.providerData[0]?.providerId,
                isActive: true
            };

            await window.db
                .collection('sugestoes_users')
                .doc(user.uid)
                .set(userData, { merge: true });

            console.log('✅ Dados do usuário salvos no Firestore');

        } catch (error) {
            console.error('⚠️ Erro ao salvar dados do usuário:', error);
            // Não bloquear o login por causa disso
        }
    },

    /**
     * Logout
     */
    async logout() {
        try {
            console.log('🚪 Realizando logout...');
            
            await firebase.auth().signOut();
            
            // Limpar dados locais
            localStorage.removeItem('sessionTimestamp');
            localStorage.removeItem('likedPrompts');
            localStorage.removeItem('ratedPrompts');
            localStorage.removeItem('likedComments');
            
            console.log('✅ Logout realizado com sucesso');
            
            // Redirecionar para página de login
            window.location.href = this.config.redirectAfterLogout;
            
        } catch (error) {
            console.error('❌ Erro no logout:', error);
            // Forçar redirecionamento mesmo com erro
            window.location.href = this.config.redirectAfterLogout;
        }
    },

    /**
     * Verificar se sessão expirou
     */
    isSessionExpired() {
        const sessionTimestamp = localStorage.getItem('sessionTimestamp');
        if (!sessionTimestamp) return true;
        
        const now = Date.now();
        const sessionAge = now - parseInt(sessionTimestamp);
        
        return sessionAge > this.config.sessionTimeout;
    },

    /**
     * Atualizar timestamp da sessão
     */
    updateSessionTimestamp() {
        localStorage.setItem('sessionTimestamp', Date.now().toString());
    },

    init() {
    console.log('🚀 Inicializando sistema de autenticação...');
    
    // DETECTAR AMBIENTE PRIMEIRO
    this.detectEnvironment();
    
    // Verificar se está na página de login
    if (window.location.pathname.includes('sugestoes-login.html')) {
        console.log('📄 Página de login detectada');
        return;
    }
    
    this.checkAuthentication().then(auth => {
        if (!auth.isAuthenticated) {
            console.log('🔄 Redirecionando para login...');
            console.log('🎯 URL de destino:', this.config.redirectAfterLogout);
            window.location.href = this.config.redirectAfterLogout;
        } else {
            console.log('✅ Usuário autenticado, permanecendo na página');
        }
    });
}


};
// Sistema de inicialização mais robusto
function initSugestoesAuth() {
    console.log('🔄 Tentando inicializar SugestoesAuth...');
    
    if (typeof firebase === 'undefined') {
        console.log('⏳ Firebase não carregado ainda, tentando novamente...');
        return false;
    }
    
    if (!firebase.auth) {
        console.log('⏳ Firebase Auth não carregado ainda, tentando novamente...');
        return false;
    }
    
    console.log('✅ Firebase disponível, inicializando...');
    SugestoesAuth.init();
    return true;
}

// Múltiplas tentativas de inicialização
document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOM carregado, iniciando verificações...');
    
    // Tentativa imediata
    if (initSugestoesAuth()) return;
    
    // Tentativas com delay crescente
    const delays = [500, 1000, 2000, 3000];
    
    delays.forEach((delay, index) => {
        setTimeout(() => {
            console.log(`🔄 Tentativa ${index + 2} após ${delay}ms...`);
            if (initSugestoesAuth()) {
                console.log('✅ Inicialização bem-sucedida!');
            } else if (index === delays.length - 1) {
                console.error('❌ Falha na inicialização após múltiplas tentativas');
                console.error('🔍 Diagnóstico:', {
                    firebase: typeof firebase,
                    auth: typeof firebase !== 'undefined' ? !!firebase.auth : 'N/A',
                    location: window.location.href
                });
            }
        }, delay);
    });
});



