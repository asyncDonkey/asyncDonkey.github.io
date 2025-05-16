// js/articleSubmission.js
import { db, auth } from './main.js';
import {
    doc,
    addDoc,
    collection,
    serverTimestamp,
    getDoc,
    updateDoc, // Aggiunto updateDoc
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';

// Riferimenti DOM (esistenti)
const articleSubmissionForm = document.getElementById('articleSubmissionForm');
const articleTitleInput = document.getElementById('articleTitle');
const articleContentTextarea = document.getElementById('articleContent');
const articleTagsInput = document.getElementById('articleTags');
const articleSnippetInput = document.getElementById('articleSnippet');
const articleCoverImageUrlInput = document.getElementById('articleCoverImageUrl');
const submitArticleForReviewBtn = document.getElementById('submitArticleForReviewBtn');
const saveArticleDraftBtn = document.getElementById('saveArticleDraftBtn');
const submissionMessageDiv = document.getElementById('submissionMessage');
const authRequiredMessageDiv = document.getElementById('authRequiredMessage');
const loginLinkFromSubmitPage = document.getElementById('loginLinkFromSubmitPage');

let currentUser = null;
let easyMDEInstance = null;
let editingDraftId = null; // NUOVA VARIABILE GLOBALE per tracciare l'ID della bozza in modifica

// Funzione per mostrare/nascondere il form e inizializzare/distruggere l'editor (esistente)
function toggleFormVisibility(isLoggedIn) {
    if (isLoggedIn) {
        if (authRequiredMessageDiv) authRequiredMessageDiv.style.display = 'none';
        if (articleSubmissionForm) articleSubmissionForm.style.display = 'block';
        initializeMarkdownEditor();
        checkAndLoadDraft(); // NUOVA CHIAMATA: controlla se stiamo modificando una bozza
    } else {
        if (authRequiredMessageDiv) authRequiredMessageDiv.style.display = 'block';
        if (articleSubmissionForm) articleSubmissionForm.style.display = 'none';
        destroyMarkdownEditor();
        editingDraftId = null; // Resetta l'ID della bozza al logout
    }
}

// Funzione per inizializzare EasyMDE (esistente)
function initializeMarkdownEditor(initialContent = '') {
    // Modificata per accettare contenuto iniziale
    if (articleContentTextarea && !easyMDEInstance) {
        try {
            easyMDEInstance = new EasyMDE({
                element: articleContentTextarea,
                initialValue: initialContent, // Usa il contenuto iniziale se fornito
                spellChecker: false,
                autosave: {
                    enabled: true,
                    uniqueId:
                        'articleSubmitContent_' +
                        (currentUser ? currentUser.uid : 'guest') +
                        (editingDraftId ? `_draft_${editingDraftId}` : '_new'), // ID univoco per autosave, include draftId
                    delay: 15000,
                },
                placeholder: 'Scrivi qui il contenuto del tuo articolo in formato Markdown...',
                toolbar: [
                    'bold',
                    'italic',
                    'heading',
                    '|',
                    'quote',
                    'unordered-list',
                    'ordered-list',
                    '|',
                    'link',
                    'image',
                    'code',
                    'horizontal-rule',
                    '|',
                    'preview',
                    'side-by-side',
                    'fullscreen',
                    '|',
                    'guide',
                ],
                forceSync: true,
            });
            console.log('EasyMDE inizializzato.');
        } catch (e) {
            console.error("Errore durante l'inizializzazione di EasyMDE:", e);
            if (initialContent && articleContentTextarea) articleContentTextarea.value = initialContent;
        }
    } else if (easyMDEInstance && initialContent) {
        easyMDEInstance.value(initialContent); // Aggiorna il valore se l'istanza esiste già
    }
}

// Funzione per rimuovere l'istanza di EasyMDE (esistente)
function destroyMarkdownEditor() {
    if (easyMDEInstance) {
        try {
            easyMDEInstance.toTextArea();
            easyMDEInstance = null;
            console.log('EasyMDE rimosso.');
        } catch (e) {
            console.error('Errore durante la rimozione di EasyMDE:', e);
        }
    }
    if (articleContentTextarea) articleContentTextarea.value = ''; // Pulisci il textarea
}

// NUOVA FUNZIONE: Controlla se c'è un draftId nell'URL e carica i dati
async function checkAndLoadDraft() {
    const urlParams = new URLSearchParams(window.location.search);
    const draftIdFromUrl = urlParams.get('draftId');

    if (draftIdFromUrl && currentUser) {
        console.log(`Trovato draftId nell'URL: ${draftIdFromUrl}. Tento il caricamento...`);
        const articleRef = doc(db, 'articles', draftIdFromUrl);
        try {
            const docSnap = await getDoc(articleRef);
            if (docSnap.exists()) {
                const articleData = docSnap.data();
                // Verifica che l'articolo appartenga all'utente corrente e sia una bozza
                if (articleData.authorId === currentUser.uid && articleData.status === 'draft') {
                    editingDraftId = draftIdFromUrl; // Imposta l'ID globale
                    console.log('Caricamento dati bozza:', articleData);

                    if (articleTitleInput) articleTitleInput.value = articleData.title || '';
                    if (articleTagsInput) articleTagsInput.value = (articleData.tags || []).join(', ');
                    if (articleSnippetInput) articleSnippetInput.value = articleData.snippet || '';
                    if (articleCoverImageUrlInput) articleCoverImageUrlInput.value = articleData.coverImageUrl || '';

                    // Popola EasyMDE (o il textarea se EasyMDE non è inizializzato)
                    if (easyMDEInstance) {
                        easyMDEInstance.value(articleData.contentMarkdown || '');
                    } else if (articleContentTextarea) {
                        // Se EasyMDE non è ancora pronto, lo inizializzeremo con questo contenuto
                        // Questo caso dovrebbe essere coperto da initializeMarkdownEditor chiamato dopo
                        articleContentTextarea.value = articleData.contentMarkdown || '';
                    }

                    // Aggiorna testo dei pulsanti per indicare la modifica
                    if (submitArticleForReviewBtn)
                        submitArticleForReviewBtn.textContent = 'Aggiorna e Invia per Revisione';
                    if (saveArticleDraftBtn) saveArticleDraftBtn.textContent = 'Aggiorna Bozza';
                    if (submissionMessageDiv) {
                        submissionMessageDiv.textContent = `Stai modificando la bozza: "${articleData.title || 'Senza Titolo'}".`;
                        submissionMessageDiv.className = 'info'; // Potresti creare una classe .info
                    }
                    // Re-inizializza/aggiorna EasyMDE se necessario, specialmente se il contenuto è stato impostato prima dell'inizializzazione
                    if (easyMDEInstance) {
                        easyMDEInstance.value(articleData.contentMarkdown || '');
                    } else {
                        // Se EasyMDE non è inizializzato, initializeMarkdownEditor lo farà con il contenuto del textarea
                        initializeMarkdownEditor(articleData.contentMarkdown || '');
                    }
                } else {
                    console.warn('Accesso alla bozza negato o stato non valido.');
                    if (submissionMessageDiv) {
                        submissionMessageDiv.textContent =
                            'Errore: Impossibile caricare la bozza specificata o accesso negato.';
                        submissionMessageDiv.className = 'error';
                    }
                    editingDraftId = null; // Resetta se non valido
                    window.history.replaceState({}, document.title, window.location.pathname); // Rimuovi draftId dall'URL
                }
            } else {
                console.warn('Bozza non trovata con ID:', draftIdFromUrl);
                if (submissionMessageDiv) {
                    submissionMessageDiv.textContent = `Errore: Bozza con ID ${draftIdFromUrl} non trovata.`;
                    submissionMessageDiv.className = 'error';
                }
                editingDraftId = null;
                window.history.replaceState({}, document.title, window.location.pathname);
            }
        } catch (error) {
            console.error('Errore caricamento bozza:', error);
            if (submissionMessageDiv) {
                submissionMessageDiv.textContent = `Errore durante il caricamento della bozza: ${error.message}`;
                submissionMessageDiv.className = 'error';
            }
            editingDraftId = null;
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    } else {
        editingDraftId = null; // Assicurati che sia null se non c'è draftId o utente
    }
}

// Gestione autenticazione (esistente, con aggiunta di checkAndLoadDraft)
onAuthStateChanged(auth, (user) => {
    currentUser = user;
    toggleFormVisibility(!!user); // Chiamerà checkAndLoadDraft se l'utente è loggato

    if (!user && loginLinkFromSubmitPage && document.getElementById('showLoginBtn')) {
        const newLoginLink = loginLinkFromSubmitPage.cloneNode(true);
        if (loginLinkFromSubmitPage.parentNode) {
            loginLinkFromSubmitPage.parentNode.replaceChild(newLoginLink, loginLinkFromSubmitPage);
        }
        newLoginLink.addEventListener('click', (e) => {
            e.preventDefault();
            const showLoginBtnGlobal = document.getElementById('showLoginBtn');
            if (showLoginBtnGlobal) {
                showLoginBtnGlobal.click();
            }
        });
    }
});

// Gestione invio form per revisione (MODIFICATA)
if (articleSubmissionForm) {
    articleSubmissionForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!currentUser) {
            submissionMessageDiv.textContent = 'Devi essere loggato per inviare un articolo.';
            submissionMessageDiv.className = 'error';
            return;
        }

        const title = articleTitleInput.value.trim();
        let contentMarkdown = easyMDEInstance ? easyMDEInstance.value().trim() : articleContentTextarea.value.trim();
        const tagsString = articleTagsInput.value.trim();
        const snippet = articleSnippetInput.value.trim();
        const coverImageUrl = articleCoverImageUrlInput.value.trim();

        if (!title || !contentMarkdown) {
            submissionMessageDiv.textContent = 'Titolo e Contenuto sono obbligatori.';
            submissionMessageDiv.className = 'error';
            return;
        }

        const tagsArray = tagsString
            ? tagsString
                  .split(',')
                  .map((tag) => tag.trim().toLowerCase())
                  .filter((tag) => tag)
            : [];

        submitArticleForReviewBtn.disabled = true;
        submitArticleForReviewBtn.textContent = editingDraftId ? 'Aggiornamento e Invio...' : 'Invio in corso...';
        submissionMessageDiv.textContent = '';
        submissionMessageDiv.className = '';

        try {
            let authorNameResolved = currentUser.displayName || currentUser.email.split('@')[0];
            let authorNationalityCodeResolved = null;

            const userProfileRef = doc(db, 'userProfiles', currentUser.uid);
            const userProfileSnap = await getDoc(userProfileRef);
            if (userProfileSnap.exists()) {
                const profileData = userProfileSnap.data();
                if (profileData.nickname) authorNameResolved = profileData.nickname;
                if (profileData.nationalityCode) authorNationalityCodeResolved = profileData.nationalityCode;
            }

            const articleDataPayload = {
                title: title,
                contentMarkdown: contentMarkdown,
                tags: tagsArray,
                snippet: snippet,
                coverImageUrl: coverImageUrl ? coverImageUrl : null,
                authorId: currentUser.uid, // Rimane invariato se si modifica
                authorName: authorNameResolved, // Può aggiornarsi se il profilo è cambiato
                updatedAt: serverTimestamp(),
                status: 'pendingReview', // Stato finale per questa azione
                // Campi che non vengono toccati qui se si modifica, o inizializzati se si crea:
                // likeCount, commentCount, likedByUsers, isFeatured, createdAt
            };
            if (authorNationalityCodeResolved) {
                articleDataPayload.authorNationalityCode = authorNationalityCodeResolved; // Può aggiornarsi
            }

            if (editingDraftId) {
                // Stiamo MODIFICANDO una bozza esistente
                const articleRef = doc(db, 'articles', editingDraftId);
                // Non resettiamo createdAt, likeCount, commentCount, likedByUsers, isFeatured, authorId
                // authorName e authorNationalityCode potrebbero essere aggiornati
                await updateDoc(articleRef, articleDataPayload);
                submissionMessageDiv.textContent = 'Bozza aggiornata e inviata per la revisione con successo!';
                // Potresti voler reindirizzare l'utente o svuotare il form in modo diverso qui
            } else {
                // Stiamo CREANDO un nuovo articolo
                articleDataPayload.createdAt = serverTimestamp();
                articleDataPayload.likeCount = 0;
                articleDataPayload.commentCount = 0;
                articleDataPayload.likedByUsers = [];
                articleDataPayload.isFeatured = false;
                // publishedAt e rejectionReason non vengono impostati qui

                await addDoc(collection(db, 'articles'), articleDataPayload);
                submissionMessageDiv.textContent = 'Articolo inviato per la revisione con successo!';
            }

            submissionMessageDiv.className = 'success';
            articleSubmissionForm.reset();
            if (easyMDEInstance) easyMDEInstance.value('');
            editingDraftId = null; // Resetta dopo l'operazione
            if (submitArticleForReviewBtn) submitArticleForReviewBtn.textContent = 'Invia per Revisione';
            if (saveArticleDraftBtn) saveArticleDraftBtn.textContent = 'Salva Bozza';
            window.history.replaceState({}, document.title, window.location.pathname); // Pulisci URL
        } catch (error) {
            console.error('Errore invio/aggiornamento articolo:', error);
            submissionMessageDiv.textContent = `Errore: ${error.message}`;
            submissionMessageDiv.className = 'error';
        } finally {
            submitArticleForReviewBtn.disabled = false;
            // Il testo del bottone viene resettato sopra o rimane se c'è errore
        }
    });
}

