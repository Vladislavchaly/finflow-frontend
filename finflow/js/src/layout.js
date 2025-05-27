import { logoutUser } from './auth.js';

export function initLayout() {
    const navLinks = document.querySelectorAll('.nav-link');
    const mobileNavLinks = document.querySelectorAll('.nav-link-mobile');
    const contentSections = document.querySelectorAll('.content-section');
    const desktopSidebar = document.getElementById('desktop-sidebar');
    const logoutButton = document.getElementById('logout-button'); // Ensure your logout link/button has this ID

    if(logoutButton) {
        logoutButton.addEventListener('click', (e) => {
            e.preventDefault();
            logoutUser();
        });
    }

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

    function showContentSection(sectionId) {
        contentSections.forEach(section => {
            if (section.id === sectionId) {
                section.classList.remove('hidden');
            } else {
                section.classList.add('hidden');
            }
        });
    }

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const sectionId = link.dataset.section;
            if (sectionId) {
                setActiveLink(link, false);
                // Also update mobile nav if the same section exists
                mobileNavLinks.forEach(ml => {
                    if (ml.dataset.section === sectionId) setActiveLink(ml, true);
                });
                showContentSection(sectionId);
            }
        });
    });

    mobileNavLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const sectionId = link.dataset.section;
            if (sectionId) {
                setActiveLink(link, true);
                 // Also update desktop nav if the same section exists
                navLinks.forEach(dl => {
                    if (dl.dataset.section === sectionId) {
                        // Temporarily remove active from all desktop, then set current
                        navLinks.forEach(innerDl => {
                            innerDl.classList.remove('active-link');
                            const svg = innerDl.querySelector('svg');
                            if (svg) {
                                svg.classList.remove('text-accent-blue');
                                svg.classList.add('text-medium-gray-text');
                            }
                        });
                        dl.classList.add('active-link');
                        const svg = dl.querySelector('svg');
                        if (svg) {
                            svg.classList.remove('text-medium-gray-text');
                            svg.classList.add('text-accent-blue');
                        }
                    }
                });
                showContentSection(sectionId);
            }
        });
    });

    // Set initial active state based on the first link (Dashboard)
    if (navLinks.length > 0 && contentSections.length > 0) { // check contentSections to avoid error if no sections
        const initialActiveLink = Array.from(navLinks).find(link => link.dataset.section === 'dashboard-section') || navLinks[0];
        setActiveLink(initialActiveLink, false);
        showContentSection(initialActiveLink.dataset.section);
    }
    if (mobileNavLinks.length > 0 && contentSections.length > 0) {
        const initialActiveMobileLink = Array.from(mobileNavLinks).find(link => link.dataset.section === 'dashboard-section') || mobileNavLinks[0];
        // Ensure only one is truly "active" visually if both lists are somehow present
        // but for different screen sizes this logic should be fine.
        // Only set active if it wasn't set by desktop, or if desktop is hidden.
        if (!document.querySelector('.nav-link.active-link') || (desktopSidebar && desktopSidebar.classList.contains('hidden'))) {
             setActiveLink(initialActiveMobileLink, true);
             // Show section based on mobile link if desktop is hidden
             if (desktopSidebar && desktopSidebar.classList.contains('hidden')) {
                showContentSection(initialActiveMobileLink.dataset.section);
             }
        }
    } else if (contentSections.length > 0) {
        showContentSection('dashboard-section'); // Default if no nav links
    }
}
