body {
    font-family: 'Roboto', sans-serif;                                   
    margin: 0;
    padding: 0;
    background: rgb(79, 77, 77)
    ;
    background-size: cover;
    color: #333;
    font-size: 16px;
}
html {
    scroll-behavior: smooth;
}


header {
    background-color: rgba(246, 252, 246);
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    color: #231F20;
    padding: 20px;
    text-align: center;
    animation: slideIn 1s ease-in-out;
    display: flex;
    align-items: center;
    justify-content: space-between;
    position: fixed;
    top: 10px;
    width: 100%;
    z-index: 100;
    transition: padding 0.3s ease, top 0.3s ease, background 0.5s ease;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    flex-direction: row;
    margin-top: 30px;
}
main {
    padding: 10px 10px;
    margin-top: 140px;
}
.header-img,
.header-img-right {
    flex: 0 0 auto; /* Garante que as imagens não se ampliem */
    max-height: 80px; /* Ou ajuste conforme necessário */
}

header h1 {
    /* Ajuste para tipografia fluida: mínimo 1.8rem, ideal baseado em vw e máximo 3rem */
    font-size: clamp(1.8rem, 2.5vw, 3rem);
    flex-grow: 1;
    text-align: center;
    margin: 0 20px;
    /* Ajusta a margem para centralizar o texto */
    text-shadow: 2px 2px 2px rgba(0, 0, 0, 0.5);
    flex: 1;
    margin: 0 10px;
}

/* Adicionando transição para o pop-up */
.popup {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: flex-start;
    z-index: 1001;
    overflow: hidden;
    opacity: 1;
    transform: translateY(0); /* Posição inicial */
    transition: opacity 0.5s ease, transform 0.5s ease; /* Anima opacidade e posição */
}

/* Estado de fechamento do pop-up */
.popup.fechar {
    opacity: 0; /* Desaparece */
    transform: translateY(-20px); /* Move levemente para cima durante o desaparecimento */
    pointer-events: none; /* Evita interação */
}

.popup-content {
    background: rgb(255, 255, 255);
    padding: 20px;
    border-radius: 8px;
    text-align: center;
    max-width: 400px;
    width: 100%;
    margin-top: 50px; /* Distância do topo, ajuste conforme necessário */
}

.popup-content p {
    margin-bottom: 15px;
}

.popup-content a {
    color: #007bff;
    text-decoration: none;
}

.popup-content a:hover {
    text-decoration: underline;
}

button {
    background: #007bff;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 5px;
    cursor: pointer;
}

button:hover {
    background: #0056b3;
}

.popup-actions {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    margin-top: 15px;
    gap: 10px;
}

.dont-show-again {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 14px;
}


.header-hidden {
    top: -100px;
}

.header-small {
    padding: 0px;
}

.header-img {
    max-height: 80px;
    margin-right: 10px;
    max-width: 100%;
}

.header-img-right {
    max-height: 80px;
    margin-right: 50px;
    /* Ajusta a margem esquerda para um valor menor */
}


/* Estilos para a barra de navegação principal */
.main-navigation-bar {
    background-color: #9e0621;
    width: 100%;
    padding: 10px 0;
    text-align: center;
    position: fixed;
    top: 0;
    left: 0;
    z-index: 1001;
    box-shadow: 0 2px 5px rgba(0,0,0,0.2);
}

.main-navigation-bar a {
    color: white;
    text-decoration: none;
    padding: 8px 16px;
    margin: 0 5px;
    font-size: 16px;
    font-weight: 500;
    border-radius: 4px;
    display: inline-block;
}

.main-navigation-bar a:hover {
    background-color: rgba(255, 255, 255, 0.2);
}

/* Mantém o estilo atual, adicionando regras somente para o dropdown */
.main-navigation-bar .nav-item {
    display: inline-block;
    position: relative;
}

/* Esconde o submenu inicialmente */
.dropdown-menu {
    display: none;
    position: absolute;
    top: 100%; /* abaixo do link */
    left: 0;
    background: #9e0621; /* utiliza a cor de fundo da navbar */
    padding: 0.5rem 0;
    border-radius: 4px;
    z-index: 1000;
}

/* Cada link do submenu */
.dropdown-menu a {
    display: block;
    padding: 0.5rem 1rem;
    color: #f7f3f3;
    font-size: 12px;
    text-decoration: none;
}

