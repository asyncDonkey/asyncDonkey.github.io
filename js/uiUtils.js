/**
 * Restituisce l'HTML per l'icona autore se l'utente ha pubblicato articoli.
 * @param {object} userPublicProfile - L'oggetto userPublicProfile dell'utente.
 * @returns {string} L'HTML dell'icona o una stringa vuota.
 */
export function getAuthorIconHTML(userPublicProfile) {
    if (userPublicProfile && userPublicProfile.hasPublishedArticles === true) {
        return '<span class="material-symbols-rounded nickname-author-icon" title="Autore">school</span>';
    }
    return '';
}

/**
 * Crea e mostra una modale informativa generica e non interattiva.
 * @param {string} title - Il titolo da mostrare nell'header della modale.
 * @param {string} contentHtml - L'HTML da inserire nel corpo della modale.
 */
export function showInfoModal(title, contentHtml) {
    // Rimuove una modale precedente se esiste, per evitare duplicati
    const existingModal = document.getElementById('genericInfoModal');
    if (existingModal) {
        existingModal.remove();
    }

    // Crea la struttura della modale
    const modalOverlay = document.createElement('div');
    modalOverlay.id = 'genericInfoModal';
    modalOverlay.className = 'modal info-modal'; // Aggiungiamo una classe specifica
    modalOverlay.style.display = 'flex'; // Usiamo flex per centrare

    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';

    const modalHeader = document.createElement('div');
    modalHeader.className = 'modal-header';
    const modalTitle = document.createElement('h3');
    modalTitle.textContent = title;
    const closeModalBtn = document.createElement('span');
    closeModalBtn.className = 'close-modal-btn';
    closeModalBtn.innerHTML = '&times;';
    closeModalBtn.title = 'Chiudi';
    modalHeader.appendChild(modalTitle);
    modalHeader.appendChild(closeModalBtn);

    const modalBody = document.createElement('div');
    modalBody.className = 'modal-body';
    modalBody.innerHTML = contentHtml;

    modalContent.appendChild(modalHeader);
    modalContent.appendChild(modalBody);
    modalOverlay.appendChild(modalContent);
    document.body.appendChild(modalOverlay);

    // Funzione per chiudere la modale
    const closeModal = () => {
        modalOverlay.style.display = 'none';
        modalOverlay.remove(); // Rimuove l'elemento dal DOM per pulizia
    };

    // Aggiungi event listener per chiudere
    closeModalBtn.addEventListener('click', closeModal);
    modalOverlay.addEventListener('click', (event) => {
        if (event.target === modalOverlay) {
            closeModal();
        }
    });
}

// AthenaDev - Utility UI per icone e altro.
