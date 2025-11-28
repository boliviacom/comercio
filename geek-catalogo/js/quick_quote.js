const QUICK_MODAL_ID = 'quick-quote-service-modal';
const QUICK_WRAPPER_ID = 'quick-service-modal-content-wrapper';
const COMPANY_PHONE = '59167540115';

function renderQuickQuoteModal(serviceName) {
    const modalContentWrapper = document.getElementById(QUICK_WRAPPER_ID);

    modalContentWrapper.innerHTML = `
        <button id="close-quick-service-modal" 
            class="absolute top-4 right-4 text-gray-500 hover:text-gray-800 dark:hover:text-white text-3xl font-light">&times;</button>
        
        <div class="text-center pb-4 mb-4 border-b">
            <h3 class="text-2xl font-extrabold text-theme-color"><i class="fab fa-whatsapp mr-2"></i> Cotización Rápida</h3>
            <p class="text-lg font-bold text-dark-text-geek mt-2">Servicio: ${serviceName}</p>
        </div>

        <form id="whatsapp-quote-service-form" class="space-y-4" data-service-name="${serviceName}">
            <p class="text-sm text-center text-gray-500">Completa tus datos para enviarnos un WhatsApp con tu consulta.</p>

            <input type="text" id="quick-user-name" name="name" placeholder="Tu Nombre Completo" required
                class="input-field-geek w-full p-3 border rounded-lg focus:ring-2">
            <input type="email" id="quick-user-email" name="email" placeholder="Tu Correo Electrónico (Opcional)"
                class="input-field-geek w-full p-3 border rounded-lg focus:ring-2">
            <input type="text" id="quick-user-phone" name="phone" placeholder="Tu Número de WhatsApp (+591...)" required
                class="input-field-geek w-full p-3 border rounded-lg focus:ring-2">
            <textarea id="quick-user-message" name="message" placeholder="¿Tienes alguna pregunta específica? (Opcional)"
                rows="3" class="input-field-geek w-full p-3 border rounded-lg focus:ring-2"></textarea>

            <button type="submit"
                class="btn-whatsapp-geek text-white text-lg font-extrabold py-3 px-6 rounded-xl shadow-xl w-full transition duration-300 flex items-center justify-center">
                <i class="fab fa-whatsapp mr-2 text-2xl"></i> Enviar Mensaje de Cotización
            </button>
        </form>
    `;
}

function sendWhatsAppQuote(form) {
    const name = form.querySelector('#quick-user-name').value;
    const email = form.querySelector('#quick-user-email').value;
    const phone = form.querySelector('#quick-user-phone').value;
    const message = form.querySelector('#quick-user-message').value;
    const serviceName = form.getAttribute('data-service-name');

    let whatsappMessage = `¡Hola Geek! Estoy interesado en el servicio de *${serviceName}* que encontré en su catálogo web.`;
    whatsappMessage += `\n\nMis datos son:`;
    whatsappMessage += `\n- Nombre: ${name}`;
    whatsappMessage += `\n- Correo: ${email}`;
    whatsappMessage += `\n- Teléfono: ${phone}`;

    if (message && message.trim() !== "") {
        whatsappMessage += `\n- Consulta Específica: ${message}`;
    }
    whatsappMessage += `\n\nPor favor, envíenme más información o una cotización.`;

    const encodedMessage = encodeURIComponent(whatsappMessage);
    const whatsappUrl = `https://wa.me/${COMPANY_PHONE}?text=${encodedMessage}`;

    window.open(whatsappUrl, '_blank');

    form.reset();
    const modal = document.getElementById(QUICK_MODAL_ID);
    if (modal) modal.classList.add('hidden');
}

document.addEventListener('DOMContentLoaded', () => {
    document.addEventListener('submit', (e) => {
        if (e.target && e.target.id === 'whatsapp-quote-service-form') {
            e.preventDefault();
            sendWhatsAppQuote(e.target);
        }
    });

    document.addEventListener('click', (e) => {
        if (e.target && e.target.id === 'close-quick-service-modal') {
            const modal = document.getElementById(QUICK_MODAL_ID);
            if (modal) modal.classList.add('hidden');
        }
    });

    document.addEventListener('click', (e) => {
        const modal = document.getElementById(QUICK_MODAL_ID);
        if (modal && e.target === modal) {
            modal.classList.add('hidden');
        }
    });
});

window.setupQuickQuoteButton = function (serviceName) {
    const quickQuoteBtn = document.getElementById('quick-quote-service-btn');
    const quickServiceModal = document.getElementById(QUICK_MODAL_ID);

    if (quickQuoteBtn && quickServiceModal) {
        quickQuoteBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();

            renderQuickQuoteModal(serviceName);

            quickServiceModal.classList.remove('hidden');
        });
    }
}

window.hideQuickQuoteModal = function () {
    const modal = document.getElementById(QUICK_MODAL_ID);
    if (modal) modal.classList.add('hidden');
}