/* Ao passar o mouse no item com dropdown, exibe o submenu */
.nav-item.dropdown:hover .dropdown-menu {
    display: block;
}

/* Opcional: hover para os links do dropdown, semelhante à navbar */
.dropdown-menu a:hover {
    background-color: rgba(255, 255, 255, 0.2);
}


h2 {
    color: #231F20;
    /* Altere esta linha para a cor desejada */
    text-shadow: 2px 2px 2px rgba(0, 0, 0, 0.5);
    /* Adicione esta linha para sombra */
}

.info-section {
    margin: 2rem auto;  /* centralizando com margem automática e usando rem */
    
    padding: 1rem;       /* padding em rem para manter a proporcionalidade */
    max-width: 90%;      /* garante adaptabilidade em telas menores */
    background-color: rgba(255, 255, 255, 0.9);
    border-radius: 8px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.info-section:hover {
    background-color: rgba(255, 255, 255, 0.8);
}

.info-section:not(:last-child) {
    border-bottom: 1px solid #333; /* Linha separadora */
    margin-bottom: 20px; /* Espaço abaixo da linha */
    padding-bottom: 20px; /* Espaço abaixo do conteúdo */
}

.info-section h4 {
    color: #e02222;
    font-size: 1rem;
}

#conclusaoSection li {
    cursor: default !important;
    /* Remove o cursor pointer com prioridade */
}

#boasPraticasSection h2{
    cursor: pointer;
}

.cards-section {
    display: flex;
    justify-content: space-around;
    margin: 10px auto;
    max-width: 100%;
}


.card {
    background-color: rgba(255, 255, 255, 0.8);
    padding: 20px;
    padding-bottom: 60px;
    /* Adiciona espaço para o botão */
    border-radius: 8px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    width: calc(50% - 10px);
    transition: transform 0.3s ease, background-color 0.3s ease;
    animation: fadeIn 0.5s ease-in-out;
    margin: 0 10px;
    position: relative;
    /* Necessário para posicionar o botão */
    overflow: hidden;
    z-index: 1;
}

.card:hover {
    background-color: rgba(224, 250, 230, 0.6);
}
.boas-praticas-list {
    display: flex; /* Garante que a lista seja exibida como bloco */
}

.boas-praticas-list li {
    width: 100%; /* Garante que os itens da lista ocupem a largura total */
}

#boasPraticasSection .boas-praticas-list.hidden {
    display: none; /* Esconde a lista quando a classe 'hidden' estiver presente */
}
#boasPraticasSection h2 {
    cursor: pointer;
    display: flex; /* Adiciona flexbox ao título */
    justify-content: space-between; /* Espalha o título e o indicador */
    align-items: center; /* Alinha verticalmente */
}


/* Estilos gerais para a seção de prompts */
#promptSection {
    max-width: 90%;
    background-color: #f9f9f9d5;
    transition: background-color 0.1s ease; /* Suaviza a transição */
}

#promptSection:hover {
    background-color: #eeeeeed5; /* Um tom levemente mais escuro */
}

#promptSection h2 {
    font-size: 1.6rem;
    color: #131212;
    margin-bottom: 20px;
}

#promptSection p {
    font-size: 1.1rem;
    color: #555;
    margin-bottom: 15px; /* Ajustado para reduzir o espaço entre os parágrafos */
    line-height: 1; /* Ajustado para espaçamento mais compacto entre as linhas */
}
#promptSection a {
    color: #004d40;
    font-size: 1.3rem;
}



/* Accordion */
.accordion-container {
    display: flex;
    flex-wrap: wrap;
    gap: 20px;
}

.steps, .examples {
    display: flex;
    flex-direction: column;
    gap: 12px;
    flex-basis: 48%;
}

.accordion {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-top: 20px;
}

/* Item do Accordion */
.accordion-item {
    background-color: #ffffff;
    border-radius: 5px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.06);
    transition: all 0.3s ease;
    overflow: hidden;
    margin-bottom: 8px; /* Reduzido para menor espaçamento entre os itens */
}

