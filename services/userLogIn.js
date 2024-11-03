let currentUsername = null; // Variable para almacenar el username actual

// Función para establecer el username actual
const setCurrentUsername = (username) => {
  currentUsername = username; // Guarda el username actual
};

// Función para obtener el username actual
const getCurrentUsername = () => {
  return currentUsername; // Retorna el username actual
};

// Función para limpiar el username actual (logout)
const clearCurrentUsername = () => {
  currentUsername = null; // Limpia el username actual
};

module.exports = {
    setCurrentUsername,
    getCurrentUsername,
    clearCurrentUsername,
}
