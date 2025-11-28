let currentIndex = 0;
const track = document.getElementById('carousel-track');
const prevButton = document.getElementById('prev-button');
const nextButton = document.getElementById('next-button');
const indicatorsContainer = document.getElementById('indicators');
let testimonialCards = [];
let totalSlides = 0;

function initializeCarousel() {
    testimonialCards = Array.from(document.querySelectorAll('.testimonial-card'));
    totalSlides = testimonialCards.length;
}

function renderIndicators() {
    indicatorsContainer.innerHTML = '';
    for (let i = 0; i < totalSlides; i++) {
        const indicator = document.createElement('button');
        indicator.className = `w-3 h-3 rounded-full mx-1 transition-all duration-300 focus:outline-none ${i === currentIndex ? 'bg-primary w-5' : 'bg-gray-400 hover:bg-gray-500'}`;
        indicator.addEventListener('click', () => showSlide(i));
        indicatorsContainer.appendChild(indicator);
    }
}

function showSlide(index) {
    if (index >= totalSlides) {
        currentIndex = 0;
    } else if (index < 0) {
        currentIndex = totalSlides - 1;
    } else {
        currentIndex = index;
    }

    testimonialCards.forEach(c => c.classList.remove('slide-active'));

    const offset = -currentIndex * 100;
    track.style.transform = `translateX(${offset}%)`;

    setTimeout(() => {
        if (testimonialCards[currentIndex]) {
            testimonialCards[currentIndex].classList.add('slide-active');
        }
    }, 50);

    renderIndicators();
}

function setupTextToggle() {
    const toggleButtons = document.querySelectorAll('.toggle-btn');

    toggleButtons.forEach(button => {
        button.removeEventListener('click', handleToggleClick);
        button.addEventListener('click', handleToggleClick);

        const container = document.getElementById(button.dataset.target);

        if (!container) {
            console.error(`Error de inicialización: No se encontró el contenedor con ID: ${button.dataset.target}`);
            return;
        }

        const textElement = container.querySelector('.review-text');

        if (!textElement) {
            console.error(`Error de inicialización: No se encontró el elemento de texto .review-text dentro de ${button.dataset.target}`);
            return;
        }

        setTimeout(() => {
            if (textElement.scrollHeight <= textElement.clientHeight) {
                button.style.display = 'none';
            } else {
                button.style.display = 'block';
                button.textContent = 'Mostrar más';
            }
        }, 100);
    });
}

function handleToggleClick(event) {
    const button = event.target;
    const containerId = button.dataset.target;
    const container = document.getElementById(containerId);

    if (!container) {
        console.error(`Error de toggle: No se encontró el contenedor con ID: ${containerId}`);
        return;
    }

    if (container.classList.contains('expanded')) {
        container.classList.remove('expanded');
        button.textContent = 'Mostrar más';
    } else {
        container.classList.add('expanded');
        button.textContent = 'Mostrar menos';
    }
}


function nextSlide() {
    showSlide(currentIndex + 1);
}

function prevSlide() {
    showSlide(currentIndex - 1);
}

document.addEventListener('DOMContentLoaded', () => {
    if (track && prevButton && nextButton && indicatorsContainer) {
        initializeCarousel();

        nextButton.addEventListener('click', nextSlide);
        prevButton.addEventListener('click', prevSlide);

        setupTextToggle();

        showSlide(0);

    } else {
        console.error("Error: No se encontraron todos los elementos del carrusel. Verifique IDs en HTML (carousel-track, prev-button, next-button, indicators).");
    }
});