// Gestione salvataggio bozza (MODIFICATA)
if (saveArticleDraftBtn) {
    saveArticleDraftBtn.addEventListener('click', async () => {
        if (!currentUser) {
            submissionMessageDiv.textContent = 'Devi essere loggato per salvare una bozza.';
            submissionMessageDiv.className = 'error';
            return;
        }

        const title = articleTitleInput.value.trim();
        if (!title && !editingDraftId) {
            // Titolo obbligatorio solo per nuove bozze, per le modifiche potrebbe essere vuoto temporaneamente
            submissionMessageDiv.textContent = 'Inserisci almeno un titolo per salvare una nuova bozza.';
            submissionMessageDiv.className = 'error';
            return;
        }

        saveArticleDraftBtn.disabled = true;
        saveArticleDraftBtn.textContent = editingDraftId ? 'Aggiornamento Bozza...' : 'Salvataggio Bozza...';
        submissionMessageDiv.textContent = '';
        submissionMessageDiv.className = '';

        let contentMarkdown = easyMDEInstance ? easyMDEInstance.value().trim() : articleContentTextarea.value.trim();
        const tagsString = articleTagsInput.value.trim();
        const snippet = articleSnippetInput.value.trim();
        const coverImageUrl = articleCoverImageUrlInput.value.trim();
        const tagsArray = tagsString
            ? tagsString
                  .split(',')
                  .map((tag) => tag.trim().toLowerCase())
                  .filter((tag) => tag)
            : [];

        try {
            let authorNameResolved = currentUser.displayName || currentUser.email.split('@')[0];
            let authorNationalityCodeResolved = null;

            const userProfileRef = doc(db, 'userProfiles', currentUser.uid);
            const userProfileSnap = await getDoc(userProfileRef);
            if (userProfileSnap.exists()) {
                const profileData = userProfileSnap.data();
                if (profileData.nickname) authorNameResolved = profileData.nickname;
                if (profileData.nationalityCode) authorNationalityCodeResolved = profileData.nationalityCode;
            }

            const draftArticleDataPayload = {
                title: title || (editingDraftId ? '' : 'Bozza senza titolo'), // Permetti titolo vuoto se si modifica una bozza esistente
                contentMarkdown: contentMarkdown,
                tags: tagsArray,
                snippet: snippet,
                coverImageUrl: coverImageUrl ? coverImageUrl : null,
                authorId: currentUser.uid,
                authorName: authorNameResolved,
                updatedAt: serverTimestamp(),
                status: 'draft', // Lo stato è sempre 'draft' per questa azione
            };
            if (authorNationalityCodeResolved) {
                draftArticleDataPayload.authorNationalityCode = authorNationalityCodeResolved;
            }

            if (editingDraftId) {
                // Stiamo AGGIORNANDO una bozza esistente
                const articleRef = doc(db, 'articles', editingDraftId);
                // Non resettiamo createdAt o altri campi non modificabili dall'autore per una bozza
                await updateDoc(articleRef, draftArticleDataPayload);
                submissionMessageDiv.textContent = 'Bozza aggiornata con successo!';
            } else {
                // Stiamo CREANDO una nuova bozza
                draftArticleDataPayload.createdAt = serverTimestamp();
                draftArticleDataPayload.likeCount = 0;
                draftArticleDataPayload.commentCount = 0;
                draftArticleDataPayload.likedByUsers = [];
                draftArticleDataPayload.isFeatured = false;
                // publishedAt e rejectionReason non vengono impostati qui

                const docRef = await addDoc(collection(db, 'articles'), draftArticleDataPayload);
                editingDraftId = docRef.id; // Imposta l'ID per modifiche successive senza ricaricare la pagina
                submissionMessageDiv.textContent =
                    'Bozza salvata con successo! Ora puoi continuare a modificarla o inviarla per revisione.';
                // Aggiorna l'URL per includere il draftId, così un refresh non perde il contesto
                if (window.history.pushState) {
                    const newurl =
                        window.location.protocol +
                        '//' +
                        window.location.host +
                        window.location.pathname +
                        `?draftId=${editingDraftId}`;
                    window.history.pushState({ path: newurl }, '', newurl);
                }
                // Aggiorna testo dei pulsanti
                if (submitArticleForReviewBtn) submitArticleForReviewBtn.textContent = 'Aggiorna e Invia per Revisione';
                if (saveArticleDraftBtn) saveArticleDraftBtn.textContent = 'Aggiorna Bozza';
            }

            submissionMessageDiv.className = 'success';
            // Non resettare il form/editor dopo aver salvato una bozza, l'utente potrebbe voler continuare.
        } catch (error) {
            console.error('Errore salvataggio bozza:', error);
            submissionMessageDiv.textContent = `Errore: ${error.message}`;
            submissionMessageDiv.className = 'error';
        } finally {
            saveArticleDraftBtn.disabled = false;
            // Il testo del bottone viene aggiornato sopra o rimane se c'è errore
            if (!editingDraftId && saveArticleDraftBtn) saveArticleDraftBtn.textContent = 'Salva Bozza';
        }
    });
}

// Event listener DOMContentLoaded per inizializzazione (esistente)
document.addEventListener('DOMContentLoaded', () => {
    const user = auth.currentUser; // Controlla subito se l'utente è già loggato
    currentUser = user;
    toggleFormVisibility(!!user); // Chiamata iniziale per gestire UI e caricamento bozza

    if (!user && loginLinkFromSubmitPage && document.getElementById('showLoginBtn')) {
        const newLoginLink = loginLinkFromSubmitPage.cloneNode(true);
        if (loginLinkFromSubmitPage.parentNode) {
            loginLinkFromSubmitPage.parentNode.replaceChild(newLoginLink, loginLinkFromSubmitPage);
        }
        newLoginLink.addEventListener('click', (e) => {
            e.preventDefault();
            const showLoginBtnGlobal = document.getElementById('showLoginBtn');
            if (showLoginBtnGlobal) {
                showLoginBtnGlobal.click();
            }
        });
    }
});
