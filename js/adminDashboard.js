// js/adminDashboard.js
import { db, auth } from './main.js';
import {
    collection, query, where, getDocs, doc, getDoc, updateDoc, serverTimestamp, orderBy
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

let easyMDEEditInstance = null;

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
                    autosave: {
                        enabled: false,
                    },
                });
                console.log("EasyMDE per modifica articolo inizializzato.");
            } catch (e) {
                console.error("Errore inizializzazione EasyMDE per modifica:", e);
                editArticleContentTextarea.value = content;
            }
        } else {
            easyMDEEditInstance.value(content);
            console.log("EasyMDE per modifica articolo: contenuto aggiornato.");
        }
    } else {
        console.error("Textarea per EasyMDE (editArticleContent) non trovato nella modale.");
    }
}

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
    if (editArticleContentTextarea) {
        editArticleContentTextarea.value = '';
    }
}

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

        pendingArticlesListDiv.innerHTML = '';
        querySnapshot.forEach((docSnapshot) => {
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
        addEventListenersToAdminArticleButtons();
    } catch (error) {
        console.error("Errore caricamento articoli pending:", error);
        pendingArticlesListDiv.innerHTML = '<p>Errore nel caricamento degli articoli in attesa. Controlla la console.</p>';
    }
}

function addEventListenersToAdminArticleButtons() {
    document.querySelectorAll('.view-edit-btn').forEach(button => {
        button.removeEventListener('click', handleViewEditArticleClick);
        button.addEventListener('click', handleViewEditArticleClick);
    });
    document.querySelectorAll('.approve-btn').forEach(button => {
        button.removeEventListener('click', handleApproveArticleClick);
        button.addEventListener('click', handleApproveArticleClick);
    });
    document.querySelectorAll('.reject-btn').forEach(button => {
        button.removeEventListener('click', handleRejectArticleClick);
        button.addEventListener('click', handleRejectArticleClick);
    });
}

async function handleViewEditArticleClick(e) {
    const articleId = e.target.dataset.id;
    await openEditArticleModal(articleId);
}
async function handleApproveArticleClick(e) {
    const articleId = e.target.dataset.id;
    await approveArticle(articleId);
}
async function handleRejectArticleClick(e) {
    const articleId = e.target.dataset.id;
    await rejectArticle(articleId);
}

