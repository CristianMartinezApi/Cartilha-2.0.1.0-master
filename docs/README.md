# Guia de Uso Seguro da IA na PGE-SC

![Logo PGE-SC](./src/img/pge.png)

## Sobre o Projeto

Este projeto é um guia interativo sobre o uso seguro de Inteligência Artificial na Procuradoria Geral do Estado de Santa Catarina (PGE-SC). Ele reúne diretrizes, boas práticas e recursos para auxiliar procuradores e servidores no uso seguro e eficiente das ferramentas de IA. Além do conteúdo institucional, o sistema oferece um espaço colaborativo onde os usuários podem enviar sugestões de prompts – que, após aprovação administrativa, são exibidos publicamente.

## Funcionalidades

- **Documentos e Orientações**: Acesso a portarias e documentos oficiais sobre o uso de IA.
- **Ferramentas Disponíveis**: Informações sobre ferramentas de IA aprovadas para uso institucional.
- **Boas Práticas**: Diretrizes para uso seguro e responsável de IA.
- **Guia de Prompts**:  
  - Instruções detalhadas para criação de prompts eficazes.  
  - Formulário atualizado com campos para título, comentário, categoria e texto do prompt.  
  - Exibição dos prompts aprovados, organizados por categoria.
- **Espaço Colaborativo**: Sistema para envio de feedback e sugestões de prompts, apos revisão pelo administrador.

## Tecnologias Utilizadas

- HTML5, CSS3 e JavaScript
- Firebase (Firestore) para armazenamento de dados  
  (Regras de desenvolvimento: `allow read, write: if true`)
- EmailJS para funcionalidades de contato
- Google Analytics para métricas de uso

## Estrutura do Projeto

```
.
├───.vscode
│       settings.json
└───docs
    │   .env
    │   admin.html          // Área administrativa para aprovação de prompts e gerenciamento do conteúdo
    │   index.html          // Página pública com orientações, ferramentas, boas práticas e guia de prompts
    │   login.html          // Página para autenticação na área administrativa
    │   materia.pdf
    │   package.json
    │   README.md
    │   sugestoes.html      // Página exclusiva para sugestões de prompts (ou formulário alternativo)
    │
    └───src
        ├───img            // Imagens e logos do projeto
        ├───scripts
        │       admin.js
        │       approvedSuggestions.js
        │       auth-check.js
        │       feedback.js
        │       feedbackListener.js
        │       fetch-suggestions.js
        │       firebase-init.js
        │       login.js
        │       main.js
        │       script.js
        │       sugestoes.js    // Lógica específica para a página de sugestões, se necessário
        │       suggestions.js  // Lógica para envio e gerenciamento de sugestões de prompts
        └───styles
                admin.css
                login.css
                styles.css
                sugestoes.css  // Estilos aplicados à página de sugestões (sugestoes.html)
```

## Instalação e Configuração

### Pré-requisitos

- Conta no Firebase para configuração do Firestore.
- Conta no EmailJS para a funcionalidade de contato.
- Navegador web moderno.

### Configuração

1. **Clone o repositório**:
   ```bash
   git clone https://github.com/CristianMartinezApi/Cartilha-2.0.1.0-master.git
   cd Cartilha-2.0.1.0-master
   ```

2. **Configure o Firebase**:
   - Crie um projeto no [Firebase Console](https://console.firebase.google.com/).
   - Obtenha as credenciais de configuração e substitua-as no arquivo `docs/src/scripts/firebase-init.js`.
   - Atualize as variáveis de ambiente no arquivo `.env` na pasta docs.

3. **Configure o EmailJS**:
   - Crie uma conta em [EmailJS](https://www.emailjs.com/).
   - Obtenha sua chave pública e insira-a na seção de inicialização em `docs/index.html` (ou no respectivo script).

4. **Inicie um servidor local**:
   - Utilize o Live Server do VS Code ou outro servidor HTTP local.
   - Acesse a pasta `docs` para visualizar o site.

## Uso

### Área Pública

- **Documentos e Orientações**: Consulte as portarias e documentos oficiais.
- **Ferramentas Disponíveis**: Conheça as ferramentas de IA aprovadas para uso institucional.
- **Boas Práticas**: Acesse as diretrizes para o uso seguro de IA.
- **Guia de Prompts**:
  - Envie sugestões de prompts utilizando o formulário (campos: título, comentário, categoria, texto).
  - Os prompts são adicionados com status "pending" e exibição somente após aprovação.
  - Utilize filtros para navegar pelos prompts aprovados por categoria.
- **Espaço Colaborativo**: Envie feedbacks e contribua com sugestão de melhorias.

### Área Administrativa

- **Login**: Acesse `login.html` para autenticar-se e gerenciar o conteúdo.
- **Gerenciamento de Sugestões**:
  - Revise sugestões pendentes.
  - Aprove ou rejeite sugestões de prompts.
- **Feedback**:
  - Visualize os feedbacks enviados pelos usuários.
  - Gerencie o conteúdo exibido na área pública.

## Melhorias Recentes e Próximos Passos

### Melhorias Recentes

- Atualização do formulário de sugestões para incluir título, comentário, categoria e texto.
- Criação de páginas específicas para administração (`admin.html`, `login.html`) e para envio de sugestões (`sugestoes.html`).
- Implementação de filtros para exibição dos prompts aprovados por categoria.

### Próximos Passos

- Desenvolvimento de uma interface modal ou suspensa para exibição filtrada dos prompts.
- Otimização da responsividade e experiência do usuário para dispositivos móveis.
- Refino das funcionalidades de autenticação e segurança.

## Contribuição

Contribuições são bem-vindas! Para contribuir:

1. Faça um fork do repositório.
2. Crie uma branch para sua feature:
   ```bash
   git checkout -b feature/nova-funcionalidade
   ```
3. Faça commit das suas alterações:
   ```bash
   git commit -m 'Adiciona nova funcionalidade'
   ```
4. Faça push para a branch:
   ```bash
   git push origin feature/nova-funcionalidade
   ```
5. Abra um Pull Request.

## Licença

Este projeto é destinado ao uso interno da PGE-SC. Todos os direitos reservados.

## Contato

Para mais informações, entre em contato com a equipe de desenvolvimento da PGE-SC.

---

© 2025 - Procuradoria Geral do Estado de Santa Catarina - Todos os direitos reservados