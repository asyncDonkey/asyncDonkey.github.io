// js/articleSubmission.js
import { db, auth } from './main.js';
import {
    doc,
    addDoc,
    collection,
    serverTimestamp,
    getDoc,
    updateDoc,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { showToast } from './toastNotifications.js';

// Riferimenti DOM
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
let editingDraftId = null;

// Funzione helper per popolare i campi del form
function populateFormFields(articleData) {
    if (articleTitleInput) articleTitleInput.value = articleData.title || '';
    if (articleTagsInput) articleTagsInput.value = (articleData.tags || []).join(', ');
    if (articleSnippetInput) articleSnippetInput.value = articleData.snippet || '';
    if (articleCoverImageUrlInput) articleCoverImageUrlInput.value = articleData.coverImageUrl || '';

    if (easyMDEInstance) {
        easyMDEInstance.value(articleData.contentMarkdown || '');
    } else if (articleContentTextarea) {
        articleContentTextarea.value = articleData.contentMarkdown || '';
        // Se EasyMDE non è ancora inizializzato, initializeMarkdownEditor lo gestirà
        // assicurando che il contenuto venga passato o preso dal textarea.
        initializeMarkdownEditor(articleData.contentMarkdown || '');
    }
}

async function initializeFormWithData() {
    const urlParams = new URLSearchParams(window.location.search);
    const draftIdFromUrl = urlParams.get('draftId');
    const rejectedArticleIdFromUrl = urlParams.get('rejectedArticleId');

    // Resetta i messaggi e i testi dei pulsanti all'inizio
    if (submissionMessageDiv) {
        submissionMessageDiv.textContent = '';
        submissionMessageDiv.className = '';
    }
    if (submitArticleForReviewBtn) submitArticleForReviewBtn.textContent = 'Invia per Revisione';
    if (saveArticleDraftBtn) saveArticleDraftBtn.textContent = 'Salva Bozza';
    editingDraftId = null; // Resetta l'ID della bozza in modifica

    if (draftIdFromUrl && currentUser) {
        // console.log(`Trovato draftId nell'URL: ${draftIdFromUrl}. Tento il caricamento...`);
        const articleRef = doc(db, 'articles', draftIdFromUrl);
        try {
            const docSnap = await getDoc(articleRef);
            if (docSnap.exists()) {
                const articleData = docSnap.data();
                if (articleData.authorId === currentUser.uid && articleData.status === 'draft') {
                    editingDraftId = draftIdFromUrl;
                    // console.log('Caricamento dati bozza:', articleData);
                    populateFormFields(articleData);
                    if (submitArticleForReviewBtn)
                        submitArticleForReviewBtn.textContent = 'Aggiorna e Invia per Revisione';
                    if (saveArticleDraftBtn) saveArticleDraftBtn.textContent = 'Aggiorna Bozza';
                    if (submissionMessageDiv) {
                        submissionMessageDiv.textContent = `Stai modificando la bozza: "${articleData.title || 'Senza Titolo'}".`;
                        submissionMessageDiv.className = 'info'; // Usa una classe per info non intrusive
                    }
                } else {
                    // console.warn('Accesso alla bozza negato o stato non valido.');
                    if (submissionMessageDiv) {
                        submissionMessageDiv.textContent =
                            'Errore: Impossibile caricare la bozza specificata o accesso negato.';
                        submissionMessageDiv.className = 'error';
                    }
                    window.history.replaceState({}, document.title, window.location.pathname);
                }
            } else {
                // console.warn('Bozza non trovata con ID:', draftIdFromUrl);
                if (submissionMessageDiv) {
                    submissionMessageDiv.textContent = `Errore: Bozza con ID ${draftIdFromUrl} non trovata.`;
                    submissionMessageDiv.className = 'error';
                }
                window.history.replaceState({}, document.title, window.location.pathname);
            }
        } catch (error) {
            console.error('Errore caricamento bozza:', error);
            if (submissionMessageDiv) {
                submissionMessageDiv.textContent = `Errore durante il caricamento della bozza: ${error.message}`;
                submissionMessageDiv.className = 'error';
            }
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    } else if (rejectedArticleIdFromUrl && currentUser) {
        // console.log(`Trovato rejectedArticleId: ${rejectedArticleIdFromUrl}. Tento il pre-popolamento...`);
        // editingDraftId è già null
        const articleRef = doc(db, 'articles', rejectedArticleIdFromUrl);
        try {
            const docSnap = await getDoc(articleRef);
            if (docSnap.exists()) {
                const articleData = docSnap.data();
                if (articleData.authorId === currentUser.uid) {
                    // L'autore può leggere il *proprio* articolo respinto
                    // console.log('Pre-popolamento form con dati articolo respinto:', articleData);
                    populateFormFields(articleData);

                    if (submissionMessageDiv) {
                        submissionMessageDiv.textContent =
                            'Campi pre-compilati dal tuo precedente articolo. Questa sarà una nuova sottomissione.';
                        submissionMessageDiv.className = 'info';
                    }
                    const newUrl = new URL(window.location.toString()); // Usa toString() per compatibilità
                    newUrl.searchParams.delete('rejectedArticleId');
                    window.history.replaceState({}, document.title, newUrl.pathname + newUrl.search);
                } else {
                    console.warn("Accesso all'articolo respinto negato per pre-popolamento (non è dell'utente).");
                    if (submissionMessageDiv) {
                        submissionMessageDiv.textContent =
                            "Errore: Impossibile caricare i dati dell'articolo (accesso negato).";
                        submissionMessageDiv.className = 'error';
                    }
                    window.history.replaceState({}, document.title, window.location.pathname);
                }
            } else {
                // console.warn('Articolo respinto non trovato con ID:', rejectedArticleIdFromUrl);
                if (submissionMessageDiv) {
                    submissionMessageDiv.textContent = `Errore: Articolo con ID ${rejectedArticleIdFromUrl} non trovato.`;
                    submissionMessageDiv.className = 'error';
                }
                window.history.replaceState({}, document.title, window.location.pathname);
            }
        } catch (error) {
            console.error('Errore caricamento articolo respinto per pre-popolamento:', error);
            if (submissionMessageDiv) {
                submissionMessageDiv.textContent = `Errore durante il caricamento dei dati: ${error.message}`;
                submissionMessageDiv.className = 'error';
            }
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    } else {
        // Nessun ID, resetta i campi per un nuovo articolo
        if (articleSubmissionForm && typeof articleSubmissionForm.reset === 'function') {
            articleSubmissionForm.reset(); // Resetta i campi standard del form
        }
        if (easyMDEInstance) {
            easyMDEInstance.value(''); // Pulisci EasyMDE
        } else if (articleContentTextarea) {
            articleContentTextarea.value = ''; // Pulisci textarea se EasyMDE non è pronto
        }
    }
}

function initializeMarkdownEditor(initialContent = '') {
    if (articleContentTextarea && !easyMDEInstance) {
        try {
            easyMDEInstance = new EasyMDE({
                element: articleContentTextarea,
                initialValue: initialContent || articleContentTextarea.value, // Prendi il valore dal textarea se già popolato
                spellChecker: false,
                autosave: {
                    enabled: true,
                    uniqueId:
                        'articleSubmitContent_' +
                        (currentUser ? currentUser.uid : 'guest') +
                        (editingDraftId ? `_draft_${editingDraftId}` : '_new'),
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
            // console.log('EasyMDE inizializzato.');
        } catch (e) {
            console.error("Errore durante l'inizializzazione di EasyMDE:", e);
            if (articleContentTextarea) articleContentTextarea.value = initialContent || articleContentTextarea.value;
        }
    } else if (easyMDEInstance && initialContent) {
        // Se l'istanza esiste e viene fornito nuovo contenuto
        easyMDEInstance.value(initialContent);
    }
}

function destroyMarkdownEditor() {
    if (easyMDEInstance) {
        try {
            easyMDEInstance.toTextArea(); // Ripristina il textarea originale
            easyMDEInstance = null;
            // console.log('EasyMDE rimosso.');
        } catch (e) {
            console.error('Errore durante la rimozione di EasyMDE:', e);
        }
    }
    if (articleContentTextarea) articleContentTextarea.value = '';
}

function toggleFormVisibility(isLoggedIn) {
    if (isLoggedIn) {
        if (authRequiredMessageDiv) authRequiredMessageDiv.style.display = 'none';
        if (articleSubmissionForm) articleSubmissionForm.style.display = 'block';
        initializeMarkdownEditor(); // Inizializza l'editor (prenderà il contenuto dal textarea se già presente)
        initializeFormWithData(); // Popola i dati dopo che l'editor è potenzialmente pronto
    } else {
        if (authRequiredMessageDiv) authRequiredMessageDiv.style.display = 'block';
        if (articleSubmissionForm) articleSubmissionForm.style.display = 'none';
        destroyMarkdownEditor();
        editingDraftId = null;
    }
}

onAuthStateChanged(auth, (user) => {
    currentUser = user;
    toggleFormVisibility(!!user);

    if (!user && loginLinkFromSubmitPage && document.getElementById('showLoginBtn')) {
        // Clona il nodo per evitare listener multipli se onAuthStateChanged scatta più volte
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

if (articleSubmissionForm) {
    articleSubmissionForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!currentUser) {
            showToast('Devi essere loggato per inviare un articolo.', 'error');
            return;
        }

        const title = articleTitleInput.value.trim();
        const contentMarkdown = easyMDEInstance ? easyMDEInstance.value().trim() : articleContentTextarea.value.trim();
        const tagsString = articleTagsInput.value.trim();
        const snippet = articleSnippetInput.value.trim();
        const coverImageUrl = articleCoverImageUrlInput.value.trim();

        if (!title || !contentMarkdown) {
            showToast('Titolo e Contenuto sono obbligatori.', 'error');
            return;
        }

        const tagsArray = tagsString
            ? tagsString
                  .split(',')
                  .map((tag) => tag.trim().toLowerCase())
                  .filter((tag) => tag)
            : [];

        if (submitArticleForReviewBtn) {
            submitArticleForReviewBtn.disabled = true;
            submitArticleForReviewBtn.textContent = editingDraftId ? 'Aggiornamento e Invio...' : 'Invio in corso...';
        }
        if (submissionMessageDiv) {
            submissionMessageDiv.textContent = '';
            submissionMessageDiv.className = '';
        }

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
                title,
                contentMarkdown,
                tags: tagsArray,
                snippet,
                coverImageUrl: coverImageUrl || null,
                authorId: currentUser.uid,
                authorName: authorNameResolved,
                updatedAt: serverTimestamp(),
                status: 'pendingReview',
            };
            if (authorNationalityCodeResolved) {
                articleDataPayload.authorNationalityCode = authorNationalityCodeResolved;
            }

            if (editingDraftId) {
                const articleRef = doc(db, 'articles', editingDraftId);
                await updateDoc(articleRef, articleDataPayload);
                showToast('Bozza aggiornata e inviata per la revisione!', 'success');
            } else {
                articleDataPayload.createdAt = serverTimestamp();
                articleDataPayload.likeCount = 0;
                articleDataPayload.commentCount = 0;
                articleDataPayload.likedByUsers = [];
                articleDataPayload.isFeatured = false;
                await addDoc(collection(db, 'articles'), articleDataPayload);
                showToast('Articolo inviato per la revisione!', 'success');
            }

            if (articleSubmissionForm && typeof articleSubmissionForm.reset === 'function') {
                articleSubmissionForm.reset();
            }
            if (easyMDEInstance) easyMDEInstance.value('');
            editingDraftId = null;
            if (submitArticleForReviewBtn) submitArticleForReviewBtn.textContent = 'Invia per Revisione';
            if (saveArticleDraftBtn) saveArticleDraftBtn.textContent = 'Salva Bozza';
            if (submissionMessageDiv) {
                submissionMessageDiv.textContent = ''; // Pulisci messaggio dopo successo
                submissionMessageDiv.className = '';
            }
            window.history.replaceState({}, document.title, window.location.pathname);
        } catch (error) {
            console.error('Errore invio/aggiornamento articolo:', error);
            showToast(`Errore: ${error.message}`, 'error');
        } finally {
            if (submitArticleForReviewBtn) submitArticleForReviewBtn.disabled = false;
        }
    });
}

if (saveArticleDraftBtn) {
    saveArticleDraftBtn.addEventListener('click', async () => {
        if (!currentUser) {
            showToast('Devi essere loggato per salvare una bozza.', 'error');
            return;
        }

        const title = articleTitleInput.value.trim();
        // Titolo non più strettamente obbligatorio per salvare una bozza,
        // ma l'utente viene incoraggiato ad averlo.
        // if (!title && !editingDraftId) {
        //     showToast('Inserisci almeno un titolo per salvare una nuova bozza.', 'warning');
        //     // return; // Non bloccare il salvataggio
        // }

        if (saveArticleDraftBtn) {
            saveArticleDraftBtn.disabled = true;
            saveArticleDraftBtn.textContent = editingDraftId ? 'Aggiornamento Bozza...' : 'Salvataggio Bozza...';
        }
        if (submissionMessageDiv) {
            submissionMessageDiv.textContent = '';
            submissionMessageDiv.className = '';
        }

        const contentMarkdown = easyMDEInstance ? easyMDEInstance.value().trim() : articleContentTextarea.value.trim();
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
                title: title || (editingDraftId ? '' : 'Bozza senza titolo'),
                contentMarkdown,
                tags: tagsArray,
                snippet,
                coverImageUrl: coverImageUrl || null,
                authorId: currentUser.uid,
                authorName: authorNameResolved,
                updatedAt: serverTimestamp(),
                status: 'draft',
            };
            if (authorNationalityCodeResolved) {
                draftArticleDataPayload.authorNationalityCode = authorNationalityCodeResolved;
            }

            if (editingDraftId) {
                const articleRef = doc(db, 'articles', editingDraftId);
                await updateDoc(articleRef, draftArticleDataPayload);
                showToast('Bozza aggiornata con successo!', 'success');
            } else {
                draftArticleDataPayload.createdAt = serverTimestamp();
                draftArticleDataPayload.likeCount = 0;
                draftArticleDataPayload.commentCount = 0;
                draftArticleDataPayload.likedByUsers = [];
                draftArticleDataPayload.isFeatured = false;
                const docRef = await addDoc(collection(db, 'articles'), draftArticleDataPayload);
                editingDraftId = docRef.id;
                showToast('Bozza salvata con successo!', 'success');

                if (window.history.pushState) {
                    const newurl = `${window.location.pathname}?draftId=${editingDraftId}`;
                    window.history.pushState({ path: newurl }, '', newurl);
                }
                if (submitArticleForReviewBtn) submitArticleForReviewBtn.textContent = 'Aggiorna e Invia per Revisione';
                if (saveArticleDraftBtn) saveArticleDraftBtn.textContent = 'Aggiorna Bozza';
            }
            if (submissionMessageDiv) {
                // Mostra messaggio di successo per il salvataggio bozza
                submissionMessageDiv.textContent = editingDraftId ? 'Bozza aggiornata!' : 'Bozza salvata!';
                submissionMessageDiv.className = 'success';
            }
        } catch (error) {
            console.error('Errore salvataggio bozza:', error);
            showToast(`Errore salvataggio bozza: ${error.message}`, 'error');
            if (submissionMessageDiv) {
                submissionMessageDiv.textContent = `Errore: ${error.message}`;
                submissionMessageDiv.className = 'error';
            }
        } finally {
            if (saveArticleDraftBtn) {
                saveArticleDraftBtn.disabled = false;
                // Il testo viene già aggiornato sopra se si crea una nuova bozza
                if (editingDraftId && saveArticleDraftBtn) {
                    saveArticleDraftBtn.textContent = 'Aggiorna Bozza';
                } else if (!editingDraftId && saveArticleDraftBtn) {
                    saveArticleDraftBtn.textContent = 'Salva Bozza'; // Se il salvataggio fallisce e non c'era ID
                }
            }
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    currentUser = auth.currentUser;
    toggleFormVisibility(!!currentUser);

    if (!currentUser && loginLinkFromSubmitPage && document.getElementById('showLoginBtn')) {
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
