// js/articleSubmission.js
import { db, auth } from './main.js';
import {
    doc, setDoc, addDoc, collection, serverTimestamp, getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// Riferimenti DOM
const articleSubmissionForm = document.getElementById('articleSubmissionForm');
const articleTitleInput = document.getElementById('articleTitle');
const articleContentInput = document.getElementById('articleContent');
const articleTagsInput = document.getElementById('articleTags');
const articleSnippetInput = document.getElementById('articleSnippet');
const articleCoverImageUrlInput = document.getElementById('articleCoverImageUrl');
const submitArticleForReviewBtn = document.getElementById('submitArticleForReviewBtn');
const saveArticleDraftBtn = document.getElementById('saveArticleDraftBtn');
const submissionMessageDiv = document.getElementById('submissionMessage');
const authRequiredMessageDiv = document.getElementById('authRequiredMessage');
const loginLinkFromSubmitPage = document.getElementById('loginLinkFromSubmitPage');

let currentUser = null;

function toggleFormVisibility(isLoggedIn) {
    if (isLoggedIn) {
        if(authRequiredMessageDiv) authRequiredMessageDiv.style.display = 'none';
        if(articleSubmissionForm) articleSubmissionForm.style.display = 'block';
    } else {
        if(authRequiredMessageDiv) authRequiredMessageDiv.style.display = 'block';
        if(articleSubmissionForm) articleSubmissionForm.style.display = 'none';
    }
}

onAuthStateChanged(auth, (user) => {
    currentUser = user;
    toggleFormVisibility(!!user);
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

if (articleSubmissionForm) {
    articleSubmissionForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!currentUser) {
            submissionMessageDiv.textContent = 'Devi essere loggato per inviare un articolo.';
            submissionMessageDiv.className = 'error';
            return;
        }

        const title = articleTitleInput.value.trim();
        const contentMarkdownFromInput = articleContentInput.value.trim(); // Nome variabile locale diverso per chiarezza
        const tagsString = articleTagsInput.value.trim();
        const snippet = articleSnippetInput.value.trim();
        const coverImageUrl = articleCoverImageUrlInput.value.trim();

        if (!title || !contentMarkdownFromInput) {
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
                contentMarkdown: contentMarkdownFromInput, // Campo corretto per Firestore
                tags: tagsArray,
                snippet: snippet,
                coverImageUrl: coverImageUrl ? coverImageUrl : null, // Invia null esplicitamente se vuoto
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

        const contentMarkdownFromInput = articleContentInput.value.trim();
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
                contentMarkdown: contentMarkdownFromInput, // Campo corretto
                tags: tagsArray,
                snippet: snippet,
                coverImageUrl: coverImageUrl ? coverImageUrl : null, // Invia null esplicitamente se vuoto
                authorId: currentUser.uid,
                authorName: authorNameResolved,
                createdAt: serverTimestamp(),
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

            submissionMessageDiv.textContent = 'Bozza salvata con successo! (ID: ' + docRef.id + ')';
            submissionMessageDiv.className = 'success';

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

document.addEventListener('DOMContentLoaded', () => {
    toggleFormVisibility(!!auth.currentUser);
    currentUser = auth.currentUser;
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