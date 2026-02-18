const { z } = require('zod');

// Reglas para el registro
const registroSchema = z.object({
    nombres: z.string().min(2, "El nombre es muy corto").trim(),
    
    // Apellido paterno obligatorio
    apellido_paterno: z.string().min(2, "El apellido paterno es requerido").trim(),
    
    // CAMBIO: Apellido materno obligatorio (quitamos .optional() y .default(""))
    apellido_materno: z.string().min(2, "El apellido materno es requerido").trim(),
    
    correo_electronico: z.string().email("Correo electrónico inválido").toLowerCase().trim(),
    
    password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
    
    // CAMBIO: Celular obligatorio con longitud exacta de 8 dígitos numéricos
    celular: z.string()
        .length(8, "El celular debe tener exactamente 8 dígitos")
        .regex(/^\d+$/, "El celular solo debe contener números"),
    
    // CAMBIO: CI con longitud mínima de 7 (ajustable si necesitas longitud exacta)
    ci: z.string().min(7, "El CI debe tener al menos 7 caracteres").trim(),
    
    // CAMBIO: Roles actualizados según tu lista
    rol: z.enum(['owner', 'admin', 'cliente', 'empleado'], {
        errorMap: () => ({ message: "Rol no válido. Elija: owner, admin, cliente o empleado" })
    }).default('cliente')
});

// Reglas para el login
const loginSchema = z.object({
    email: z.string().email("Correo inválido"),
    password: z.string().min(1, "La contraseña es requerida")
});

module.exports = { registroSchema, loginSchema };