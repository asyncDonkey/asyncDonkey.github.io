document.addEventListener('DOMContentLoaded', function() {

  // --- Smooth Scrolling for navigation links ---
  const navLinks = document.querySelectorAll('header nav a[href^="#"]');

  navLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault(); // Prevents immediate jump

      const targetId = this.getAttribute('href'); // Gets the section ID (e.g., "#about")
      const targetElement = document.querySelector(targetId); // Finds the target element

      if (targetElement) {
        targetElement.scrollIntoView({
          behavior: 'smooth', // Enables smooth scrolling
          block: 'start' // Aligns the start of the target element with the start of the viewport
        });
      }
    });
  });

  // --- "Scroll to Top" Button ---
  const scrollToTopBtn = document.getElementById('scrollToTopBtn');
  const scrollThreshold = 200; // Show button after scrolling 200px

  // Show/hide button based on scroll
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

  // Action on button click: scroll to top
  scrollToTopBtn.addEventListener('click', function() {
    window.scrollTo({
      top: 0,
      behavior: 'smooth' // Smooth scrolling here too
    });
  });
  
  // --- Interactive Skills Section ---
  console.log('Initializing interactive skills section...'); 

  const skillBadges = document.querySelectorAll('#skills ul li[data-skill-name]');
  const skillDetailsContainer = document.getElementById('skillDetails');
  let currentlyActiveSkillBadge = null;

  if (!skillDetailsContainer) {
    console.error('#skillDetails element not found! Cannot display skill details.');
  }
  if (skillBadges.length === 0) {
    console.warn('No skill badges with data-skill-name attribute found.');
  } else {
    console.log(`Found ${skillBadges.length} interactive skill badges.`);
  }

  skillBadges.forEach(badge => {
    badge.addEventListener('click', function() {
      const skillName = this.dataset.skillName;
      const skillDescription = this.dataset.description || "No further details available for this skill yet.";
      
      console.log(`Skill badge clicked: ${skillName}`);

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
  const bodyElement = document.body; 

  const moonIcon = '🌙';
  const sunIcon = '☀️';

  // Function to apply theme and save preference
  function applyTheme(theme) {
    if (theme === 'dark') {
      bodyElement.classList.add('dark-mode');
      if(themeToggleBtn) themeToggleBtn.textContent = sunIcon; // Show sun to switch to light
      localStorage.setItem('theme', 'dark');
      console.log('Theme applied: dark');
    } else {
      bodyElement.classList.remove('dark-mode');
      if(themeToggleBtn) themeToggleBtn.textContent = moonIcon; // Show moon to switch to dark
      localStorage.setItem('theme', 'light');
      console.log('Theme applied: light');
    }
  }

  // Check saved preference or system preference on load
  function initializeTheme() {
    const savedTheme = localStorage.getItem('theme');
    const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (savedTheme) {
      applyTheme(savedTheme);
    } else if (prefersDarkScheme) {
      applyTheme('dark');
    } else {
      applyTheme('light'); // Default to light theme if no preference
    }
  }

  // Event Listener for the button
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

  // Initialize theme on page load
  initializeTheme();
});