document.addEventListener('DOMContentLoaded', function() {

    // --- Smooth Scrolling per i link di navigazione ---
    const navLinks = document.querySelectorAll('header nav a[href^="#"]');
  
    navLinks.forEach(link => {
      link.addEventListener('click', function(e) {
        e.preventDefault(); // Previene il salto immediato
  
        const targetId = this.getAttribute('href'); // Ottiene l'ID della sezione (es. "#about")
        const targetElement = document.querySelector(targetId); // Trova l'elemento target
  
        if (targetElement) {
          targetElement.scrollIntoView({
            behavior: 'smooth', // Abilita lo scrolling dolce
            block: 'start' // Allinea l'inizio dell'elemento target con l'inizio del viewport
          });
        }
      });
    });
  
    // --- Bottone "Scroll to Top" ---
    const scrollToTopBtn = document.getElementById('scrollToTopBtn');
    const scrollThreshold = 200; // Mostra il bottone dopo aver scrollato di 200px
  
    // Mostra/nascondi il bottone in base allo scroll
    window.addEventListener('scroll', function() {
      if (window.pageYOffset > scrollThreshold) {
        if (!scrollToTopBtn.classList.contains('show')) {
          scrollToTopBtn.classList.add('show');
        }
      } else {
        if (scrollToTopBtn.classList.contains('show')) {
          scrollToTopBtn.classList.remove('show');
        }
      }
    });
  
    // Azione al click del bottone: scrolla in cima
    scrollToTopBtn.addEventListener('click', function() {
      window.scrollTo({
        top: 0,
        behavior: 'smooth' // Scrolling dolce anche qui
      });
    });
    
    //   // --- Interactive Skills Section ---
    console.log('Initializing interactive skills section...'); // Debug log

    const skillBadges = document.querySelectorAll('#skills ul li[data-skill-name]');
    const skillDetailsContainer = document.getElementById('skillDetails');
    let currentlyActiveSkillBadge = null;

    if (!skillDetailsContainer) {
      console.error('#skillDetails element not found! Cannot display skill details.'); // Translated
    }
    if (skillBadges.length === 0) {
      console.warn('No skill badges with data-skill-name attribute found.'); // Translated
    } else {
      console.log(`Found ${skillBadges.length} interactive skill badges.`); // Translated
    }

    skillBadges.forEach(badge => {
      badge.addEventListener('click', function() {
        const skillName = this.dataset.skillName;
        const skillDescription = this.dataset.description || "No further details available for this skill yet."; // Translated
        
        console.log(`Skill badge clicked: ${skillName}`); // Translated

        // Remove 'active-skill' class from the previously active badge (if any)
        if (currentlyActiveSkillBadge) {
          currentlyActiveSkillBadge.classList.remove('active-skill');
        }

        // Add 'active-skill' class to the clicked badge
        this.classList.add('active-skill');
        currentlyActiveSkillBadge = this; // Update the reference to the active badge

        // Update the content of the details container
        if (skillDetailsContainer) {
          skillDetailsContainer.innerHTML = `
            <h3>${skillName}</h3>
            <p>${skillDescription}</p>
          `;
        }
      });
    });

    // --- Theme Switcher (Light/Dark Mode) ---
console.log('Initializing Theme Switcher...');

const themeToggleBtn = document.getElementById('themeToggleBtn');
const bodyElement = document.body; // O document.documentElement per applicare la classe a <html>

const moonIcon = '🌙';
const sunIcon = '☀️';

// Funzione per applicare il tema e salvare la preferenza
function applyTheme(theme) {
  if (theme === 'dark') {
    bodyElement.classList.add('dark-mode');
    themeToggleBtn.textContent = sunIcon; // Mostra il sole per passare a light
    localStorage.setItem('theme', 'dark');
    console.log('Theme applied: dark');
  } else {
    bodyElement.classList.remove('dark-mode');
    themeToggleBtn.textContent = moonIcon; // Mostra la luna per passare a dark
    localStorage.setItem('theme', 'light');
    console.log('Theme applied: light');
  }
}

// Controlla la preferenza salvata o la preferenza di sistema al caricamento
function initializeTheme() {
  const savedTheme = localStorage.getItem('theme');
  const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)').matches;

  if (savedTheme) {
    applyTheme(savedTheme);
  } else if (prefersDarkScheme) {
    applyTheme('dark');
  } else {
    applyTheme('light'); // Default al tema chiaro se nessuna preferenza
  }
}

// Event Listener per il bottone
if (themeToggleBtn) {
  themeToggleBtn.addEventListener('click', () => {
    if (bodyElement.classList.contains('dark-mode')) {
      applyTheme('light');
    } else {
      applyTheme('dark');
    }
  });
  console.log('Theme toggle button event listener added.');
} else {
  console.error('#themeToggleBtn not found!');
}

// Inizializza il tema al caricamento della pagina
initializeTheme();

// });
  });