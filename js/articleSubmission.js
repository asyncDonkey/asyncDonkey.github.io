// js/articleSubmission.js
import { db, auth } from './main.js';
import {
    doc, setDoc, addDoc, collection, serverTimestamp, getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// Riferimenti DOM
const articleSubmissionForm = document.getElementById('articleSubmissionForm');
const articleTitleInput = document.getElementById('articleTitle');
const articleContentTextarea = document.getElementById('articleContent'); // Il textarea originale
const articleTagsInput = document.getElementById('articleTags');
const articleSnippetInput = document.getElementById('articleSnippet');
const articleCoverImageUrlInput = document.getElementById('articleCoverImageUrl');
const submitArticleForReviewBtn = document.getElementById('submitArticleForReviewBtn');
const saveArticleDraftBtn = document.getElementById('saveArticleDraftBtn');
const submissionMessageDiv = document.getElementById('submissionMessage');
const authRequiredMessageDiv = document.getElementById('authRequiredMessage');
const loginLinkFromSubmitPage = document.getElementById('loginLinkFromSubmitPage');

let currentUser = null;
let easyMDEInstance = null; // Riferimento all'istanza di EasyMDE

// Funzione per mostrare/nascondere il form e inizializzare/distruggere l'editor
function toggleFormVisibility(isLoggedIn) {
    if (isLoggedIn) {
        if(authRequiredMessageDiv) authRequiredMessageDiv.style.display = 'none';
        if(articleSubmissionForm) articleSubmissionForm.style.display = 'block';
        initializeMarkdownEditor(); // Inizializza l'editor quando il form è visibile
    } else {
        if(authRequiredMessageDiv) authRequiredMessageDiv.style.display = 'block';
        if(articleSubmissionForm) articleSubmissionForm.style.display = 'none';
        destroyMarkdownEditor(); // Rimuovi l'editor se l'utente fa logout
    }
}

// Funzione per inizializzare EasyMDE
function initializeMarkdownEditor() {
    if (articleContentTextarea && !easyMDEInstance) { // Inizializza solo se il textarea esiste e l'editor non è già attivo
        try {
            easyMDEInstance = new EasyMDE({
                element: articleContentTextarea,
                spellChecker: false,
                autosave: {
                    enabled: true,
                    uniqueId: "articleSubmitContent_" + (currentUser ? currentUser.uid : "guest"),
                    delay: 15000, // Salva ogni 15 secondi
                },
                placeholder: "Scrivi qui il contenuto del tuo articolo in formato Markdown...\n\nSintassi utili:\n- **Grassetto**\n- *Corsivo*\n- # Titolo 1\n- ## Titolo 2\n- [Testo del Link](http://example.com)\n- ![Alt Text Immagine](http://example.com/image.jpg)\n- ```\n  codiceBl\n  ```\n- --- (per una linea orizzontale)",
                toolbar: [
                    "bold", "italic", "heading", "|",
                    "quote", "unordered-list", "ordered-list", "|",
                    "link", "image", "code", "horizontal-rule", "|",
                    "preview", "side-by-side", "fullscreen", "|",
                    "guide"
                ],
                forceSync: true, // Assicura che il textarea originale sia sempre aggiornato
                // status: false, // Opzionale: nasconde la barra di stato (conteggio parole/linee)
            });
            console.log("EasyMDE inizializzato.");
        } catch (e) {
            console.error("Errore durante l'inizializzazione di EasyMDE:", e);
            // Lascia il textarea semplice se EasyMDE fallisce
        }
    }
}

// Funzione per rimuovere l'istanza di EasyMDE e ripristinare il textarea
function destroyMarkdownEditor() {
    if (easyMDEInstance) {
        try {
            easyMDEInstance.toTextArea();
            easyMDEInstance = null;
            console.log("EasyMDE rimosso.");
        } catch (e) {
            console.error("Errore durante la rimozione di EasyMDE:", e);
        }
    }
}

// Gestione autenticazione
onAuthStateChanged(auth, (user) => {
    currentUser = user; // Aggiorna currentUser qui
    toggleFormVisibility(!!user); // Passa un booleano
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

// Gestione invio form per revisione
if (articleSubmissionForm) {
    articleSubmissionForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!currentUser) {
            submissionMessageDiv.textContent = 'Devi essere loggato per inviare un articolo.';
            submissionMessageDiv.className = 'error';
            return;
        }

        const title = articleTitleInput.value.trim();
        let contentMarkdown = "";
        if (easyMDEInstance) {
            contentMarkdown = easyMDEInstance.value().trim();
        } else {
            contentMarkdown = articleContentTextarea.value.trim(); // Fallback al textarea
        }
        const tagsString = articleTagsInput.value.trim();
        const snippet = articleSnippetInput.value.trim();
        const coverImageUrl = articleCoverImageUrlInput.value.trim();

        if (!title || !contentMarkdown) {
            submissionMessageDiv.textContent = 'Titolo e Contenuto sono obbligatori.';
            submissionMessageDiv.className = 'error';
            return;
        }

        const tagsArray = tagsString ? tagsString.split(',').map(tag => tag.trim()).filter(tag => tag) : [];

        submitArticleForReviewBtn.disabled = true;
        submitArticleForReviewBtn.textContent = 'Invio in corso...';
        submissionMessageDiv.textContent = '';
        submissionMessageDiv.className = '';

        try {
            const articlesCollectionRef = collection(db, "articles");
            let authorNameResolved = currentUser.displayName || currentUser.email.split('@')[0];
            let authorNationalityCodeResolved = null;

            const userProfileRef = doc(db, "userProfiles", currentUser.uid);
            const userProfileSnap = await getDoc(userProfileRef);
            if (userProfileSnap.exists()) {
                const profileData = userProfileSnap.data();
                if (profileData.nickname) {
                    authorNameResolved = profileData.nickname;
                }
                if (profileData.nationalityCode) {
                    authorNationalityCodeResolved = profileData.nationalityCode;
                }
            }

            const newArticleData = {
                title: title,
                contentMarkdown: contentMarkdown,
                tags: tagsArray,
                snippet: snippet,
                coverImageUrl: coverImageUrl ? coverImageUrl : null,
                authorId: currentUser.uid,
                authorName: authorNameResolved,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                status: "pendingReview",
                likeCount: 0,
                commentCount: 0,
                likedByUsers: [],
                isFeatured: false,
            };
            if (authorNationalityCodeResolved) {
                newArticleData.authorNationalityCode = authorNationalityCodeResolved;
            }

            await addDoc(articlesCollectionRef, newArticleData);

            submissionMessageDiv.textContent = 'Articolo inviato per la revisione con successo!';
            submissionMessageDiv.className = 'success';
            articleSubmissionForm.reset();
            if (easyMDEInstance) {
                easyMDEInstance.value(""); // Pulisci l'editor
            }

        } catch (error) {
            console.error("Errore invio articolo:", error);
            submissionMessageDiv.textContent = `Errore durante l'invio: ${error.message}`;
            submissionMessageDiv.className = 'error';
        } finally {
            submitArticleForReviewBtn.disabled = false;
            submitArticleForReviewBtn.textContent = 'Invia per Revisione';
        }
    });
}