/* Cabeçalho (botão clicável) */
.accordion-header {
    padding: 12px 16px; /* Diminui o padding para aproximar os textos */
    font-size: 1rem;
    font-weight: 600;
    color: #333;
    background-color: #f9f9f9;
    border-left: 5px solid #00796b;
    border-radius: 5px;
    width: 100%;
    text-align: left;
    cursor: pointer;
    display: flex;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.801); /* sombra suave */
    justify-content: space-between;
    align-items: center;
    transition: background-color 0.2s ease;
}

/* Hover no cabeçalho */
.accordion-header:hover {
    background-color: rgba(224, 247, 250, 0.8);
}

/* Indicador (+ / -) */
.accordion-header::after {
    content: '+'; 
    font-size: 1rem;
    transition: transform 0.3s ease;
    color: #888;
}

.accordion-item.active .accordion-header::after {
    content: '−';
}

/* Corpo do conteúdo escondido */
.accordion-body {
    padding: 16px 20px;
    background-color: #e4e4e4;
    color: #555;
    font-size: 1rem;
    line-height: 1.3; /* Ajustado para espaçamento mais compacto entre as linhas */
    display: none;
    border-top: 1px solid #eee;
}

/* Mostra o conteúdo quando ativo */
.accordion-item.active .accordion-body {
    display: block;
}

.emoji-grande {
    font-size: 1.5rem; /* ou 2rem, dependendo do quanto quiser aumentar */
    vertical-align: middle; /* alinha melhor com o texto */
}


.expand-indicator {
    font-size: 0.6em;
    color: #551A8B;
    transform: translateX(-15px); /* Ajuste o valor conforme necessário */

}
.expand-indicator {
    text-shadow: none; /* Remove a sombra */
}

/* Estilização básica do botão expand-indicator */
.expand-indicator {
    background-color: #5FB157;
    border: none;
    border-radius: 4px;
    padding: 8px 10px;
    color: white;
    font-size: 0.9rem;
    cursor: pointer;
    transition: background-color 0.3s ease, transform 0.3s ease;
}

/* Alteração de cor e leve escala ao passar o mouse */
.expand-indicator:hover {
    background-color: #004d40;
    transform: scale(1.1);
}

/* Aplicando a animação pulse, se desejar que ele pulse continuamente */
.expand-indicator.pulsing {
    animation: pulse 2s infinite;
}

