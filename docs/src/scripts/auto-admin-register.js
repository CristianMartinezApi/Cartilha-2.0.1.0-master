/**
 * SISTEMA DE AUTO-REGISTRO DE ADMINS CORPORATIVOS
 * Registra automaticamente usuarios @pge.sc.gov.br como admins
 */

console.log('🔧 Sistema de auto-registro de admins carregado');

async function autoRegisterCorporateAdmin(user) {
    try {
        if (!user || !user.email) {
            console.log('❌ Usuario invalido para auto-registro');
            return false;
        }
        
        const email = user.email;
        const domain = email.split('@')[1];
        
        if (domain !== 'pge.sc.gov.br') {
            console.log('❌ Dominio nao corporativo:', domain);
            return false;
        }
        
        console.log('🏢 Usuario corporativo detectado:', email);
        
        const adminDoc = await window.db.collection('admins').doc(user.uid).get();
        
        if (adminDoc.exists) {
            console.log('✅ Usuario ja e admin:', email);
            return true;
        }
        
        console.log('📝 Registrando novo admin corporativo:', email);
        
        const adminData = {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || user.email.split('@')[0],
            photoURL: user.photoURL || null,
            domain: domain,
            department: 'PGE-SC',
            role: 'admin',
            permissions: [
                'approve_suggestions',
                'reject_suggestions', 
                'delete_suggestions',
                'manage_users',
                'view_analytics',
                'moderate_comments'
            ],
            isInstitutional: true,
            autoRegistered: true,
            registeredAt: firebase.firestore.FieldValue.serverTimestamp(),
            lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
            authProvider: user.providerData[0]?.providerId || 'unknown',
            isActive: true,
            createdBy: 'auto-system',
            notes: 'Registrado automaticamente por ser usuario corporativo @pge.sc.gov.br'
        };
        
        await window.db.collection('admins').doc(user.uid).set(adminData);
        
        console.log('✅ Usuario registrado como admin automaticamente:', email);
        
        // Tambem salvar na colecao de usuarios
        const userData = {
            ...adminData,
            sessionType: 'corporate-admin'
        };
        
        await window.db.collection('sugestoes_users').doc(user.uid).set(userData, { merge: true });
        
        return true;
        
    } catch (error) {
        console.error('❌ Erro no auto-registro de admin:', error);
        return false;
    }
}

async function checkAndRegisterAdmin() {
    try {
        if (typeof firebase === 'undefined' || !firebase.auth || !window.db) {
            console.log('⏳ Aguardando Firebase...');
            setTimeout(checkAndRegisterAdmin, 500);
            return;
        }
        
        firebase.auth().onAuthStateChanged(async (user) => {
            if (user) {
                console.log('👤 Usuario logado, verificando auto-registro:', user.email);
                
                const isRegistered = await autoRegisterCorporateAdmin(user);
                
                if (isRegistered) {
                    console.log('🎉 Usuario corporativo com acesso admin confirmado');
                } else {
                    console.log('⚠️ Usuario nao e corporativo ou houve erro');
                }
            }
        });
        
    } catch (error) {
        console.error('❌ Erro na verificacao de admin:', error);
    }
}

// Exportar funcoes para uso global
window.autoRegisterCorporateAdmin = autoRegisterCorporateAdmin;
window.checkAndRegisterAdmin = checkAndRegisterAdmin;

console.log('✅ Sistema de auto-registro configurado');
