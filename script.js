document.addEventListener('DOMContentLoaded', function() {
    // Garante que o código seja executado somente após o DOM (estrutura HTML) estar completamente carregado.

    const header = document.querySelector('header');
    // Seleciona o elemento <header> do documento.

    if (!header) return;
    // Se não houver um elemento <header>, a função é encerrada.

    let lastScrollY = window.scrollY;
    // Armazena a posição vertical inicial da barra de rolagem.

    let ticking = false;
    // Variável para controlar se a função onScroll está em execução (para otimizar o desempenho).

    function onScroll() {
        // Função chamada quando a barra de rolagem é movida.
        if (window.scrollY > lastScrollY) {
            // Se a posição atual da barra de rolagem for maior que a anterior (rolando para baixo)...
            header.classList.add('header-small');
            // ...adiciona a classe 'header-small' ao <header>, provavelmente para reduzir seu tamanho.
        } else {
            // Caso contrário (rolando para cima)...
            header.classList.remove('header-small');
            // ...remove a classe 'header-small' do <header>, restaurando seu tamanho original.
        }
        lastScrollY = window.scrollY;
        // Atualiza a posição anterior da barra de rolagem.
        ticking = false;
        // Permite que a função onScroll seja executada novamente.
    }

    window.addEventListener('scroll', function() {
        // Adiciona um ouvinte de evento para o evento 'scroll' na janela.
        if (!ticking) {
            // Se a função onScroll não estiver em execução...
            window.requestAnimationFrame(onScroll);
            // ...agenda a execução da função onScroll no próximo quadro de animação (otimização).
            ticking = true;
            // Indica que a função onScroll está em execução.
        }
        if (window.scrollY > 50) {
            // Se a posição da barra de rolagem for maior que 50 pixels...
            header.classList.add('header-hidden');
            // ...adiciona a classe 'header-hidden' ao <header>, provavelmente para ocultá-lo.
        } else {
            // Caso contrário...
            header.classList.remove('header-hidden');
            // ...remove a classe 'header-hidden' do <header>, exibindo-o novamente.
        }
    });

    const boasPraticasSection = document.getElementById('boasPraticasSection');
    const boasPraticasTitle = boasPraticasSection.querySelector('h2');
    const boasPraticasList = boasPraticasSection.querySelector('.boas-praticas-list');
    const expandIndicator = boasPraticasSection.querySelector('.expand-indicator');
    const boasPraticasItems = boasPraticasList.querySelectorAll('li');

    boasPraticasList.classList.add('hidden');

    boasPraticasTitle.addEventListener('click', function() {
        boasPraticasList.classList.toggle('hidden');
        boasPraticasList.classList.toggle('expanded');

        if (boasPraticasList.classList.contains('hidden')) {
            expandIndicator.textContent = "Saiba Mais";
            boasPraticasItems.forEach(item => item.classList.add('hidden')); // Oculta os itens <li>
        } else {
            expandIndicator.textContent = "Saiba Menos";
            boasPraticasItems.forEach(item => item.classList.remove('hidden')); // Exibe os itens <li>
        }
    });

    // Pop-up com a mensagem e link para o PDF
    const popup = document.getElementById('popup');
    const okButton = document.getElementById('ok-btn');
    const pdfLink = document.getElementById('pdf-link');

    popup.style.display = 'flex';

    okButton.addEventListener('click', function() {
        popup.style.display = 'none';
        document.body.style.overflow = 'auto';
    });

    pdfLink.addEventListener('click', function() {
        window.open('./materia.pdf', '_blank');
    });

    if (popup.style.display === 'flex') {
        document.body.style.overflow = 'hidden';
    }
});