/**
 * Utilitários para Sistema de Comentários
 * Versão 1.0 - Funções auxiliares e validações
 */

const CommentsUtils = {
    
    /**
     * Configurações de validação
     */
    validation: {
        minLength: 1,
        maxLength: 500,
        blockedWords: [
            'spam', 'teste123', 'asdfgh', 'qwerty'
        ],
        blockedPatterns: [
            /(.)\1{4,}/g, // Caracteres repetidos (aaaaa)
            /^[^a-zA-Z0-9À-ÿ\s.,!?-]*$/g // Apenas símbolos
        ]
    },

    /**
     * Validar texto do comentário
     */
    validateComment(text) {
        const result = {
            isValid: false,
            errors: [],
            warnings: []
        };

        // Verificar se existe texto
        if (!text || typeof text !== 'string') {
            result.errors.push('Comentário não pode estar vazio');
            return result;
        }

        const trimmedText = text.trim();

        // Verificar comprimento mínimo
        if (trimmedText.length < this.validation.minLength) {
            result.errors.push('Comentário muito curto');
            return result;
        }

        // Verificar comprimento máximo
        if (trimmedText.length > this.validation.maxLength) {
            result.errors.push(`Comentário muito longo (máximo ${this.validation.maxLength} caracteres)`);
            return result;
        }

        // Verificar palavras bloqueadas
        const lowerText = trimmedText.toLowerCase();
        const foundBlockedWords = this.validation.blockedWords.filter(word => 
            lowerText.includes(word.toLowerCase())
        );

        if (foundBlockedWords.length > 0) {
            result.errors.push('Comentário contém conteúdo não permitido');
            return result;
        }

        // Verificar padrões bloqueados
        const hasBlockedPattern = this.validation.blockedPatterns.some(pattern => 
            pattern.test(trimmedText)
        );

        if (hasBlockedPattern) {
            result.warnings.push('Comentário pode conter conteúdo suspeito');
        }

        // Se chegou até aqui, é válido
        result.isValid = true;
        return result;
    },

    /**
     * Sanitizar texto do comentário
     */
    sanitizeComment(text) {
        if (!text || typeof text !== 'string') return '';

        return text
            .trim()
            .replace(/\s+/g, ' ') // Múltiplos espaços em um só
            .replace(/\n{3,}/g, '\n\n') // Múltiplas quebras de linha
            .substring(0, this.validation.maxLength); // Garantir limite
    },

    /**
     * Formatar data de comentário com mais opções
     */
    formatCommentDate(timestamp, format = 'relative') {
        if (!timestamp) return 'Agora mesmo';

        try {
            const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
            const now = new Date();

            switch (format) {
                case 'relative':
                    return this.getRelativeTime(date, now);
                
                case 'absolute':
                    return new Intl.DateTimeFormat('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    }).format(date);
                
                case 'short':
                    return new Intl.DateTimeFormat('pt-BR', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                    }).format(date);
                
                default:
                    return this.getRelativeTime(date, now);
            }

        } catch (error) {
            console.error('Erro ao formatar data:', error);
            return 'Data inválida';
        }
    },

    /**
     * Calcular tempo relativo
     */
    getRelativeTime(date, now) {
        const diffMs = now - date;
        const diffSecs = Math.floor(diffMs / 1000);
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffSecs < 30) return 'Agora mesmo';
        if (diffSecs < 60) return `${diffSecs}s atrás`;
        if (diffMins < 60) return `${diffMins}min atrás`;
        if (diffHours < 24) return `${diffHours}h atrás`;
        if (diffDays < 7) return `${diffDays}d atrás`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} sem atrás`;
        
        return new Intl.DateTimeFormat('pt-BR', {
            day: 'numeric',
            month: 'short',
            year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
        }).format(date);
    },

    /**
     * Gerar ID único para comentário temporário
     */
    generateTempId() {
        return 'temp_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    },

    /**
     * Debounce para otimizar performance
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    /**
     * Throttle para limitar execução
     */
    throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    /**
     * Verificar se dispositivo é móvel
     */
    isMobile() {
        return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    },

    /**
     * Copiar texto para área de transferência
     */
    async copyToClipboard(text) {
        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(text);
                return true;
            } else {
                // Fallback para navegadores antigos
                const textArea = document.createElement('textarea');
                textArea.value = text;
                textArea.style.position = 'fixed';
                textArea.style.left = '-999999px';
                textArea.style.top = '-999999px';
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                
                const successful = document.execCommand('copy');
                document.body.removeChild(textArea);
                return successful;
            }
        } catch (error) {
            console.error('Erro ao copiar texto:', error);
            return false;
        }
    },

    /**
     * Detectar menções no texto (@usuario)
     */
    detectMentions(text) {
        const mentionRegex = /@(\w+)/g;
        const mentions = [];
        let match;

        while ((match = mentionRegex.exec(text)) !== null) {
            mentions.push({
                username: match[1],
                position: match.index,
                length: match[0].length
            });
        }

        return mentions;
    },

    /**
     * Destacar menções no texto
     */
    highlightMentions(text) {
        return text.replace(/@(\w+)/g, '<span class="mention">@$1</span>');
    },

    /**
     * Contar palavras no texto
     */
    countWords(text) {
        if (!text || typeof text !== 'string') return 0;
        return text.trim().split(/\s+/).filter(word => word.length > 0).length;
    },

    /**
     * Estimar tempo de leitura
     */
    estimateReadingTime(text, wordsPerMinute = 200) {
        const wordCount = this.countWords(text);
        const minutes = Math.ceil(wordCount / wordsPerMinute);
        return minutes;
    },

        /**
     * Verificar se usuário pode moderar comentários
     */
    async canUserModerate(userInfo = null) {
        try {
            if (!userInfo) {
                userInfo = await captureUserInfo();
            }

            // Critérios para moderação:
            // 1. Usuário institucional
            // 2. Email @pge.sc.gov.br
            // 3. Método de captura confiável
            return userInfo.isInstitutional && 
                   userInfo.userEmail.includes('@pge.sc.gov.br') &&
                   (userInfo.captureMethod.includes('Firebase') || 
                    userInfo.captureMethod.includes('SugestoesAuth'));

        } catch (error) {
            console.error('Erro ao verificar permissões de moderação:', error);
            return false;
        }
    },

    /**
     * Verificar se usuário pode editar comentário
     */
    async canUserEditComment(commentData, userInfo = null) {
        try {
            if (!userInfo) {
                userInfo = await captureUserInfo();
            }

            // Pode editar se:
            // 1. É o autor (mesmo sessionId)
            // 2. Ou é moderador
            // 3. E comentário foi feito há menos de 15 minutos
            const isAuthor = commentData.authorInfo.sessionId === userInfo.sessionId;
            const isModerator = await this.canUserModerate(userInfo);
            
            if (isModerator) return true;
            
            if (isAuthor) {
                // Verificar tempo limite para edição (15 minutos)
                const commentTime = commentData.timestamp.toDate ? 
                    commentData.timestamp.toDate() : 
                    new Date(commentData.timestamp);
                const now = new Date();
                const diffMinutes = (now - commentTime) / (1000 * 60);
                
                return diffMinutes <= 15;
            }

            return false;

        } catch (error) {
            console.error('Erro ao verificar permissões de edição:', error);
            return false;
        }
    },

    /**
     * Gerar hash único para comentário (para evitar duplicatas)
     */
    generateCommentHash(promptId, text, userSessionId) {
        const data = `${promptId}-${text.trim()}-${userSessionId}`;
        let hash = 0;
        
        for (let i = 0; i < data.length; i++) {
            const char = data.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Converter para 32bit integer
        }
        
        return Math.abs(hash).toString(36);
    },

    /**
     * Verificar se comentário é duplicata recente
     */
    isDuplicateComment(promptId, text, userSessionId, timeWindowMinutes = 1) {
        const hash = this.generateCommentHash(promptId, text, userSessionId);
        const storageKey = 'recent_comments';
        
        try {
            const recentComments = JSON.parse(localStorage.getItem(storageKey) || '{}');
            const now = Date.now();
            
            // Limpar comentários antigos
            Object.keys(recentComments).forEach(key => {
                if (now - recentComments[key] > timeWindowMinutes * 60 * 1000) {
                    delete recentComments[key];
                }
            });
            
            // Verificar se hash já existe
            if (recentComments[hash]) {
                return true;
            }
            
            // Adicionar novo hash
            recentComments[hash] = now;
            localStorage.setItem(storageKey, JSON.stringify(recentComments));
            
            return false;
            
        } catch (error) {
            console.error('Erro ao verificar duplicata:', error);
            return false;
        }
    },

    /**
     * Limpar cache de comentários recentes
     */
    clearRecentCommentsCache() {
        try {
            localStorage.removeItem('recent_comments');
            console.log('Cache de comentários recentes limpo');
        } catch (error) {
            console.error('Erro ao limpar cache:', error);
        }
    },

    /**
     * Obter estatísticas de comentários
     */
    getCommentStats(comments) {
        if (!Array.isArray(comments)) return null;

        const stats = {
            total: comments.length,
            totalLikes: 0,
            averageLikes: 0,
            institutionalUsers: 0,
            externalUsers: 0,
            topAuthors: {},
            timeDistribution: {
                last24h: 0,
                lastWeek: 0,
                lastMonth: 0,
                older: 0
            }
        };

        const now = new Date();
        const day = 24 * 60 * 60 * 1000;
        const week = 7 * day;
        const month = 30 * day;

        comments.forEach(comment => {
            // Likes
            const likes = comment.likes || 0;
            stats.totalLikes += likes;

            // Usuários institucionais vs externos
            if (comment.authorInfo.isInstitutional) {
                stats.institutionalUsers++;
            } else {
                stats.externalUsers++;
            }

            // Top autores
            const author = comment.authorInfo.userName;
            stats.topAuthors[author] = (stats.topAuthors[author] || 0) + 1;

            // Distribuição temporal
            const commentTime = comment.timestamp.toDate ? 
                comment.timestamp.toDate() : 
                new Date(comment.timestamp);
            const timeDiff = now - commentTime;

            if (timeDiff <= day) {
                stats.timeDistribution.last24h++;
            } else if (timeDiff <= week) {
                stats.timeDistribution.lastWeek++;
            } else if (timeDiff <= month) {
                stats.timeDistribution.lastMonth++;
            } else {
                stats.timeDistribution.older++;
            }
        });

        // Calcular médias
        stats.averageLikes = stats.total > 0 ? 
            (stats.totalLikes / stats.total).toFixed(1) : 0;

        // Ordenar top autores
        stats.topAuthors = Object.entries(stats.topAuthors)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5)
            .reduce((obj, [key, value]) => {
                obj[key] = value;
                return obj;
            }, {});

        return stats;
    },

    /**
     * Exportar comentários para JSON
     */
    exportComments(comments, promptTitle = 'Prompt') {
        try {
            const exportData = {
                exportDate: new Date().toISOString(),
                promptTitle: promptTitle,
                totalComments: comments.length,
                comments: comments.map(comment => ({
                    id: comment.id,
                    text: comment.text,
                    author: comment.authorInfo.userName,
                    isInstitutional: comment.authorInfo.isInstitutional,
                    department: comment.authorInfo.department,
                    timestamp: comment.timestamp.toDate ? 
                        comment.timestamp.toDate().toISOString() : 
                        comment.timestamp,
                    likes: comment.likes || 0
                }))
            };

            const dataStr = JSON.stringify(exportData, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            
            const link = document.createElement('a');
            link.href = URL.createObjectURL(dataBlob);
            link.download = `comentarios_${promptTitle.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.json`;
            link.click();

            return true;

        } catch (error) {
            console.error('Erro ao exportar comentários:', error);
            return false;
        }
    },

    /**
     * Verificar conectividade
     */
    isOnline() {
        return navigator.onLine;
    },

    /**
     * Aguardar conectividade
     */
    waitForConnection(timeout = 10000) {
        return new Promise((resolve, reject) => {
            if (this.isOnline()) {
                resolve(true);
                return;
            }

            const timeoutId = setTimeout(() => {
                window.removeEventListener('online', onlineHandler);
                reject(new Error('Timeout aguardando conexão'));
            }, timeout);

            const onlineHandler = () => {
                clearTimeout(timeoutId);
                window.removeEventListener('online', onlineHandler);
                resolve(true);
            };

            window.addEventListener('online', onlineHandler);
        });
    }
};

// Expor globalmente
if (typeof window !== 'undefined') {
    window.CommentsUtils = CommentsUtils;
}

console.log('🔧 comments-utils.js carregado');
