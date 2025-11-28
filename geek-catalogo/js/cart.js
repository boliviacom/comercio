document.addEventListener('DOMContentLoaded', () => {
    const cartToggleBtn = document.getElementById('cart-toggle-btn');
    const cartModal = document.getElementById('cart-modal');
    const closeCartModalBtn = document.getElementById('close-cart-modal');
    const cartCountSpan = document.getElementById('cart-count');
    const cartItemsList = document.getElementById('cart-items-list');
    const cartEmptyMessage = document.getElementById('cart-empty-message');
    const sendQuoteBtn = document.getElementById('send-quote-btn');
    const quoteForm = document.getElementById('quote-form');
    const clearCartBtn = document.getElementById('clear-cart-btn');

    let quotationCart = [];

    const serviceImagesMap = {
        "Redes Sociales": "images/redes_sociales.webp",
        "Gestión Comercial": "images/mercado.jpg",
        "Gestión de Procesos": "images/soluciones.webp",
        "Gestión Administrativa": "images/inventario.jpg",
        "Tecnología": "images/tecnologia.jpg",
    };

    function loadCartFromStorage() {
        const storedCart = localStorage.getItem('quotationCart');
        if (storedCart) {
            quotationCart = JSON.parse(storedCart);
        }
    }

    function saveCartToStorage() {
        localStorage.setItem('quotationCart', JSON.stringify(quotationCart));
    }

    function updateCartCount() {
        const count = quotationCart.length;
        cartCountSpan.textContent = count;
        if (count > 0) {
            cartCountSpan.classList.remove('hidden');
            sendQuoteBtn.disabled = false;
            if (clearCartBtn) clearCartBtn.disabled = false;
        } else {
            cartCountSpan.classList.add('hidden');
            sendQuoteBtn.disabled = true;
            if (clearCartBtn) clearCartBtn.disabled = true;
        }
    }

    function renderCartItems() {
        cartItemsList.innerHTML = '';

        if (quotationCart.length === 0) {
            cartEmptyMessage.classList.remove('hidden');
        } else {
            cartEmptyMessage.classList.add('hidden');
            quotationCart.forEach(item => {
                const imageSrc = item.image || 'images/default.webp';

                const itemDiv = document.createElement('div');
                itemDiv.classList.add('cart-item', 'flex', 'justify-between', 'items-center', 'py-2');
                itemDiv.innerHTML = `
                    <div class="cart-item-info">
                        <img src="${imageSrc}" alt="${item.name}" class="cart-item-image">
                        <span class="cart-item-name">${item.name}</span>
                    </div>
                    <button class="remove-from-cart" data-name="${item.name}" aria-label="Eliminar ${item.name}">
                        <i class="fas fa-times-circle"></i>
                    </button>
                `;
                cartItemsList.appendChild(itemDiv);
            });
        }
    }

    function updateCatalogButtons() {
        const buttonsToUpdate = document.querySelectorAll('[data-service-name]');
        const selectedNames = quotationCart.map(item => item.name);

        buttonsToUpdate.forEach(button => {
            if (button.id === 'quick-quote-service-btn') {
                button.classList.remove('add-to-cart');
                return;
            }

            const serviceName = button.getAttribute('data-service-name');
            const serviceImage = serviceImagesMap[serviceName];

            button.setAttribute('data-service-image', serviceImage);

            if (selectedNames.includes(serviceName)) {
                button.disabled = true;
                button.textContent = 'Añadido a Cotización';
                button.classList.add('opacity-70', 'cursor-not-allowed', 'bg-gray-400');
                button.classList.remove('add-to-cart');
            } else {
                button.disabled = false;
                button.textContent = 'Añadir al Carrito';
                button.classList.remove('opacity-70', 'cursor-not-allowed', 'bg-gray-400');
                button.classList.add('add-to-cart');
            }
        });
    }

    function refreshUI() {
        renderCartItems();
        updateCartCount();
        updateCatalogButtons();
        saveCartToStorage();
    }

    window.refreshUICart = refreshUI;

    function addItemToCart(name, image) {
        const existingItem = quotationCart.find(item => item.name === name);
        if (existingItem) return;

        quotationCart.push({ name: name, image: image });
        refreshUI();
        showSuccessMessage(name);
    }

    window.addItemToCart = addItemToCart;

    function removeItemFromCart(name) {
        quotationCart = quotationCart.filter(item => item.name !== name);
        refreshUI();
    }

    function clearCart() {
        quotationCart = [];
        localStorage.removeItem('quotationCart');
        refreshUI();
    }

    if (clearCartBtn) {
        clearCartBtn.addEventListener('click', () => {
            if (confirm('¿Estás seguro de que deseas vaciar toda tu lista de cotización?')) {
                clearCart();
            }
        });
    }

    document.addEventListener('click', (e) => {
        const button = e.target.closest('.add-to-cart');

        if (button) {
            const parentAnchor = button.closest('a');
            if (parentAnchor) {
                e.preventDefault();
                e.stopPropagation();
            }

            if (button.disabled) return;

            const serviceName = button.getAttribute('data-service-name');
            const serviceImage = button.getAttribute('data-service-image');

            if (serviceName) {
                addItemToCart(serviceName, serviceImage);
            }
        }
    });

    cartItemsList.addEventListener('click', (e) => {
        if (e.target.closest('.remove-from-cart')) {
            const button = e.target.closest('.remove-from-cart');
            const serviceName = button.getAttribute('data-name');
            if (serviceName) {
                removeItemFromCart(serviceName);
            }
        }
    });

    cartToggleBtn.addEventListener('click', () => {
        cartModal.classList.remove('hidden');
    });

    closeCartModalBtn.addEventListener('click', () => {
        cartModal.classList.add('hidden');
        refreshUI();
    });

    cartModal.addEventListener('click', (e) => {
        if (e.target === cartModal) {
            cartModal.classList.add('hidden');
            refreshUI();
        }
    });

    quoteForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const name = document.getElementById('user-name').value;
        const phone = document.getElementById('user-phone').value;
        const email = document.getElementById('user-email').value;
        const message = document.getElementById('user-message').value;
        const companyPhone = '59167540115';

        const servicesList = quotationCart.map((item, index) => `${index + 1}. ${item.name}`).join('\n');

        let whatsappMessage = `¡Hola Geek! Estoy solicitando una cotización formal para los siguientes servicios:`;
        whatsappMessage += `\n\n*Servicios Seleccionados:*\n${servicesList}`;
        whatsappMessage += `\n\n*Mis Datos:*\n- Nombre: ${name}\n- Teléfono: ${phone}`;

        if (email && email.trim() !== "") {
            whatsappMessage += `\n- Email: ${email}`;
        }

        if (message && message.trim() !== "") {
            whatsappMessage += `\n- Mensaje Adicional: ${message}`;
        }

        const encodedMessage = encodeURIComponent(whatsappMessage);
        const whatsappUrl = `https://wa.me/${companyPhone}?text=${encodedMessage}`;

        window.open(whatsappUrl, '_blank');

        quotationCart = [];
        localStorage.removeItem('quotationCart');
        quoteForm.reset();

        refreshUI();
        cartModal.classList.add('hidden');
    });

    function showSuccessMessage(name) {
        const messageDiv = document.createElement('div');
        messageDiv.textContent = `${name} añadido a la lista.`;

        messageDiv.className = 'fixed top-[5.75rem] right-5 bg-green-500 text-white p-3 rounded-xl shadow-xl z-[100] transition-opacity duration-300';

        document.body.appendChild(messageDiv);

        setTimeout(() => {
            messageDiv.style.opacity = '0';
            setTimeout(() => messageDiv.remove(), 300);
        }, 3000);
    }

    loadCartFromStorage();
    cartModal.classList.add('hidden');
    refreshUI();
});