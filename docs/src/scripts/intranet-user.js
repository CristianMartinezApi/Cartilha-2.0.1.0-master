// Função para capturar dados do usuário da intranet
function getUserFromIntranet() {
    try {
        // Procurar pela mensagem "Você está logado(a) como..."
        const bodyText = document.body.innerText || document.body.textContent;
        const loginMatch = bodyText.match(/Você está logado\(a\) como\s+(\w+)/i);
        
        if (loginMatch && loginMatch[1]) {
            const username = loginMatch[1];
            
            return {
                username: username,
                nome: username, // Por enquanto usar o username como nome
                email: `${username}@pge.sc.gov.br`, // Email padrão baseado no username
                setor: 'Não informado',
                cargo: 'Não informado',
                matricula: username
            };
        }
        
        // Fallback: tentar outras formas de capturar
        // Verificar se existe em elementos específicos
        const userElements = document.querySelectorAll('*');
        for (let element of userElements) {
            const text = element.textContent || element.innerText;
            if (text && text.includes('logado(a) como')) {
                const match = text.match(/logado\(a\) como\s+(\w+)/i);
                if (match && match[1]) {
                    const username = match[1];
                    return {
                        username: username,
                        nome: username,
                        email: `${username}@pge.sc.gov.br`,
                        setor: 'Não informado',
                        cargo: 'Não informado',
                        matricula: username
                    };
                }
            }
        }
        
        return null;
    } catch (error) {
        console.error('Erro ao capturar usuário da intranet:', error);
        return null;
    }
}

// Função para aguardar o carregamento da página da intranet
function waitForIntranetUser(callback, maxAttempts = 10) {
    let attempts = 0;
    
    function checkUser() {
        attempts++;
        const user = getUserFromIntranet();
        
        if (user) {
            callback(user);
        } else if (attempts < maxAttempts) {
            setTimeout(checkUser, 500); // Tentar novamente em 500ms
        } else {
            console.warn('Não foi possível capturar usuário da intranet após', maxAttempts, 'tentativas');
            callback(null);
        }
    }
    
    checkUser();
}
