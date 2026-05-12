document.addEventListener('DOMContentLoaded', () => {
    const header = document.querySelector('.header');
    const burger = document.querySelector('.header__burger');
    const overlay = document.querySelector('.header__overlay');
    const mobileLinks = document.querySelectorAll('.header__mobile-link');
    const mobileCta = document.querySelector('.header__mobile-cta');

    if (!header || !burger) return;

    const toggleMenu = (forceState) => {
        const isOpen = forceState !== undefined ? forceState : !header.classList.contains('is-open');
        header.classList.toggle('is-open', isOpen);
        document.body.classList.toggle('menu-open', isOpen);
        burger.setAttribute('aria-expanded', isOpen);
    };

    burger.addEventListener('click', () => toggleMenu());
    if (overlay) overlay.addEventListener('click', () => toggleMenu(false));
    mobileLinks.forEach(link => link.addEventListener('click', () => toggleMenu(false)));
    if (mobileCta) mobileCta.addEventListener('click', () => toggleMenu(false));

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && header.classList.contains('is-open')) toggleMenu(false);
    });

    window.addEventListener('resize', () => {
        if (window.innerWidth > 1024 && header.classList.contains('is-open')) {
            toggleMenu(false);
        }
    });
});