// finflow/js/src/layout.js
/**
 * Manages the main application layout, including:
 * - Desktop sidebar and mobile bottom navigation interactivity.
 * - Switching between content sections (Dashboard, Budget, etc.).
 * - Handling active states for navigation links.
 * - Logout functionality.
 */
import { logoutUser } from './auth.js';

/**
 * Initializes the main layout, setting up navigation listeners and initial view.
 */
export function initLayout() {
    const navLinks = document.querySelectorAll('.nav-link'); // Desktop sidebar links
    const mobileNavLinks = document.querySelectorAll('.nav-link-mobile'); // Mobile bottom nav links
    const contentSections = document.querySelectorAll('.content-section'); // All page content sections
    const desktopSidebar = document.getElementById('desktop-sidebar');
    const logoutButton = document.getElementById('logout-button');

    // Attach logout functionality to the logout button
    if(logoutButton) {
        logoutButton.addEventListener('click', (e) => {
            e.preventDefault();
            logoutUser();
        });
    }

    /**
     * Sets the active state for a navigation link and updates its icon color.
     * @param {HTMLElement} clickedLink - The navigation link that was clicked.
     * @param {boolean} isMobile - True if the link is from the mobile navigation, false for desktop.
     */
    function setActiveLink(clickedLink, isMobile) {
        const links = isMobile ? mobileNavLinks : navLinks;
        links.forEach(link => {
            link.classList.remove(isMobile ? 'active-link-mobile' : 'active-link');
            if (!isMobile && desktopSidebar.contains(link)) { // Only for desktop sidebar links
                const svg = link.querySelector('svg');
                if (svg) {
                    svg.classList.remove('text-accent-blue');
                    svg.classList.add('text-medium-gray-text');
                }
            }
        });

        clickedLink.classList.add(isMobile ? 'active-link-mobile' : 'active-link');
        if (!isMobile && desktopSidebar.contains(clickedLink)) { // Only for desktop sidebar links
             const svg = clickedLink.querySelector('svg');
            if (svg) {
                svg.classList.remove('text-medium-gray-text');
                svg.classList.add('text-accent-blue');
            }
        }
    }

    /**
     * Shows the specified content section and hides all others.
     * @param {string} sectionId - The ID of the content section to display.
     */
    function showContentSection(sectionId) {
        contentSections.forEach(section => {
            if (section.id === sectionId) {
                section.classList.remove('hidden');
            } else {
                section.classList.add('hidden');
            }
        });
        // Dispatch a custom event that modules can listen to, to know when their section is shown
        // This is useful for modules that need to initialize or refresh data/UI only when visible
        document.dispatchEvent(new CustomEvent('sectionChanged', { detail: { sectionId } }));
    }

    // Attach click listeners to desktop sidebar navigation links
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const sectionId = link.dataset.section; // Get target section from data-section attribute
            if (sectionId) {
                setActiveLink(link, false); // Set this link active (desktop)
                // Synchronize mobile nav active state if a corresponding link exists
                mobileNavLinks.forEach(ml => {
                    if (ml.dataset.section === sectionId) setActiveLink(ml, true);
                });
                showContentSection(sectionId); // Show the target content section
            }
        });
    });

    // Attach click listeners to mobile bottom navigation links
    mobileNavLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const sectionId = link.dataset.section;
            if (sectionId) {
                setActiveLink(link, true); // Set this link active (mobile)
                // Synchronize desktop nav active state
                navLinks.forEach(dl => {
                    if (dl.dataset.section === sectionId) {
                        // Deactivate all desktop links first
                        navLinks.forEach(innerDl => {
                            innerDl.classList.remove('active-link');
                            const svg = innerDl.querySelector('svg');
                            if (svg) { // Reset icon color
                                svg.classList.remove('text-accent-blue');
                                svg.classList.add('text-medium-gray-text');
                            }
                        });
                        // Activate the corresponding desktop link
                        dl.classList.add('active-link');
                        const svg = dl.querySelector('svg');
                        if (svg) { // Set active icon color
                            svg.classList.remove('text-medium-gray-text');
                            svg.classList.add('text-accent-blue');
                        }
                    }
                });
                showContentSection(sectionId);
            }
        });
    });

    // Set initial active state on page load (default to Dashboard)
    function initializeActiveSection() {
        const defaultSection = 'dashboard-section';
        let sectionToShow = defaultSection;

        // If there's a hash in the URL, try to activate that section
        // (This part is an enhancement, not in original brief but good for deep linking)
        // if (window.location.hash) {
        //     const hashSection = window.location.hash.substring(1); // Remove #
        //     if (document.getElementById(hashSection)) {
        //         sectionToShow = hashSection;
        //     }
        // }
        
        let activeLinkSet = false;
        if (navLinks.length > 0 && contentSections.length > 0) {
            const initialActiveLink = Array.from(navLinks).find(link => link.dataset.section === sectionToShow) || navLinks[0];
            if (initialActiveLink) {
                setActiveLink(initialActiveLink, false);
                showContentSection(initialActiveLink.dataset.section);
                activeLinkSet = true;
            }
        }

        if (mobileNavLinks.length > 0 && contentSections.length > 0) {
            const initialActiveMobileLink = Array.from(mobileNavLinks).find(link => link.dataset.section === sectionToShow) || mobileNavLinks[0];
            if (initialActiveMobileLink) {
                 // Set mobile active, especially if desktop nav is hidden or didn't set an active link
                if (!activeLinkSet || (desktopSidebar && desktopSidebar.classList.contains('hidden'))) {
                    setActiveLink(initialActiveMobileLink, true);
                    // Show section based on mobile link if desktop is hidden and didn't already show it
                    if (desktopSidebar && desktopSidebar.classList.contains('hidden') && !activeLinkSet) {
                        showContentSection(initialActiveMobileLink.dataset.section);
                    }
                }
            }
        } else if (!activeLinkSet && contentSections.length > 0) {
            // Fallback if no nav links but sections exist
            showContentSection(sectionToShow);
        }
    }
    initializeActiveSection();
}
