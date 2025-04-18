import { signOut } from 'next-auth/react';
import Router from 'next/router';

// Timeout de sesión en milisegundos (3 minutos)
const SESSION_TIMEOUT = 15 * 60 * 1000;

let timeoutId = null;
let isTimedOut = false;

// Inicializa el timeout de sesión
export const initSessionTimeout = () => {
  // Reinicia el temporizador en la carga inicial
  resetSessionTimeout();
  
  // Añade event listeners para la actividad del usuario
  if (typeof window !== 'undefined') {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    
    events.forEach(event => {
      window.addEventListener(event, resetSessionTimeout);
    });
  }
};

// Reinicia el timeout de sesión
export const resetSessionTimeout = () => {
  // Si ya ha expirado, no reiniciar
  if (isTimedOut) return;
  
  // Limpia el timeout existente
  if (timeoutId) {
    clearTimeout(timeoutId);
  }
  
  // Establece un nuevo timeout
  timeoutId = setTimeout(handleSessionTimeout, SESSION_TIMEOUT);
};

// Maneja la expiración de la sesión
const handleSessionTimeout = async () => {
  isTimedOut = true;
  
  // Cierra la sesión del usuario
  await signOut({ redirect: false });
  
  // Redirige a la página de timeout de sesión
  Router.push('/session-timeout');
};

// Función de limpieza para eliminar event listeners
export const cleanupSessionTimeout = () => {
  if (typeof window !== 'undefined') {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    
    events.forEach(event => {
      window.removeEventListener(event, resetSessionTimeout);
    });
  }
  
  if (timeoutId) {
    clearTimeout(timeoutId);
  }
};