// js/adminDashboard.js
import { db, auth } from './main.js';
import {
    collection, query, where, getDocs, doc, getDoc, updateDoc, serverTimestamp, orderBy // orderBy è stato aggiunto qui
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const adminAuthMessageDiv = document.getElementById('adminAuthMessage');
const adminDashboardContentDiv = document.getElementById('adminDashboardContent');
const pendingArticlesListDiv = document.getElementById('pendingArticlesList');

// Elementi modale modifica articolo
const editArticleModal = document.getElementById('editArticleModal');
const closeEditArticleModalBtn = document.getElementById('closeEditArticleModalBtn');
const editArticleForm = document.getElementById('editArticleForm');
const editingArticleIdInput = document.getElementById('editingArticleId');
const editArticleTitleInput = document.getElementById('editArticleTitle');
const editArticleContentTextarea = document.getElementById('editArticleContent'); // Textarea per EasyMDE
const editArticleTagsInput = document.getElementById('editArticleTags');
const editArticleSnippetInput = document.getElementById('editArticleSnippet');
const editArticleCoverImageUrlInput = document.getElementById('editArticleCoverImageUrl');
// Aggiungi qui altri input della modale se necessario, es. per isFeatured
// const editArticleIsFeaturedCheckbox = document.getElementById('editArticleIsFeatured');


let easyMDEEditInstance = null; // Istanza EasyMDE per la modale di modifica

/**
 * Inizializza l'editor EasyMDE per la modale di modifica articolo.
 * Lo crea se non esiste, altrimenti si assicura che il contenuto sia aggiornato.
 */
function initializeOrUpdateEditMarkdownEditor(content = '') {
    if (editArticleContentTextarea) {
        if (!easyMDEEditInstance) {
            try {
                easyMDEEditInstance = new EasyMDE({
                    element: editArticleContentTextarea,
                    initialValue: content,
                    spellChecker: false,
                    placeholder: "Contenuto dell'articolo in Markdown...",
                    toolbar: [
                        "bold", "italic", "heading", "|", 
                        "quote", "unordered-list", "ordered-list", "|",
                        "link", "image", "code", "horizontal-rule", "|",
                        "preview", "side-by-side", "fullscreen", "|",
                        "guide"
                    ],
                    // Potresti voler disabilitare l'autosave qui o dargli un ID specifico per la modifica
                    autosave: {
                        enabled: false, // Disabilitato per la modale di modifica per semplicità iniziale
                        // uniqueId: "adminEditArticle_" + editingArticleIdInput.value, 
                        // delay: 10000,
                    },
                });
                console.log("EasyMDE per modifica articolo inizializzato.");
            } catch (e) {
                console.error("Errore inizializzazione EasyMDE per modifica:", e);
                editArticleContentTextarea.value = content; // Fallback al textarea semplice
            }
        } else {
            // Se l'istanza esiste già, aggiorna semplicemente il suo valore
            easyMDEEditInstance.value(content);
            console.log("EasyMDE per modifica articolo: contenuto aggiornato.");
        }
    } else {
        console.error("Textarea per EasyMDE (editArticleContent) non trovato nella modale.");
    }
}

/**
 * Rimuove l'istanza di EasyMDE e ripristina il textarea originale.
 */
function destroyEditMarkdownEditor() {
    if (easyMDEEditInstance) {
        try {
            easyMDEEditInstance.toTextArea();
            easyMDEEditInstance = null;
            console.log("EasyMDE per modifica rimosso.");
        } catch (e) {
            console.error("Errore rimozione EasyMDE per modifica:", e);
        }
    }
    // Pulisci il textarea manualmente dopo aver rimosso EasyMDE
    if (editArticleContentTextarea) {
        editArticleContentTextarea.value = '';
    }
}

/**
 * Controlla i permessi dell'utente corrente.
 * Mostra la dashboard se l'utente è admin, altrimenti un messaggio di accesso negato.
 */
async function checkAdminPermissions() {
    const user = auth.currentUser;
    if (user) {
        try {
            const userProfileRef = doc(db, "userProfiles", user.uid);
            const docSnap = await getDoc(userProfileRef);
            if (docSnap.exists() && docSnap.data().isAdmin === true) {
                if (adminAuthMessageDiv) adminAuthMessageDiv.style.display = 'none';
                if (adminDashboardContentDiv) adminDashboardContentDiv.style.display = 'block';
                loadPendingArticles();
                // Qui potresti caricare altre sezioni della dashboard (es. articoli pubblicati, issue)
            } else {
                if (adminAuthMessageDiv) adminAuthMessageDiv.innerHTML = '<p>Accesso negato. Devi essere un amministratore per visualizzare questa pagina. <a href="index.html">Torna alla Home</a></p>';
                if (adminDashboardContentDiv) adminDashboardContentDiv.style.display = 'none';
            }
        } catch (error) {
            console.error("Errore verifica permessi admin:", error);
            if (adminAuthMessageDiv) adminAuthMessageDiv.innerHTML = '<p>Errore durante la verifica dei permessi. Riprova. <a href="index.html">Torna alla Home</a></p>';
            if (adminDashboardContentDiv) adminDashboardContentDiv.style.display = 'none';
        }
    } else {
        if (adminAuthMessageDiv) {
            adminAuthMessageDiv.innerHTML = '<p>Devi essere <a href="#" id="loginLinkFromAdminPage">loggato</a> come amministratore per accedere. <a href="index.html">Torna alla Home</a></p>';
            const loginLink = document.getElementById('loginLinkFromAdminPage');
            if (loginLink) {
                loginLink.addEventListener('click', (e) => {
                    e.preventDefault();
                    // Tenta di triggerare la modale di login globale (se esiste in main.js e la pagina la include)
                    const showLoginBtnGlobal = document.getElementById('showLoginBtn');
                    if (showLoginBtnGlobal) {
                        showLoginBtnGlobal.click();
                    } else {
                        console.warn("Bottone login globale non trovato per triggerare la modale.");
                        // Fallback: reindirizza alla home dove l'utente può loggarsi
                        // window.location.href = 'index.html';
                    }
                });
            }
        }
        if (adminDashboardContentDiv) adminDashboardContentDiv.style.display = 'none';
    }
}

/**
 * Carica e visualizza gli articoli con status "pendingReview".
 */
async function loadPendingArticles() {
    if (!pendingArticlesListDiv) {
        console.warn("Elemento pendingArticlesListDiv non trovato. Impossibile caricare articoli.");
        return;
    }
    pendingArticlesListDiv.innerHTML = '<p>Caricamento articoli in attesa di revisione...</p>';
    try {
        const articlesRef = collection(db, "articles");
        const q = query(articlesRef, where("status", "==", "pendingReview"), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            pendingArticlesListDiv.innerHTML = '<p>Nessun articolo in attesa di revisione al momento.</p>';
            return;
        }

        pendingArticlesListDiv.innerHTML = ''; // Pulisci la lista
        querySnapshot.forEach((docSnapshot) => { // Rinominato doc in docSnapshot per chiarezza
            const article = docSnapshot.data();
            const articleId = docSnapshot.id;
            const itemDiv = document.createElement('div');
            itemDiv.classList.add('article-list-item');
            const creationDate = article.createdAt?.toDate ? article.createdAt.toDate().toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A';
            itemDiv.innerHTML = `
                <span class="article-info">
                    <strong>${article.title || 'Titolo mancante'}</strong><br>
                    <small>Autore: ${article.authorName || article.authorId} | Inviato: ${creationDate}</small>
                </span>
                <span class="actions">
                    <button class="game-button view-edit-btn" data-id="${articleId}">Visualizza/Modifica</button>
                    <button class="game-button approve-btn" data-id="${articleId}" style="background-color: var(--game-border-color); color: white;">Approva</button>
                    <button class="game-button reject-btn" data-id="${articleId}" style="background-color: #dc3545; color: white;">Respingi</button>
                </span>
            `;
            pendingArticlesListDiv.appendChild(itemDiv);
        });

        addEventListenersToAdminButtons();

    } catch (error) {
        console.error("Errore caricamento articoli pending:", error);
        pendingArticlesListDiv.innerHTML = '<p>Errore nel caricamento degli articoli in attesa. Controlla la console.</p>';
    }
}

/**
 * Aggiunge gli event listener ai pulsanti di azione per ogni articolo nella lista admin.
 */
function addEventListenersToAdminButtons() {
    document.querySelectorAll('.view-edit-btn').forEach(button => {
        button.removeEventListener('click', handleViewEditClick); // Rimuovi vecchi listener
        button.addEventListener('click', handleViewEditClick);
    });
    document.querySelectorAll('.approve-btn').forEach(button => {
        button.removeEventListener('click', handleApproveClick);
        button.addEventListener('click', handleApproveClick);
    });
    document.querySelectorAll('.reject-btn').forEach(button => {
        button.removeEventListener('click', handleRejectClick);
        button.addEventListener('click', handleRejectClick);
    });
}
// Definisci le funzioni handler fuori da addEventListenersToAdminButtons per poterle rimuovere
async function handleViewEditClick(e) {
    const articleId = e.target.dataset.id;
    await openEditArticleModal(articleId);
}
async function handleApproveClick(e) {
    const articleId = e.target.dataset.id;
    await approveArticle(articleId);
}
async function handleRejectClick(e) {
    const articleId = e.target.dataset.id;
    await rejectArticle(articleId);
}


/**
 * Apre la modale per modificare un articolo, popolandola con i dati dell'articolo.
 * @param {string} articleId - L'ID dell'articolo da modificare.
 */
async function openEditArticleModal(articleId) {
    if (!editArticleModal || !editingArticleIdInput || !editArticleTitleInput || !editArticleContentTextarea || !editArticleTagsInput || !editArticleSnippetInput || !editArticleCoverImageUrlInput) {
        console.error("Elementi della modale di modifica non trovati.");
        return;
    }
    
    const articleRef = doc(db, "articles", articleId);
    try {
        const docSnap = await getDoc(articleRef);
        if (docSnap.exists()) {
            const articleData = docSnap.data();
            editingArticleIdInput.value = articleId;
            editArticleTitleInput.value = articleData.title || '';
            
            // Inizializza o aggiorna EasyMDE con il contenuto
            initializeOrUpdateEditMarkdownEditor(articleData.contentMarkdown || '');
            
            editArticleTagsInput.value = (articleData.tags || []).join(', ');
            editArticleSnippetInput.value = articleData.snippet || '';
            editArticleCoverImageUrlInput.value = articleData.coverImageUrl || '';
            // if (editArticleIsFeaturedCheckbox) {
            // editArticleIsFeaturedCheckbox.checked = articleData.isFeatured || false;
            // }
            
            if(document.getElementById('editArticleModalTitle')) { // Verifica esistenza prima di usarlo
                 document.getElementById('editArticleModalTitle').textContent = `Modifica: ${articleData.title || 'Articolo senza titolo'}`;
            }
            editArticleModal.style.display = 'block';
        } else {
            alert("Articolo non trovato per la modifica.");
        }
    } catch (error) {
        console.error("Errore apertura modale modifica articolo:", error);
        alert("Errore durante il caricamento dei dati dell'articolo per la modifica.");
    }
}

/**
 * Chiude la modale di modifica articolo e pulisce l'editor.
 */
function closeEditModal() {
    if(editArticleModal) editArticleModal.style.display = 'none';
    destroyEditMarkdownEditor(); // Rimuovi EasyMDE e pulisci textarea
    if(editArticleForm) editArticleForm.reset(); // Resetta gli altri campi del form
    if(editingArticleIdInput) editingArticleIdInput.value = ''; // Pulisci ID articolo
}

/**
 * Approva un articolo, cambiando il suo status a "published" e impostando "publishedAt".
 * @param {string} articleId - L'ID dell'articolo da approvare.
 */
async function approveArticle(articleId) {
    if (!confirm(`Sei sicuro di voler approvare e pubblicare l'articolo ID: ${articleId}?`)) return;
    try {
        const articleRef = doc(db, "articles", articleId);
        await updateDoc(articleRef, {
            status: "published",
            publishedAt: serverTimestamp(),
            updatedAt: serverTimestamp() // Aggiorna anche updatedAt per coerenza
        });
        alert("Articolo approvato e pubblicato con successo!");
        loadPendingArticles(); // Ricarica la lista degli articoli in attesa
    } catch (error) {
        console.error("Errore durante l'approvazione dell'articolo:", error);
        alert("Si è verificato un errore durante l'approvazione dell'articolo.");
    }
}

/**
 * Respinge un articolo, cambiando il suo status a "rejected".
 * @param {string} articleId - L'ID dell'articolo da respingere.
 */
async function rejectArticle(articleId) {
    if (!confirm(`Sei sicuro di voler respingere l'articolo ID: ${articleId}? Lo status diventerà 'rejected'.`)) return;
    try {
        const articleRef = doc(db, "articles", articleId);
        await updateDoc(articleRef, {
            status: "rejected",
            updatedAt: serverTimestamp()
        });
        alert("Articolo respinto.");
        loadPendingArticles(); // Ricarica la lista
    } catch (error) {
        console.error("Errore nel respingere l'articolo:", error);
        alert("Si è verificato un errore durante il rigetto dell'articolo.");
    }
}

// --- Event Listener Iniziali ---
document.addEventListener('DOMContentLoaded', () => {
    // La chiamata a checkAdminPermissions() verrà fatta da onAuthStateChanged
    // per assicurare che lo stato utente sia definito.

    if (closeEditArticleModalBtn) {
        closeEditArticleModalBtn.addEventListener('click', closeEditModal);
    }
    if (editArticleModal) {
        editArticleModal.addEventListener('click', (event) => {
            if (event.target === editArticleModal) {
                closeEditModal();
            }
        });
    }
    if(editArticleForm) {
        editArticleForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const articleId = editingArticleIdInput.value;
            if (!articleId) {
                alert("ID articolo mancante. Impossibile salvare le modifiche.");
                return;
            }

            const updatedTitle = editArticleTitleInput.value.trim();
            const updatedContentMarkdown = easyMDEEditInstance ? easyMDEEditInstance.value() : editArticleContentTextarea.value.trim();
            
            if (!updatedTitle || !updatedContentMarkdown) {
                alert("Titolo e Contenuto sono obbligatori.");
                return;
            }

            const updates = {
                title: updatedTitle,
                contentMarkdown: updatedContentMarkdown,
                tags: editArticleTagsInput.value.trim() ? editArticleTagsInput.value.trim().split(',').map(tag => tag.trim()).filter(tag => tag) : [],
                snippet: editArticleSnippetInput.value.trim(),
                coverImageUrl: editArticleCoverImageUrlInput.value.trim() ? editArticleCoverImageUrlInput.value.trim() : null,
                // isFeatured: editArticleIsFeaturedCheckbox ? editArticleIsFeaturedCheckbox.checked : false,
                updatedAt: serverTimestamp()
                // Lo status non viene modificato qui; si usano i pulsanti "Approva" o "Respingi".
            };

            try {
                const articleRef = doc(db, "articles", articleId);
                await updateDoc(articleRef, updates);
                alert("Articolo modificato con successo!");
                closeEditModal();
                loadPendingArticles(); // Ricarica la lista per riflettere le modifiche (se era un pending)
                                      // o la lista appropriata se l'articolo era già pubblicato
            } catch (error) {
                console.error("Errore salvataggio modifiche articolo admin:", error);
                alert("Errore durante il salvataggio delle modifiche dell'articolo.");
            }
        });
    }
});

// Listener per lo stato di autenticazione
onAuthStateChanged(auth, (user) => {
    console.log("adminDashboard.js - Auth state changed. User:", user ? user.uid : "null");
    checkAdminPermissions(); // Controlla i permessi ogni volta che lo stato auth cambia
});
