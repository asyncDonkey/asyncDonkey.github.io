/**
 * Abilita la funzionalità di carosello "grab-and-drag" per un elemento contenitore.
 * @param {HTMLElement} container - L'elemento HTML che contiene gli item del carosello.
 */
export function setupDraggableCarousel(container) {
    if (!container) return;
    let isDown = false;
    let startX;
    let scrollLeft;

    container.addEventListener('mousedown', (e) => {
        // Prevenire il drag se il click è su un pulsante o link dentro la card
        if (e.target.closest('button, a')) {
            return;
        }
        isDown = true;
        container.classList.add('active-carousel');
        startX = e.pageX - container.offsetLeft;
        scrollLeft = container.scrollLeft;
        // Impedire la selezione del testo durante il trascinamento
        container.style.userSelect = 'none'; 
    });

    container.addEventListener('mouseleave', () => {
        if (isDown) { // Solo se il mouse era premuto
            isDown = false;
            container.classList.remove('active-carousel');
            container.style.userSelect = 'auto'; // Ripristina la selezione del testo
        }
    });

    container.addEventListener('mouseup', () => {
        if (isDown) { // Solo se il mouse era premuto
            isDown = false;
            container.classList.remove('active-carousel');
            container.style.userSelect = 'auto'; // Ripristina la selezione del testo
        }
    });

    container.addEventListener('mousemove', (e) => {
        if (!isDown) return;
        e.preventDefault(); // Previene altri comportamenti di default durante il drag
        const x = e.pageX - container.offsetLeft;
        const walk = (x - startX) * 2; // Il moltiplicatore *2 accelera lo scroll
        container.scrollLeft = scrollLeft - walk;
    });

    // Aggiunta per migliorare l'accessibilità e il comportamento su mobile
    container.style.cursor = 'grab';
    container.addEventListener('mousedown', () => {
        if (isDown) container.style.cursor = 'grabbing';
    });
    container.addEventListener('mouseup', () => {
        container.style.cursor = 'grab';
    });
     // Supporto base per eventi touch (semplificato)
    container.addEventListener('touchstart', (e) => {
        if (e.target.closest('button, a')) return;
        isDown = true;
        startX = e.touches[0].pageX - container.offsetLeft;
        scrollLeft = container.scrollLeft;
        container.style.userSelect = 'none';
    }, { passive: true }); // Passive true per performance scroll

    container.addEventListener('touchend', () => {
        isDown = false;
        container.style.userSelect = 'auto';
    });

    container.addEventListener('touchmove', (e) => {
        if (!isDown) return;
        // Non chiamare e.preventDefault() qui a meno che non sia strettamente necessario
        // e dopo aver testato, perché può interferire con lo scroll nativo
        const x = e.touches[0].pageX - container.offsetLeft;
        const walk = (x - startX) * 2;
        container.scrollLeft = scrollLeft - walk;
    }, { passive: false }); // Passive false se si usa preventDefault

}