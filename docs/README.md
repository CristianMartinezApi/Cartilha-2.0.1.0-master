# Guia de Uso Seguro da IA na PGE-SC

![Logo PGE-SC](src/img/pge.png)

## Sobre o Projeto

Este projeto é um guia interativo sobre o uso seguro de Inteligência Artificial na Procuradoria Geral do Estado de Santa Catarina (PGE-SC). O guia fornece diretrizes, boas práticas e recursos para auxiliar procuradores e servidores a utilizarem ferramentas de IA de forma segura e eficiente em suas atividades profissionais.

## Funcionalidades

- **Documentos e Orientações**: Acesso a portarias e documentos oficiais sobre o uso de IA
- **Ferramentas Disponíveis**: Informações sobre ferramentas de IA aprovadas para uso institucional
- **Boas Práticas**: Diretrizes para uso seguro e responsável de IA
- **Guia de Prompts**: Instruções detalhadas para criar prompts eficazes
- **Espaço Colaborativo**: Sistema para envio de feedback e sugestões de prompts

## Tecnologias Utilizadas

- HTML5, CSS3 e JavaScript
- Firebase (Firestore) para armazenamento de dados
- EmailJS para funcionalidades de contato
- Google Analytics para métricas de uso

## Estrutura do Projeto

```
docs/
├── index.html              # Página principal do guia
├── login.html              # Página de login para área administrativa
├── admin.html              # Painel administrativo
├── materia.pdf             # Documento de portaria
├── src/
│   ├── img/                # Imagens e recursos visuais
│   ├── styles/             # Arquivos CSS
│   │   ├── styles.css      # Estilos principais
│   │   └── dropdown-touch-fix.css # Correção para dropdowns em dispositivos móveis
│   └── scripts/            # Arquivos JavaScript
│       ├── script.js       # Script principal
│       ├── firebase-init.js # Inicialização do Firebase
│       ├── suggestions.js  # Gerenciamento de sugestões
│       ├── feedback.js     # Sistema de feedback
│       ├── dropdown-touch.js # Funcionalidade para menus em dispositivos móveis
│       └── admin.js        # Funcionalidades da área administrativa
```

## Instalação e Configuração

### Pré-requisitos

- Conta no Firebase para configuração do Firestore
- Conta no EmailJS para funcionalidade de contato
- Navegador web moderno

### Configuração

1. Clone o repositório:
```bash
git clone https://github.com/CristianMartinezApi/Cartilha-2.0.1.0-master.git
cd Cartilha-2.0.1.0-master
```

2. Configure o Firebase:
   - Crie um projeto no [Firebase Console](https://console.firebase.google.com/)
   - Obtenha as credenciais de configuração
   - Substitua as credenciais no arquivo `docs/src/scripts/firebase-init.js`

3. Configure o EmailJS:
   - Crie uma conta no [EmailJS](https://www.emailjs.com/)
   - Obtenha sua chave pública
   - Substitua a chave no arquivo `docs/index.html` na seção:
   ```javascript
   (function () {
       emailjs.init("cole_sua_public_key_aqui");
   })();
   ```

4. Inicie um servidor local para desenvolvimento:
   - Você pode usar o Live Server no VS Code ou qualquer servidor HTTP local
   - Navegue até a pasta `docs` para visualizar o site

## Uso

O guia é intuitivo e organizado em seções:

1. **Documentos e Orientações**: Acesse documentos oficiais sobre o uso de IA
2. **Ferramentas Disponíveis**: Conheça as ferramentas de IA aprovadas para uso
3. **Boas Práticas**: Aprenda as diretrizes para uso seguro de IA
4. **Guia de Prompts**: Aprenda a criar prompts eficazes em 7 passos
5. **Espaço Colaborativo**: Envie feedback e sugestões de prompts

## Área Administrativa

O projeto inclui uma área administrativa para gerenciar sugestões e feedback:

1. Acesse `login.html` para entrar na área administrativa
2. Utilize as credenciais configuradas no Firebase Authentication
3. No painel administrativo, você pode:
   - Revisar e aprovar sugestões de prompts
   - Visualizar feedback dos usuários
   - Gerenciar conteúdo do site

## Responsividade e Acessibilidade

O site foi desenvolvido para ser responsivo e funcionar em diversos dispositivos:

- **Desktop**: Experiência completa com todas as funcionalidades
- **Tablet**: Layout adaptado para telas médias
- **Smartphone**: Interface otimizada para telas pequenas com menus adaptados

## Contribuição

Contribuições são bem-vindas! Para contribuir:

1. Faça um fork do repositório
2. Crie uma branch para sua feature (`git checkout -b feature/nova-funcionalidade`)
3. Faça commit das suas alterações (`git commit -m 'Adiciona nova funcionalidade'`)
4. Faça push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

## Licença

Este projeto é destinado ao uso interno da PGE-SC. Todos os direitos reservados.

## Contato

Para mais informações, entre em contato com a equipe de desenvolvimento da PGE-SC.

---

© 2025 - Procuradoria Geral do Estado de Santa Catarina - Todos os direitos reservados