.card-content h2 {
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.card-content .link-indicator {
    display: inline-flex;
    align-items: center;
    padding: 10px;
    background: linear-gradient(2deg, #fcfdfc25 -70%, #5FB157 98%);
    color: white;
    text-decoration: none;
    border-radius: 5px;
    border: none;
    cursor: pointer;
    transition: background 0.3s ease, color 0.3s ease, box-shadow 0.3s ease;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
    font-weight: bold;
    margin-left: 10px;
    /* Espaçamento entre o título e o botão */
}

.card-content .link-indicator img {
    margin-right: 8px;
    height: 10px;
    width: 10px;
}

.card-content .link-indicator:hover {
    background: linear-gradient(270deg, #004d40 0%, #5FB157 60%);
    color: #ffffff;
    box-shadow: 0 0 8px rgba(0, 255, 0, 0.2);
}

.info-section .link-indicator {
    display: inline-flex;
    align-items: center;
    padding: 10px;
    background: linear-gradient(2deg, #fcfdfc25 -70%, #5FB157 98%);
    color: white;
    text-decoration: none;
    border-radius: 5px;
    border: none;
    cursor: pointer;
    transition: background 0.3s ease, color 0.3s ease, box-shadow 0.3s ease;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
    font-weight: bold;
    margin-top: 10px;
  
}

.info-section .link-indicator img {
    margin-right: 8px;
    height: 20px;
    width: 20px;
}

.info-section .link-indicator:hover {
    background: linear-gradient(270deg, #004d40 0%, #5FB157 60%);
    color: #ffffff;
    box-shadow: 0 0 8px rgba(0, 255, 0, 0.2);
}
#infoSection p + p {
    border-top: 1px solid #333; /* Linha separadora entre os parágrafos */
    padding-top: 10px;          /* Espaço interno acima do parágrafo */
    margin-top: 10px;           /* Espaço acima da borda */
}


ul {
    list-style-type: none;
    display: flex;
    flex-wrap: wrap;
    gap: 20px;
    padding: 10px;
}

li {
    background-color: rgba(255, 255, 255, 0.8);
    padding: 15px;
    margin: 0;
    border-left: 5px solid #00796b;
    border-radius: 5px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    transition: background-color 0.3s ease, max-height 0.3s ease, box-shadow 0.3s ease;
    animation: fadeIn 0.5s ease-in-out;
    flex: 1 1 calc(50% - 20px);
    box-sizing: border-box;
    
   
    cursor: pointer;
    word-wrap: break-word;
    /* Adicionado para quebra de texto */
}

li:hover {
    background-color: rgba(224, 247, 250, 0.8);
    box-shadow: 0 4px 8px rgba(139, 231, 86, 0.4);
    transform: scale(1.02);
}

li h3,
li h2 {
    margin: 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
}
p {
    font-weight: normal;
}

li .info-text {
    font-size: 0.8em;
    color: #00796b;
    margin-left: 10px;
}

.show-more {
    display: inline-block;
    margin-top: 10px;
    padding: 10px 15px;
    /* Ajuste inicial do padding */
    background: linear-gradient(45deg, #5FB157, #004d40);
    color: white;
    text-decoration: none;
    border-radius: 5px;
    border: none;
    cursor: pointer;
    transition: background 0.3s ease, color 0.3s ease;
    font-weight: bold;
    white-space: normal;
    /* Adicionado para quebra de texto */
}

.show-more:hover {
    background: linear-gradient(45deg, #004d40, #5FB157);
    /* Adiciona o gradiente de cor no hover */
    color: #ffffff;
    /* Adiciona a cor do texto na transição */
}

.arrow {
    display: inline-block;
    margin-left: 5px;
    transition: transform 0.3s ease;
}
.satisfaction-survey {
    position: fixed;
    bottom: 80px;
    right: 20px;
    display: none; /* Force hidden state on load */
    opacity: 0;
    visibility: hidden;
    transition: opacity 0.3s ease, visibility 0.3s;
}

.satisfaction-survey.active {
    display: block;
    opacity: 1;
    visibility: visible;
}

.satisfaction-survey.minimized {
    transform: scale(0.3);
    opacity: 0.7;
    cursor: pointer;
}
#survey-trigger {
    position: fixed;
    bottom: 60px;
    right: 10px;
    padding: 10px 20px;
    background: #4CAF50;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    z-index: 9998; /* Just below survey */
    transition: background-color 0.3s ease, transform 0.3s ease;
   
    transform: rotate(90deg) scale(1.05); /* Rotaciona para vertical ao passar o mouse + escala */
}
#survey-trigger:hover {
    background-color: #004d40;
    transform: rotate(0deg); /* Posição inicial: horizontal */
}
.rating-container {
      margin: 20px 0;
  }

.rating-numbers {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 8px;
  
    margin: 20px 0;
}

.rating-btn {
    width: clamp(30px, 5vw, 40px);  /* largura fluida */
    height: clamp(30px, 5vw, 40px); /* altura fluida */
    font-size: clamp(0.8rem, 2vw, 1rem);
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s ease;
    font-size: 15px;
    font-weight: bold;
    color: white;
}

  .rating-btn[data-value="0"] { background-color: #ff0000; }
  .rating-btn[data-value="1"] { background-color: #ff1a1a; }
  .rating-btn[data-value="2"] { background-color: #ff3333; }
  .rating-btn[data-value="3"] { background-color: #ff4d4d; }
  .rating-btn[data-value="4"] { background-color: #ff6666; }
  .rating-btn[data-value="5"] { background-color: #ff8533; }
  .rating-btn[data-value="6"] { background-color: #ffa64d; }
  .rating-btn[data-value="7"] { background-color: #ffc266; }
  .rating-btn[data-value="8"] { background-color: #80cc28; }
  .rating-btn[data-value="9"] { background-color: #66b300; }
  .rating-btn[data-value="10"] { background-color: #4d9900; }


  .rating-btn:hover {
      transform: scale(1.1);
      box-shadow: 0 0 15px rgba(0, 0, 0, 0.2);
  }

  .rating-btn.selected {
      transform: scale(1.1);
      box-shadow: 0 0 20px rgba(0, 0, 0, 0.3);
  }  .feedback-container {
      margin: 20px 0;
  }

  .feedback-container textarea {
      width: 90%;
      padding: 10px;
      min-height: 80px;
      font-size: 14px;
      border: 1px solid #ddd;
      border-radius: 4px;
      margin-top: 8px;
  }

  .submit-btn {
      background: #4CAF50;
      color: white;
      border: none;
      padding: 8px 15px;
      border-radius: 4px;
      cursor: pointer;
      font-weight: bold;
      font-size: 14px;
      max-width: 250px;
  }

  .submit-btn:hover {
      background: #004d40;
      transform: scale(1.05);
      transition: all 0.3s ease;
  }

  #nome, #email { 
    display: block !important; /* Força os elementos a se comportarem como blocos */
    width: 40%;
    padding: 8px;
    margin: 8px 0;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 0.7rem;
    box-sizing: border-box;
}

/* Garante que o contêiner do formulário seja um bloco */
.survey-form {
    display: block;
}

footer {
    background-color: #9e0621;
    color: white;
    text-align: center;
    padding: 2px;
    width: 100%;
    animation: fadeOut 1s ease-in-out;
}

.more-content {
    display: none;
    /* Esconde o conteúdo adicional por padrão */
}

.show-more {
    display: inline-block;
    margin-top: 10px;
    padding: 5px 10px;
    background: linear-gradient(45deg, #5FB157, #004d40);
    /* Adiciona o gradiente de cor */
    color: white;
    text-decoration: none;
    border-radius: 5px;
    border: none;
    /* Remove a borda padrão do botão */
    cursor: pointer;
    /* Adiciona o cursor de ponteiro */
    transition: background 0.3s ease, color 0.3s ease;
    /* Adiciona a transição de cores */
}

.show-more:hover {
    background: linear-gradient(45deg, #004d40, #5FB157);
    /* Adiciona o gradiente de cor no hover */
    color: #ffffff;
    /* Adiciona a cor do texto na transição */
}
/* Espaço Colaborativo - Adaptado para trabalhar com o CSS existente */
.collaborative-space {
    background-color: #fff;
    border-radius: 8px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    overflow: hidden;
    margin-top: 20px;
}

/* Tabs de navegação */
.tabs {
    display: flex;
    background-color: #f0f4f8;
    border-bottom: 1px solid #ddd;
    border-radius: 8px 8px 0 0;
    overflow: hidden;
}

.tab-btn {
    flex: 1;
    padding: 12px 10px;
    background: none;
    border: none;
    font-size: 16px;
    font-weight: 500;
    color: #555;
    cursor: pointer;
    transition: all 0.3s ease;
}

.tab-btn:hover {
    background-color: #e0e7ef;
}

.tab-btn.active {
    background-color: #fff;
    color: #003366;
    border-bottom: 3px solid #003366;
}

/* Conteúdo das tabs */
.tab-content {
    display: none;
    padding: 20px;
}

.tab-content.active {
    display: block;
}

.tab-content h3 {
    margin-top: 0;
    color: #003366;
    font-size: 1.4rem;
}

/* Botão de avaliação ativo */
.rating-btn.active {
    background-color: #003366;
    color: white;
    font-weight: bold;
}

/* Estilo para a lista de feedbacks recentes */
.recent-feedback {
    margin-top: 30px;
    border-top: 1px solid #eee;
    padding-top: 20px;
}

.recent-feedback h4 {
    color: #003366;
    margin-bottom: 15px;
}

.feedback-list, .questions-list, .suggestions-list {
    display: flex;
    flex-direction: column;
    gap: 15px;
}

.feedback-item, .question-item, .suggestion-item {
    background-color: #f9f9f9;
    border-radius: 8px;
    padding: 15px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    transition: transform 0.2s ease;
}

.feedback-item:hover, .question-item:hover, .suggestion-item:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.feedback-rating {
    font-weight: bold;
    color: #003366;
    margin-bottom: 8px;
}

.feedback-date, .question-date, .suggestion-date, .answer-date {
    display: block;
    font-size: 12px;
    color: #777;
    margin-top: 10px;
}

/* Estilos para perguntas e respostas */
.question h4 {
    margin: 0 0 5px 0;
    font-size: 18px;
    color: #003366;
}

.answer {
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px dashed #ddd;
}

.answer.pending {
    color: #888;
    font-style: italic;
}

.answer-author {
    font-weight: bold;
    font-size: 12px;
    color: #555;
    margin-right: 10px;
}

/* Sistema de votos para sugestões */
.suggestion-votes {
    margin-top: 10px;
}

.vote-btn {
    background: none;
    border: 1px solid #ddd;
    border-radius: 20px;
    padding: 5px 12px;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s;
}

.vote-btn:hover:not([disabled]) {
    background-color: #f0f0f0;
    border-color: #ccc;
}

.vote-btn:disabled {
    cursor: default;
}

/* Formulários adicionais */
.question-form, .suggestion-form {
    margin-bottom: 20px;
}

#question-text, #suggestion-text {
    width: 100%;
    min-height: 100px;
    padding: 12px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 16px;
    margin-bottom: 15px;
    resize: vertical;
}

#submit-question, #submit-suggestion {
    background-color: #5FB157;
    color: white;
    border: none;
    padding: 8px 15px;
    border-radius: 6px;
    font-size: 14px;
    cursor: pointer;
    transition: background-color 0.3s;
}

#submit-question:hover, #submit-suggestion:hover {
    background-color: #004d40;
}
/* Estilos para o botão de feedback na navegação */
.header-actions {
    display: flex;
    align-items: center;
}

.nav-btn {
    background-color: #003366;
    color: white;
    border: none;
    border-radius: 4px;
    padding: 8px 15px;
    font-size: 14px;
    cursor: pointer;
    transition: background-color 0.3s;
    margin-left: 15px;
}

.nav-btn:hover {
    background-color: #004c99;
}

/* Painel de feedback deslizante */
.feedback-panel {
    position: fixed;
    top: 0;
    right: -400px; /* Começa fora da tela */
    width: 380px;
    height: 100vh;
    background-color: white;
    box-shadow: -5px 0 15px rgba(0, 0, 0, 0.2);
    z-index: 1000;
    transition: right 0.3s ease;
    overflow-y: auto;
}

.feedback-panel.open {
    right: 0;
}

.panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 15px 20px;
    background-color: #003366;
    color: white;
}

.panel-header h2 {
    margin: 0;
    font-size: 1.4rem;
}

.close-btn {
    background: none;
    border: none;
    color: white;
    font-size: 24px;
    cursor: pointer;
    padding: 0;
    line-height: 1;
}

.collaborative-space {
    padding: 0;
    background-color: white;
}

/* Ajuste para o conteúdo das tabs no painel */
.feedback-panel .tab-content {
    max-height: calc(100vh - 120px);
    overflow-y: auto;
}

/* Overlay para quando o painel estiver aberto */
.panel-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    z-index: 999;
    display: none;
}

.panel-overlay.active {
    display: block;
}









@media (max-width: 420px) {
    /* Ajustes para telas menores que 768px (tablets e celulares) */

    header {
        flex-direction: row;
        /* Coloca os elementos do header em coluna */
        align-items: center;
        /* Centraliza os itens */
        padding: 10px;
        /* Reduz o padding */
    }

    header h1 {
        font-size: 1.8vw;
        /* Reduz o tamanho da fonte do título */
        margin: 0;
        /* Ajusta as margens */
    }
    p {
        font-weight: normal; /* Remove o negrito em telas menores */
        font-size: 2vw;
    }
    h2 {
        font-size: 5vw;
             /* Reduz o tamanho da fonte do subtítulo */
        margin: 10px 0;
        /* Ajusta as margens */
    }
   
    .info-section .link-indicator {
        display: flex;
        justify-content: center;
        align-items: center;
        width: 35%;
        padding: 2px;
        font-size: 0.3rem; /* Reduce o tamanho da fonte */
        margin-top: 5px;
    }
    .info-section .link-indicator img {
        height: 15px;
        width: 15px;
        margin-right: 3px;
    }
    .submit-btn {
        font-size: 1vw;
        /* Reduz o tamanho da fonte do botão */
        margin: 5px 0;
        /* Ajusta as margens */
    }
    .submit-btn {
        font-size: 2.5vw;
        /* Reduz o tamanho da fonte do botão */
        margin: 5px 0;
        /* Ajusta as margens */
    }
    #nome, #email {
        font-size: 2.5vw;
        /* Reduz o tamanho da fonte dos campos de texto */
        margin: 10px 0;
        /* Ajusta as margens */
    }
    .info-section h4 {
        font-size: 2.5vw;
        /* Reduz o tamanho da fonte do subtítulo */
        margin: 10px 0;
        /* Ajusta as margens */
    }
    header.header-hidden {
        transform: translateY(-120%);
         transition: transform 0.3s ease;
    }
    .header-img,
    .header-img-right {
        max-height: 20px;
        /* Reduz o tamanho das imagens do header */
        margin: 0;
        /* Reduz as margens das imagens */
    }

    .header-img-right {
        margin-right: 5px;
    }

    main {
        margin-top: 180px;
        /* Aumenta a margem superior do main */
        padding: 10px;
        /* Reduz o padding do main */
    }

    .info-section {
        margin: 10px 5%;
        /* Reduz as margens da seção de informações */
        max-width: 100%;
        /* Garante que a seção ocupe toda a largura */
    }

    .cards-section {
        flex-direction: column;
        /* Coloca os cards em coluna */
        align-items: center;
        /* Centraliza os cards */
    }

    .card {
        width: 90%;
        /* Ajusta a largura dos cards */
        margin: 10px 0;
        /* Ajusta as margens dos cards */
    }

    ul {
        flex-direction: column;
        /* Coloca os itens da lista em coluna */
        padding: 5px;
        /* Reduz o padding da lista */
    }

    li {
        padding: 10px;
        /* Reduz o padding */
        font-size: 0.5vw;
        /* Reduz o tamanho da fonte */
        flex: 1 1 100%;
        /* Garante que ocupem a largura total */
    }
    .rating-numbers {
        display: grid;
        grid-template-columns: repeat(5, 1fr); /* 5 colunas, cada uma ocupando o mesmo espaço */
        gap: 8px;
        margin: 10px auto;
        align-items: center;
        justify-items: center;
    }
    .rating-btn {
        width: 100%;
        font-size: 4vw; /* ajuste conforme necessário */
    }
    .expand-indicator {
        font-size: 2vw; /* Diminui a fonte */
        padding: 6px 8px;  /* Reduz o preenchimento */
        border-radius: 3px; /* Opcional: ajusta a borda */
    }

    .show-more {
        padding: 8px 12px;
        /* Reduz o padding */
        font-size: 0.9rem;
        /* Reduz o tamanho da fonte */
    }
}

@media (max-width: 768px) {
    /* Ajustes para telas menores que 768px (tablets e celulares) */

    header {
        flex-direction: column;
        /* Coloca os elementos do header em coluna */
        align-items: center;
        /* Centraliza os itens */
        padding: 10px;
        /* Reduz o padding */
    }

    header h1 {
        font-size: 2.0rem;
        /* Reduz o tamanho da fonte do título */
        margin: 10px 0;
        /* Ajusta as margens */
    }
    p {
        font-weight: normal; /* Remove o negrito em telas menores */
       
    }

    .header-img,
    .header-img-right {
        max-height: 60px;
        /* Reduz o tamanho das imagens do header */
        margin: 5px;
        /* Reduz as margens das imagens */
    }

    .header-img-right {
        margin-right: 5px;
    }

    main {
        margin-top: 150px;
        /* Aumenta a margem superior do main */
        padding: 10px;
        /* Reduz o padding do main */
    }

    .info-section {
        margin: 10px 5%;
        /* Reduz as margens da seção de informações */
        max-width: 100%;
        /* Garante que a seção ocupe toda a largura */
    }

    .cards-section {
        flex-direction: column;
        /* Coloca os cards em coluna */
        align-items: center;
        /* Centraliza os cards */
    }

    .card {
        width: 90%;
        /* Ajusta a largura dos cards */
        margin: 10px 0;
        /* Ajusta as margens dos cards */
    }
    .popup-content {
        max-width: 300px;
    }

    ul {
        flex-direction: column;
        /* Coloca os itens da lista em coluna */
        padding: 5px;
        /* Reduz o padding da lista */
    }

    li {
        padding: 10px;
        /* Reduz o padding */
        font-size: 0.9rem;
        /* Reduz o tamanho da fonte */
        flex: 1 1 100%;
        /* Garante que ocupem a largura total */
    }

    .show-more {
        padding: 8px 12px;
        /* Reduz o padding */
        font-size: 0.9rem;
        /* Reduz o tamanho da fonte */
    }
}

@media (max-width: 480px) {

    /* Ajustes para telas menores que 480px (celulares menores) */
    header h1 {
        font-size: 0.95rem;
        /* Reduz ainda mais o tamanho da fonte do título */
    }
    h2 {
        font-size: 5vw;
        /* Reduz o tamanho da fonte do subtítulo */
        margin: 10px 0;
        /* Ajusta as margens */
    }
    .info-section .link-indicator {
        display: flex;
        justify-content: center;
        align-items: center;
        width: 35%;
        padding: 4.9px;
        font-size: 0.4rem; /* Reduce o tamanho da fonte */
        margin-top: 5px;
    }
    .info-section .link-indicator img {
        height: 15px;
        width: 15px;
        margin-right: 3px;
    }
    .info-section h4 {
        font-size: 2.4vw;
        /* Reduz o tamanho da fonte do subtítulo */
        margin: 10px 0;
        /* Ajusta as margens */
    }

    .header-img,
    .header-img-right {
        max-height: 20px;/* Reduz ainda mais o tamanho das imagens do header */
        margin: 0;
    }

    main {
        margin-top: 100px;

    }

    .info-section {
        max-width: 100%;
    }
    p {
        font-size: 0.8rem;
    }

    li {
        padding: 8px;
        /* Reduz ainda mais o padding */
        font-size: 0.6rem;
        /* Reduz ainda mais o tamanho da fonte */
    }
    .expand-indicator {
        font-size: 2vw; /* Diminui a fonte */
        padding: 6px 8px;  /* Reduz o preenchimento */
        border-radius: 3px; /* Opcional: ajusta a borda */
    }


    .show-more {
        padding: 6px 10px;
        /* Reduz ainda mais o padding */
        font-size: 0.85rem;
        /* Reduz ainda mais o tamanho da fonte */
    }
    #survey-trigger {
        bottom: 40px;
        right: 5px;
        padding: 5px 10px;  /* Reduz o padding */
        transform: rotate(90deg) scale(0.8);  /* Reduz a escala */
        font-size: 0.8rem;  /* Opcional: ajusta o tamanho da fonte, se necessário */
    }
}
/* Responsivo */
@media (max-width: 600px) {
    .accordion-header {
        font-size: 0.85rem;
        padding: 14px 16px;
    }

    .accordion-body {
        padding: 14px 16px;
        font-size: 0.7rem;
    }

    .steps, .examples {
        flex-basis: 100%;
    }
    #promptSection h2 {
        font-size: 1.2rem;
    }
    #promptSection p {
        font-size: 0.9rem;
    }
    #promptSection a {
        font-size: 0.85rem;
    }
}

@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(20px);
    }

    to {
        opacity: 1;
    }
}

@keyframes slideIn {
    from {
        opacity: 0;
        transform: translateX(-100%);
    }

    to {
        opacity: 1;
        transform: translateX(0);
    }
}

@keyframes fadeOut {
    from {
        opacity: 1;
    }

    to {
        opacity: 0;
    }
}

@keyframes pulse {
    0% {
        transform: scale(1);
    }

    50% {
        transform: scale(1.05);
    }

    100% {
        transform: scale(1);
    }
}





@media screen and (max-width: 768px) {
    .main-navigation-bar {
        padding: 8px 0;
    }
    
    .main-navigation-bar a {
        padding: 6px 12px;
        margin: 0 3px;
        font-size: 13px;
    }
}

/* Smartphones */
@media screen and (max-width: 480px) {
    .main-navigation-bar {
        padding: 6px 0;
        overflow-x: auto;
        white-space: nowrap;
    }
    
    .main-navigation-bar a {
        padding: 5px 8px;
        margin: 0 2px;
        font-size: 8px;
    }
}

/* Smartphones pequenos */
@media screen and (max-width: 360px) {
    .main-navigation-bar {
        padding: 5px 0;
    }
    
    .main-navigation-bar a {
        padding: 4px 6px;
        margin: 0 1px;
        font-size: 7px;
    }
}


/* Responsividade */
@media screen and (max-width: 768px) {
    .tabs {
        flex-direction: column;
    }
    
    .tab-btn {
        padding: 10px;
    }
    
    .tab-content {
        padding: 15px;
    }
}


/* Responsividade para o painel */
@media screen and (max-width: 480px) {
    .feedback-panel {
        width: 100%;
        right: -100%;
    }
}