// Gestione salvataggio bozza
if (saveArticleDraftBtn) {
    saveArticleDraftBtn.addEventListener('click', async () => {
        if (!currentUser) {
            submissionMessageDiv.textContent = 'Devi essere loggato per salvare una bozza.';
            submissionMessageDiv.className = 'error';
            return;
        }

        const title = articleTitleInput.value.trim();
        if (!title) {
            submissionMessageDiv.textContent = 'Inserisci almeno un titolo per salvare la bozza.';
            submissionMessageDiv.className = 'error';
            return;
        }

        saveArticleDraftBtn.disabled = true;
        saveArticleDraftBtn.textContent = 'Salvataggio Bozza...';
        submissionMessageDiv.textContent = '';
        submissionMessageDiv.className = '';

        let contentMarkdown = "";
        if (easyMDEInstance) {
            contentMarkdown = easyMDEInstance.value().trim();
        } else {
            contentMarkdown = articleContentTextarea.value.trim(); // Fallback
        }
        const tagsString = articleTagsInput.value.trim();
        const snippet = articleSnippetInput.value.trim();
        const coverImageUrl = articleCoverImageUrlInput.value.trim();
        const tagsArray = tagsString ? tagsString.split(',').map(tag => tag.trim()).filter(tag => tag) : [];

        try {
            const articlesCollectionRef = collection(db, "articles");
            let authorNameResolved = currentUser.displayName || currentUser.email.split('@')[0];
            let authorNationalityCodeResolved = null;

            const userProfileRef = doc(db, "userProfiles", currentUser.uid);
            const userProfileSnap = await getDoc(userProfileRef);
            if (userProfileSnap.exists()) {
                const profileData = userProfileSnap.data();
                if (profileData.nickname) {
                    authorNameResolved = profileData.nickname;
                }
                if (profileData.nationalityCode) {
                    authorNationalityCodeResolved = profileData.nationalityCode;
                }
            }

            const draftArticleData = {
                title: title,
                contentMarkdown: contentMarkdown,
                tags: tagsArray,
                snippet: snippet,
                coverImageUrl: coverImageUrl ? coverImageUrl : null,
                authorId: currentUser.uid,
                authorName: authorNameResolved,
                createdAt: serverTimestamp(), // O un campo 'draftSavedAt'
                updatedAt: serverTimestamp(),
                status: "draft",
                likeCount: 0,
                commentCount: 0,
                likedByUsers: [],
                isFeatured: false,
            };
            if (authorNationalityCodeResolved) {
                draftArticleData.authorNationalityCode = authorNationalityCodeResolved;
            }

            const docRef = await addDoc(articlesCollectionRef, draftArticleData);
            // Qui potresti voler salvare docRef.id per permettere futuri "Salva Bozza" sullo stesso documento
            // magari disabilitando il pulsante "Invia per Revisione" finché non c'è un ID di bozza.
            // Per ora, ogni "Salva Bozza" crea un nuovo documento.
            submissionMessageDiv.textContent = 'Bozza salvata con successo! (ID: ' + docRef.id + ')';
            submissionMessageDiv.className = 'success';
            // Non resettare il form/editor dopo aver salvato una bozza, l'utente potrebbe voler continuare.

        } catch (error) {
            console.error("Errore salvataggio bozza:", error);
            submissionMessageDiv.textContent = `Errore durante il salvataggio della bozza: ${error.message}`;
            submissionMessageDiv.className = 'error';
        } finally {
            saveArticleDraftBtn.disabled = false;
            saveArticleDraftBtn.textContent = 'Salva Bozza';
        }
    });
}

// Event listener DOMContentLoaded per inizializzazione
document.addEventListener('DOMContentLoaded', () => {
    // La chiamata a onAuthStateChanged gestirà l'inizializzazione iniziale dell'editor se l'utente è già loggato.
    // Forziamo un controllo dello stato auth per assicurarci che la UI sia corretta al caricamento
    const user = auth.currentUser;
    currentUser = user; // Imposta currentUser globalmente
    toggleFormVisibility(!!user); // Passa un booleano

    if (!user && loginLinkFromSubmitPage && document.getElementById('showLoginBtn')) {
        const newLoginLink = loginLinkFromSubmitPage.cloneNode(true);
        if(loginLinkFromSubmitPage.parentNode){
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