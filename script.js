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
    });

    window.addEventListener('scroll', function() {
        if (window.scrollY > 50) {
            header.classList.add('header-hidden');
        } else {
            header.classList.remove('header-hidden');
        }
    });

    // Adiciona o código para alternar a classe 'expanded' nos itens da lista
    const listItems = document.querySelectorAll('li');

    listItems.forEach(item => {
        item.addEventListener('click', function() {
            this.classList.toggle('expanded');
        });
    });

    // Adiciona o código para alternar a visibilidade do conteúdo adicional
    const buttons = document.querySelectorAll('.show-more');
    
    buttons.forEach(button => {
        button.addEventListener('click', function(event) {
            event.stopPropagation(); // Impede que o clique no botão afete o item da lista
            const moreContent = this.previousElementSibling;
            const listItem = this.closest('li');
            if (moreContent.style.display === 'none' || moreContent.style.display === '') {
                moreContent.style.display = 'block';
                this.textContent = 'Mostrar menos';
                listItem.classList.add('expanded');
            } else {
                moreContent.style.display = 'none';
                this.textContent = 'Mostrar mais';
                listItem.classList.remove('expanded');
            }
        });
    });
});