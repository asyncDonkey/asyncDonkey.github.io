// Contenuto per il NUOVO file: AD/js/uiUtils.js

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

// AthenaDev - Utility UI per icone e altro.