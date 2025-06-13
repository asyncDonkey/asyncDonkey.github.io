// js/glitchpedia.js

const glitchpediaModal = document.getElementById('glitchpediaModal');
const closeGlitchpediaModalBtn = document.getElementById('closeGlitchpediaModalBtn');

// Function to open the Glitchpedia modal
export function openGlitchpediaModal() {
    if (glitchpediaModal) {
        glitchpediaModal.style.display = 'flex'; // 'block';
        glitchpediaModal.setAttribute('aria-hidden', 'false');
        console.log('[glitchpedia.js] Glitchpedia modal opened.');
        // Optionally, focus on the first interactive element for accessibility
        const firstFocusable = glitchpediaModal.querySelector('button, a, input, select, [tabindex]:not([tabindex="-1"])');
        if (firstFocusable) {
            // setTimeout is often needed to ensure the modal is fully visible before focusing
            setTimeout(() => firstFocusable.focus(), 50);
        }
    } else {
        console.error('[glitchpedia.js] Glitchpedia modal element not found!');
    }
}

// Function to close the Glitchpedia modal
export function closeGlitchpediaModal() {
    if (glitchpediaModal) {
        glitchpediaModal.style.display = 'none';
        glitchpediaModal.setAttribute('aria-hidden', 'true');
        console.log('[glitchpedia.js] Glitchpedia modal closed.');
        // Return focus to the button that opened it, if possible (requires more complex state management)
        // For simplicity, we just remove focus or return to body
        document.body.focus();
    }
}

// Setup event listeners for the accordion and close button
document.addEventListener('DOMContentLoaded', () => {
    // Add event listener for the close button
    if (closeGlitchpediaModalBtn) {
        closeGlitchpediaModalBtn.addEventListener('click', closeGlitchpediaModal);
    } else {
        console.error('[glitchpedia.js] Close button for Glitchpedia modal not found!');
    }

    const accordionHeaders = document.querySelectorAll('#gameInfoAccordion .accordion-header');

    accordionHeaders.forEach(header => {
        header.addEventListener('click', function() {
            const panel = this.nextElementSibling;
            const icon = this.querySelector('.accordion-icon');
            const isExpanded = this.getAttribute('aria-expanded') === 'true';

            // Close all other open panels
            accordionHeaders.forEach(otherHeader => {
                if (otherHeader !== this) {
                    const otherPanel = otherHeader.nextElementSibling;
                    const otherIcon = otherHeader.querySelector('.accordion-icon');
                    otherHeader.setAttribute('aria-expanded', 'false');
                    otherPanel.style.maxHeight = null;
                    if (otherIcon) otherIcon.textContent = '+'; // Or a suitable icon for collapsed state
                }
            });

            // Toggle current panel
            if (isExpanded) {
                panel.style.maxHeight = null;
                this.setAttribute('aria-expanded', 'false');
                if (icon) icon.textContent = '+';
            } else {
                panel.style.maxHeight = panel.scrollHeight + 'px';
                this.setAttribute('aria-expanded', 'true');
                if (icon) icon.textContent = '-'; // Or a suitable icon for expanded state
            }
        });
    });

    // Initialize all panels as closed and set icons
    accordionHeaders.forEach(header => {
        header.setAttribute('aria-expanded', 'false');
        header.nextElementSibling.style.maxHeight = null;
        const icon = header.querySelector('.accordion-icon');
        if (icon) icon.textContent = '+';
    });

    // Smooth scroll for "Torna al Tutorial" link
    
});

// Initial accordion state: close all by default on load
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('#gameInfoAccordion .accordion-panel').forEach(panel => {
        panel.style.maxHeight = null;
    });
    document.querySelectorAll('#gameInfoAccordion .accordion-header').forEach(header => {
        header.setAttribute('aria-expanded', 'false');
        const icon = header.querySelector('.accordion-icon');
        if (icon) icon.textContent = '+';
    });
});