/**
 * Lidar com logout - VERSÃO SIMPLIFICADA
 */
async function handleLogout() {
    const confirmLogout = confirm('Deseja voltar à página principal?');
    if (!confirmLogout) return;
    
    try {
        // Limpar dados se necessário
        localStorage.removeItem('currentUser');
        localStorage.removeItem('lastLoginTime');
        
        // Redirecionar para página principal
        window.location.href = 'index.html';
        
    } catch (error) {
        console.error('❌ Erro ao sair:', error);
        // Mesmo com erro, redirecionar
        window.location.href = 'index.html';
    }
}
