// public/js/utils/guard.js
(function() {
    const rol = sessionStorage.getItem('usuario_rol');
    
    // Si no hay rol en el storage o no es owner, mandarlo al login de inmediato
    if (!rol || rol.toLowerCase() !== 'owner') {
        window.location.href = '/'; 
    }
})();