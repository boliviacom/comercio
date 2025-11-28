document.addEventListener('DOMContentLoaded', () => {
    const burgerMenu = document.querySelector('.burger-menu');
    const mainNav = document.getElementById('main-nav');
    const navLinks = mainNav ? mainNav.querySelectorAll('a') : [];

    if (burgerMenu) {
        burgerMenu.addEventListener('click', () => {
            mainNav.classList.toggle('open');
            burgerMenu.classList.toggle('open');
        });

        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                if (mainNav.classList.contains('open')) {
                    mainNav.classList.remove('open');
                    burgerMenu.classList.remove('open');
                }
            });
        });
    }

    const carousel = document.getElementById('services-carousel');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const dotsContainer = document.getElementById('services-dots-container');
    const serviceCards = carousel ? carousel.querySelectorAll('.service-card') : [];

    if (carousel && prevBtn && nextBtn && dotsContainer && serviceCards.length > 0) {

        const getCardsPerView = () => {
            if (window.innerWidth >= 1024) return 3;
            if (window.innerWidth >= 640) return 2;
            return 1;
        };

        let cardsPerView = getCardsPerView();
        let totalPages = Math.ceil(serviceCards.length / cardsPerView);
        let currentPage = 0;
        let cardWidth = serviceCards[0].offsetWidth + 20;

        const updateMetrics = () => {

            cardsPerView = getCardsPerView();
            cardWidth = serviceCards[0].offsetWidth + 20;
            totalPages = Math.ceil(serviceCards.length / cardsPerView);
        }


        const createDots = () => {
            dotsContainer.innerHTML = '';
            updateMetrics();

            for (let i = 0; i < totalPages; i++) {
                const dot = document.createElement('span');
                dot.classList.add('service-dot');
                if (i === currentPage) dot.classList.add('active-dot');

                dot.addEventListener('click', () => {
                    currentPage = i;
                    scrollToPage(currentPage);
                });
                dotsContainer.appendChild(dot);
            }
            updateButtons();
        };


        const scrollToPage = (pageIndex) => {
            const scrollDistance = cardWidth * cardsPerView * pageIndex;
            carousel.scroll({
                left: scrollDistance,
                behavior: 'smooth'
            });
            currentPage = pageIndex;
            updateDots();
            updateButtons();
        };


        const updateDots = () => {
            const dots = dotsContainer.querySelectorAll('.service-dot');
            dots.forEach((dot, index) => {
                dot.classList.toggle('active-dot', index === currentPage);
            });
        };


        const updateButtons = () => {
            prevBtn.disabled = (currentPage === 0);
            nextBtn.disabled = (currentPage >= totalPages - 1);
            prevBtn.style.opacity = prevBtn.disabled ? '0.5' : '1';
            nextBtn.style.opacity = nextBtn.disabled ? '0.5' : '1';
        };



        const updateCurrentPage = () => {
            const scrollLeft = carousel.scrollLeft;


            const scrollUnit = cardWidth * cardsPerView;


            currentPage = Math.round(scrollLeft / scrollUnit);


            currentPage = Math.min(Math.max(0, currentPage), totalPages - 1);

            updateDots();
            updateButtons();
        };


        prevBtn.addEventListener('click', () => {
            currentPage = Math.max(0, currentPage - 1);
            scrollToPage(currentPage);
        });

        nextBtn.addEventListener('click', () => {
            currentPage = Math.min(totalPages - 1, currentPage + 1);
            scrollToPage(currentPage);
        });


        carousel.addEventListener('scroll', () => {

            clearTimeout(carousel.scrollTimeout);
            carousel.scrollTimeout = setTimeout(updateCurrentPage, 100);
        });


        createDots();
        window.addEventListener('resize', () => {


            currentPage = 0;
            createDots();
            scrollToPage(currentPage);
        });
    }
});