async function openEditArticleModal(articleId) {
    if (!editArticleModal || !editingArticleIdInput || !editArticleTitleInput || !editArticleContentTextarea || !editArticleTagsInput || !editArticleSnippetInput || !editArticleCoverImageUrlInput) {
        console.error("Elementi della modale di modifica articolo non trovati.");
        return;
    }
    const articleRef = doc(db, "articles", articleId);
    try {
        const docSnap = await getDoc(articleRef);
        if (docSnap.exists()) {
            const articleData = docSnap.data();
            editingArticleIdInput.value = articleId;
            editArticleTitleInput.value = articleData.title || '';
            initializeOrUpdateEditMarkdownEditor(articleData.contentMarkdown || '');
            editArticleTagsInput.value = (articleData.tags || []).join(', ');
            editArticleSnippetInput.value = articleData.snippet || '';
            editArticleCoverImageUrlInput.value = articleData.coverImageUrl || '';
            if (document.getElementById('editArticleModalTitle')) {
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

function closeEditArticleModal() {
    if (editArticleModal) editArticleModal.style.display = 'none';
    destroyEditMarkdownEditor();
    if (editArticleForm) editArticleForm.reset();
    if (editingArticleIdInput) editingArticleIdInput.value = '';
}

async function approveArticle(articleId) {
    if (!confirm(`Sei sicuro di voler approvare e pubblicare l'articolo ID: ${articleId}?`)) return;
    try {
        const articleRef = doc(db, "articles", articleId);
        await updateDoc(articleRef, {
            status: "published",
            publishedAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
        alert("Articolo approvato e pubblicato con successo!");
        loadPendingArticles();
    } catch (error) {
        console.error("Errore durante l'approvazione dell'articolo:", error);
        alert("Si è verificato un errore durante l'approvazione dell'articolo.");
    }
}

async function rejectArticle(articleId) {
    if (!confirm(`Sei sicuro di voler respingere l'articolo ID: ${articleId}? Lo status diventerà 'rejected'.`)) return;
    try {
        const articleRef = doc(db, "articles", articleId);
        await updateDoc(articleRef, {
            status: "rejected",
            updatedAt: serverTimestamp()
        });
        alert("Articolo respinto.");
        loadPendingArticles();
    } catch (error) {
        console.error("Errore nel respingere l'articolo:", error);
        alert("Si è verificato un errore durante il rigetto dell'articolo.");
    }
}

// --- NUOVA SEZIONE: Gestione Issue Utente per Admin ---
const adminUserIssuesListDiv = document.getElementById('adminUserIssuesList');
const adminFilterIssueTypeSelect = document.getElementById('adminFilterIssueType');
const adminFilterIssueStatusSelect = document.getElementById('adminFilterIssueStatus');
const adminApplyIssueFiltersBtn = document.getElementById('adminApplyIssueFiltersBtn');

const ISSUE_STATUSES = ["new", "underConsideration", "accepted", "planned", "inProgress", "completed", "declined"];
const ISSUE_TYPES = ["generalFeature", "newGameRequest", "gameIssue"];

function formatAdminTimestamp(firebaseTimestamp) {
    if (firebaseTimestamp && typeof firebaseTimestamp.toDate === 'function') {
        return firebaseTimestamp.toDate().toLocaleDateString('it-IT', {
            day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    }
    return 'N/A';
}

function populateSelectWithOptions(selectElement, optionsArray, defaultOptionText, defaultOptionValue = "all") {
    if (!selectElement) return;
    selectElement.innerHTML = ''; 
    if (defaultOptionText) {
        const defaultOpt = document.createElement('option');
        defaultOpt.value = defaultOptionValue;
        defaultOpt.textContent = defaultOptionText;
        selectElement.appendChild(defaultOpt);
    }
    optionsArray.forEach(optionValue => {
        const opt = document.createElement('option');
        opt.value = optionValue;
        let text = optionValue.replace(/([A-Z])/g, ' $1').trim();
        text = text.charAt(0).toUpperCase() + text.slice(1);
        opt.textContent = text;
        selectElement.appendChild(opt);
    });
}

async function loadUserIssuesForAdmin() {
    if (!adminUserIssuesListDiv) {
        console.warn("Elemento adminUserIssuesListDiv non trovato.");
        return;
    }
    adminUserIssuesListDiv.innerHTML = '<p>Caricamento segnalazioni e suggerimenti...</p>';

    try {
        const issuesCollectionRef = collection(db, "userIssues");
        let q_issues;

        const filterType = adminFilterIssueTypeSelect ? adminFilterIssueTypeSelect.value : 'all';
        const filterStatus = adminFilterIssueStatusSelect ? adminFilterIssueStatusSelect.value : 'all';

        const conditions = [];
        if (filterType !== 'all') {
            conditions.push(where("type", "==", filterType));
        }
        if (filterStatus !== 'all') {
            conditions.push(where("status", "==", filterStatus));
        }
        
        const orderByField = "timestamp"; // Ordina sempre per data di invio decrescente

        if (conditions.length > 0) {
            q_issues = query(issuesCollectionRef, ...conditions, orderBy(orderByField, "desc"));
        } else {
            q_issues = query(issuesCollectionRef, orderBy(orderByField, "desc"));
        }

        const querySnapshot = await getDocs(q_issues);

        if (querySnapshot.empty) {
            adminUserIssuesListDiv.innerHTML = '<p>Nessuna segnalazione o suggerimento trovato per i filtri selezionati.</p>';
            return;
        }

        adminUserIssuesListDiv.innerHTML = '';
        querySnapshot.forEach((docSnapshot) => {
            const issue = docSnapshot.data();
            const issueId = docSnapshot.id;
            const itemDiv = document.createElement('div');
            itemDiv.classList.add('article-list-item');

            const submittedDate = formatAdminTimestamp(issue.timestamp);
            const gameIdText = issue.type === 'gameIssue' && issue.gameId ? ` (${issue.gameId})` : '';
            
            // Formattazione del tipo per renderlo più leggibile
            let readableType = issue.type;
            if (issue.type === 'generalFeature') readableType = 'Funzionalità Generale';
            else if (issue.type === 'newGameRequest') readableType = 'Nuovo Gioco';
            else if (issue.type === 'gameIssue') readableType = 'Problema Gioco';


            itemDiv.innerHTML = `
                <span class="article-info" style="flex-basis: 70%;">
                    <strong>${issue.title || '<em>Senza titolo</em>'}</strong> <small>[Tipo: ${readableType}${gameIdText}]</small><br>
                    <small>Autore: ${issue.submittedBy.userName || 'N/D'} | Inviato: ${submittedDate} | Upvotes: ${issue.upvotes || 0}</small><br>
                    <small style="display:block; margin-top:5px; max-height: 60px; overflow-y:auto; background: var(--surface-bg-secondary); padding:5px; border-radius:3px;">Desc: <em>${issue.description.substring(0,150)}${issue.description.length > 150 ? '...' : ''}</em></small>
                </span>
                <span class="actions" style="flex-basis: 30%; text-align:right;">
                    <label for="statusSelect-${issueId}" style="font-size:0.8em; display:block; margin-bottom:3px;">Cambia Stato:</label>
                    <select id="statusSelect-${issueId}" data-id="${issueId}" class="admin-issue-status-select" style="padding: 5px; font-size:0.9em; margin-bottom:5px;">
                        ${ISSUE_STATUSES.map(s_val => {
                            let s_text = s_val.replace(/([A-Z])/g, ' $1').trim();
                            s_text = s_text.charAt(0).toUpperCase() + s_text.slice(1);
                            return `<option value="${s_val}" ${issue.status === s_val ? 'selected' : ''}>${s_text}</option>`;
                        }).join('')}
                    </select>
                </span>
            `;
            adminUserIssuesListDiv.appendChild(itemDiv);
        });

        document.querySelectorAll('.admin-issue-status-select').forEach(select => {
            select.removeEventListener('change', handleIssueStatusChange); // Prevenire listener duplicati
            select.addEventListener('change', handleIssueStatusChange);
        });

    } catch (error) {
        console.error("Errore caricamento issue per admin:", error);
        if (adminUserIssuesListDiv) {
            if (error.code === 'failed-precondition') {
                 adminUserIssuesListDiv.innerHTML = '<p>Errore: Indice Firestore mancante per i filtri o ordinamento. Controlla la console del browser per il link per crearlo.</p>';
            } else {
                 adminUserIssuesListDiv.innerHTML = '<p>Errore nel caricamento delle segnalazioni. Controlla la console.</p>';
            }
        }
    }
}

async function handleIssueStatusChange(event) {
    const selectElement = event.target;
    const issueId = selectElement.dataset.id;
    const newStatus = selectElement.value;

    if (!issueId || !newStatus) {
        alert("Errore: ID issue o nuovo stato non validi.");
        return;
    }

    if (!confirm(`Sei sicuro di voler cambiare lo stato della issue ID: ${issueId} a "${newStatus}"?`)) {
        const issueRefForOldStatus = doc(db, "userIssues", issueId);
        try {
            const docSnap = await getDoc(issueRefForOldStatus);
            if (docSnap.exists()) {
                selectElement.value = docSnap.data().status;
            }
        } catch (e) { console.error("Errore nel ripristinare select status", e); }
        return;
    }

    try {
        const issueRef = doc(db, "userIssues", issueId);
        await updateDoc(issueRef, {
            status: newStatus,
            updatedAt: serverTimestamp()
        });
        alert(`Stato della issue ${issueId} aggiornato a "${newStatus}".`);
        loadUserIssuesForAdmin();
    } catch (error) {
        console.error("Errore aggiornamento stato issue:", error);
        alert("Si è verificato un errore durante l'aggiornamento dello stato.");
        loadUserIssuesForAdmin();
    }
}
// --- FINE NUOVA SEZIONE ---


async function checkAdminPermissions() {
    const user = auth.currentUser;
    if (user) {
        try {
            const userProfileRef = doc(db, "userProfiles", user.uid);
            const docSnap = await getDoc(userProfileRef);
            if (docSnap.exists() && docSnap.data().isAdmin === true) {
                if (adminAuthMessageDiv) adminAuthMessageDiv.style.display = 'none';
                if (adminDashboardContentDiv) adminDashboardContentDiv.style.display = 'block';
                
                if (adminFilterIssueTypeSelect && adminFilterIssueTypeSelect.options.length <= 1) {
                    populateSelectWithOptions(adminFilterIssueTypeSelect, ISSUE_TYPES, "Tutti i Tipi");
                }
                if (adminFilterIssueStatusSelect && adminFilterIssueStatusSelect.options.length <=1 ) {
                     populateSelectWithOptions(adminFilterIssueStatusSelect, ISSUE_STATUSES, "Tutti gli Stati");
                }

                loadPendingArticles();
                loadUserIssuesForAdmin(); // Chiamata alla nuova funzione

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
            // Aggiungi listener solo se non già presente
            if (loginLink && !loginLink.hasAttribute('data-listener-attached-admin-login')) { 
                loginLink.addEventListener('click', (e) => {
                    e.preventDefault();
                    const showLoginBtnGlobal = document.getElementById('showLoginBtn');
                    if (showLoginBtnGlobal) showLoginBtnGlobal.click();
                });
                loginLink.setAttribute('data-listener-attached-admin-login', 'true');
            }
        }
        if (adminDashboardContentDiv) adminDashboardContentDiv.style.display = 'none';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (closeEditArticleModalBtn) {
        closeEditArticleModalBtn.addEventListener('click', closeEditArticleModal);
    }
    if (editArticleModal) {
        editArticleModal.addEventListener('click', (event) => {
            if (event.target === editArticleModal) {
                closeEditArticleModal();
            }
        });
    }
    if (editArticleForm) {
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
                updatedAt: serverTimestamp()
            };
            try {
                const articleRef = doc(db, "articles", articleId);
                await updateDoc(articleRef, updates);
                alert("Articolo modificato con successo!");
                closeEditArticleModal();
                loadPendingArticles();
            } catch (error) {
                console.error("Errore salvataggio modifiche articolo admin:", error);
                alert("Errore durante il salvataggio delle modifiche dell'articolo.");
            }
        });
    }

    // Aggiungi listener per i filtri delle issue
    if (adminApplyIssueFiltersBtn && !adminApplyIssueFiltersBtn.hasAttribute('data-listener-attached-issues')) {
        adminApplyIssueFiltersBtn.addEventListener('click', loadUserIssuesForAdmin);
        adminApplyIssueFiltersBtn.setAttribute('data-listener-attached-issues', 'true');
    }
});

onAuthStateChanged(auth, (user) => {
    console.log("adminDashboard.js - Auth state changed. User:", user ? user.uid : "null");
    checkAdminPermissions();
    // Rimuoviamo la chiamata duplicata ai listener dei filtri da qui,
    // checkAdminPermissions si occuperà di chiamare le funzioni di caricamento
    // e il DOMContentLoaded si occupa di settare i listener una volta.
});
