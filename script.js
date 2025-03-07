document.addEventListener('DOMContentLoaded', function() {
    const header = document.querySelector('header');
    if (!header) return;

    let lastScrollY = window.scrollY;
    let ticking = false;

    function onScroll() {
        if (window.scrollY > lastScrollY) {
            header.classList.add('header-small');
        } else {
            header.classList.remove('header-small');
        }
        lastScrollY = window.scrollY;
        ticking = false;
    }

    window.addEventListener('scroll', function() {
        if (!ticking) {
            window.requestAnimationFrame(onScroll);
            ticking = true;
        }
        if (window.scrollY > 50) {
            header.classList.add('header-hidden');
        } else {
            header.classList.remove('header-hidden');
        }
    });

    const listItems = document.querySelectorAll('li');
    listItems.forEach(item => {
        item.addEventListener('click', function() {
            this.classList.toggle('expanded');
        });
    });

    const boasPraticasSection = document.getElementById('boasPraticasSection');
    const boasPraticasTitle = boasPraticasSection.querySelector('h2');
    const boasPraticasList = boasPraticasSection.querySelector('.boas-praticas-list');
    const expandIndicator = boasPraticasSection.querySelector('.expand-indicator');
    const boasPraticasItems = boasPraticasList.querySelectorAll('li');

    // Inicia a lista de boas práticas como fechada
    boasPraticasList.classList.add('hidden');
    boasPraticasItems.forEach(item => {
        item.classList.add('hidden'); // As li começam fechadas
    });

    boasPraticasTitle.addEventListener('click', function() {
        boasPraticasList.classList.toggle('hidden');
        boasPraticasList.classList.toggle('expanded');

        if (boasPraticasList.classList.contains('hidden')) {
            expandIndicator.textContent = "Saiba Mais";
            boasPraticasItems.forEach(item => {
                item.classList.remove('expanded'); // Remove a expansão de cada li ao recolher
            });
        } else {
            expandIndicator.textContent = "Recolher";
            boasPraticasItems.forEach(item => {
                item.classList.add('expanded'); // Adiciona a classe expanded em cada li
                item.classList.remove('hidden'); // Exibe os itens das li
            });
        }
    });

    // Pop-up com a mensagem e link para o PDF
    const popup = document.getElementById('popup');
    const okButton = document.getElementById('ok-btn');  // Botão OK
    const pdfLink = document.getElementById('pdf-link'); // Link para o PDF

    // Exibe o pop-up assim que a página carrega
    popup.style.display = 'flex';

    // Quando o botão "OK" for clicado, esconde o pop-up e remove a rolagem da página
    okButton.addEventListener('click', function() {
        popup.style.display = 'none'; // Fecha o pop-up
        document.body.style.overflow = 'auto'; // Restaura a rolagem da página
    });

    // Quando o link do PDF for clicado, abre o PDF em uma nova aba
    pdfLink.addEventListener('click', function() {
        window.open('./materia.pdf', '_blank'); // Substitua './materia.pdf' pelo caminho correto do seu PDF
    });

    // Quando o pop-up for exibido, desabilita a rolagem da página
    if (popup.style.display === 'flex') {
        document.body.style.overflow = 'hidden';
    }
});
