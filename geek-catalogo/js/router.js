const CATALOGO_CONTAINER = document.getElementById('catalogo-container');
const DETAIL_CONTAINER = document.getElementById('service-detail-container');
const DOCUMENT_TITLE = document.title;

let allServicesData = [];

function loadServiceDataAndSetupRouter() {
    fetch('servicios.json')
        .then(response => {
            if (!response.ok) {
                throw new Error(`Error al cargar servicios.json: ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            allServicesData = data;
            console.log("Datos de servicios cargados:", allServicesData.length);

            handleRoute();
            window.addEventListener('hashchange', handleRoute);

            if (window.refreshUICart) window.refreshUICart();

        })
        .catch(error => console.error("Error fatal en el Router:", error));
}

function handleRoute() {
    if (window.hideQuickQuoteModal) window.hideQuickQuoteModal();

    const hash = window.location.hash;

    if (hash.startsWith('#/servicios/')) {
        const serviceId = hash.substring('#/servicios/'.length);
        renderDetailPage(serviceId);
    } else {
        showCatalog();
    }
}

function renderDetailPage(serviceId) {
    const service = allServicesData.find(s => s.id === serviceId);

    if (service) {
        document.title = `Geek | ${service.nombre}`;

        const servicesList = service.servicios_ofrecidos.map(item => `
            <li class="flex items-start mb-2">
                <i class="fas fa-check-circle text-xl mr-3 text-theme-color dark:text-mint-300 mt-1 flex-shrink-0"></i>
                <p class="text-lg text-dark-text-geek">${item}</p> 
            </li>
        `).join('');

        if (DETAIL_CONTAINER) {
            DETAIL_CONTAINER.innerHTML = `
                <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16"> 
                    
                    <a href="#/" class="inline-flex items-center text-sm font-semibold text-gray-500 hover:text-theme-color dark:text-gray-400 dark:hover:text-mint-300 mb-8">
                       <i class="fas fa-arrow-left mr-1"></i> Volver al Catálogo
                    </a>

                    <div class="p-0">
                        <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 border-b pb-10 mb-10 border-gray-200 dark:border-gray-700">
                            <div>
                                <img src="${service.ruta_imagen}" alt="Imagen de ${service.nombre}" class="rounded-xl shadow-lg w-full h-auto object-cover">
                            </div>
                            
                            <div>
                                <h1 class="text-4xl md:text-5xl font-extrabold text-theme-color mb-3">${service.nombre}</h1>
                                <p class="text-xl text-dark-text-geek mb-6">${service.descripcion_corta}</p>

                                <h2 class="text-2xl font-bold text-dark-text-geek mb-4">Servicios Clave Incluidos:</h2>
                                <ul class="list-none space-y-2">
                                    ${servicesList}
                                </ul>

                                <div class="mt-8 space-y-4">
                                    <button 
                                        id="add-to-cart-detail-btn"
                                        class="add-to-cart py-3 px-8 rounded-xl shadow-lg w-full block font-semibold text-lg btn-theme-color" 
                                        data-service-name="${service.nombre}" 
                                        data-service-image="${service.ruta_imagen}"
                                    >
                                        Añadir a Cotización <i class="fas fa-cart-plus ml-2"></i>
                                    </button>
                                    
                                    <button 
                                        id="quick-quote-service-btn"
                                        class="py-3 px-8 rounded-xl shadow-lg w-full block font-semibold text-lg btn-whatsapp-geek text-white"
                                        data-service-name="${service.nombre}"
                                    >
                                        <i class="fab fa-whatsapp mr-2 text-xl"></i> Cotizar por WhatsApp
                                    </button>
                                </div>
                            </div>
                        </div>
                        
                        <div class="max-w-4xl mx-auto">
                            <h2 class="text-3xl font-extrabold text-center text-theme-color mb-6">
                                Detalles y Alcance del Servicio
                            </h2>
                            <p class="text-lg leading-relaxed text-dark-text-geek">
                                ${service.descripcion_larga}
                            </p>
                        </div>
                    </div>
                </div>
                `;
        }

        if (window.setupQuickQuoteButton) window.setupQuickQuoteButton(service.nombre);

        if (CATALOGO_CONTAINER) CATALOGO_CONTAINER.classList.add('hidden');
        if (DETAIL_CONTAINER) DETAIL_CONTAINER.classList.remove('hidden');
        window.scrollTo(0, 0);

        if (window.refreshUICart) window.refreshUICart();

    } else {
        showCatalog();
    }
}

function showCatalog() {
    document.title = DOCUMENT_TITLE;

    if (CATALOGO_CONTAINER) CATALOGO_CONTAINER.classList.remove('hidden');
    if (DETAIL_CONTAINER) DETAIL_CONTAINER.classList.add('hidden');

    if (window.refreshUICart) window.refreshUICart();
}

document.addEventListener('DOMContentLoaded', loadServiceDataAndSetupRouter);