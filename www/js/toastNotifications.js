// js/toastNotifications.js

/**
 * Contenitore DOM per le notifiche toast.
 * Viene cercato una sola volta quando il modulo viene caricato.
 * @type {HTMLElement|null}
 */
const toastContainer = document.getElementById('toast-container');

if (!toastContainer) {
    console.warn(
        "Attenzione: L'elemento #toast-container non è stato trovato nel DOM. Le notifiche Toast non funzioneranno correttamente. Assicurati che sia presente nel tuo HTML."
    );
}

/**
 * Mostra una notifica toast.
 * @param {string} message - Il messaggio da visualizzare.
 * @param {string} [type='info'] - Tipo di notifica ('success', 'error', 'warning', 'info').
 * @param {number} [duration=4000] - Durata in millisecondi prima della scomparsa automatica. Se 0 o negativo, il toast rimane finché non viene chiuso manualmente.
 */
export function showToast(message, type = 'info', duration = 4000) {
    if (!toastContainer) {
        // Fallback ad alert se il contenitore non è presente
        // Questo è utile durante lo sviluppo se ci si dimentica di aggiungere il contenitore a una pagina.
        console.error('Fallback ad alert: #toast-container non trovato. Notifica:', message);
        alert(`[${type.toUpperCase()}] ${message}`);
        return;
    }

    // Crea l'elemento toast
    const toast = document.createElement('div');
    toast.className = `toast-notification ${type.toLowerCase()}`; // Assicura che type sia lowercase per la classe CSS

    // Crea lo span per il messaggio
    const messageSpan = document.createElement('span');
    messageSpan.className = 'toast-message';
    messageSpan.textContent = message;
    toast.appendChild(messageSpan);

    // Crea il pulsante di chiusura
    const closeButton = document.createElement('button');
    closeButton.className = 'toast-close-btn';
    closeButton.innerHTML = '&times;'; // Carattere 'x' (moltiplicazione) per chiudere
    closeButton.setAttribute('aria-label', 'Chiudi notifica');

    // Funzione per chiudere e rimuovere il toast
    const dismissToast = () => {
        toast.classList.remove('show');
        toast.classList.add('hide'); // Attiva l'animazione di uscita (se definita in CSS)

        // Rimuovi l'elemento dal DOM dopo l'animazione di scomparsa/transizione
        // L'evento 'transitionend' è più affidabile per le animazioni CSS
        toast.addEventListener(
            'transitionend',
            () => {
                if (toast.parentNode === toastContainer) {
                    // Controlla se è ancora figlio prima di rimuovere
                    toastContainer.removeChild(toast);
                }
            },
            { once: true }
        ); // L'event listener viene rimosso dopo essere stato eseguito una volta
    };

    closeButton.onclick = dismissToast;
    toast.appendChild(closeButton);

    // Aggiungi il toast al contenitore
    toastContainer.appendChild(toast);

    // Mostra il toast con una piccola animazione di entrata
    // Usare requestAnimationFrame o un piccolo setTimeout aiuta a garantire che la transizione CSS avvenga
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            // Doppio requestAnimationFrame per browser più pignoli
            toast.classList.add('show');
        });
    });

    // Imposta la scomparsa automatica se la durata è positiva
    if (duration > 0) {
        setTimeout(() => {
            // Verifica se il toast esiste ancora e non è già stato nascosto/rimosso
            if (toast.classList.contains('show') && toast.parentNode === toastContainer) {
                dismissToast();
            }
        }, duration);
    }
}
