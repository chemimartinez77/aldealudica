import React, { useEffect } from "react";
import "../styles/globals.css";
import { SessionProvider, useSession } from "next-auth/react";
import { ChakraProvider } from "@chakra-ui/react";
import theme from "../lib/theme";
import { initSessionTimeout, cleanupSessionTimeout } from '../utils/sessionTimeout';

// Componente para inicializar el timeout de sesión solo para usuarios autenticados
function SessionTimeoutHandler({ children }) {
  const { data: session } = useSession();
  
  useEffect(() => {
    // Solo inicializa el timeout para usuarios autenticados
    if (session) {
      initSessionTimeout();
      
      // Limpieza al desmontar
      return () => {
        cleanupSessionTimeout();
      };
    }
  }, [session]);
  
  return children;
}

export default function MyApp({ Component, pageProps }) {
  useEffect(() => {
    async function subscribeToPush() {
      try {
        if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
          console.log("Service Workers o PushManager no soportados");
          return;
        }

        // Registra el Service Worker
        const registration = await navigator.serviceWorker.register("/sw.js");
        console.log("Service Worker registrado:", registration);

        // Solicita permiso para notificaciones
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          console.log("Permiso para notificaciones denegado");
          return;
        }

        // Verifica si ya existe una suscripción
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          console.log("Ya existe una suscripción a Push:", subscription);
          return;
        }

        // Convierte la clave pública VAPID
        const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        if (!vapidPublicKey) {
          console.error("NEXT_PUBLIC_VAPID_PUBLIC_KEY no está definida");
          return;
        }
        const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);

        // Suscribe al usuario a las notificaciones push
        const newSubscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedVapidKey,
        });
        console.log("Suscripción exitosa:", newSubscription);

        // Envía la suscripción al servidor
        const response = await fetch("/api/subscribe", {
          method: "POST",
          credentials: 'include', // Añadir esta línea
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(newSubscription),
        });

        if (response.ok) {
          console.log("Suscripción guardada en el servidor");
        } else {
          console.error("Error guardando la suscripción:", response.statusText);
        }
      } catch (error) {
        console.error("Error al suscribirse a notificaciones push:", error);
      }
    }

    // Ejecuta la función solo en el navegador
    if (typeof window !== "undefined") {
      subscribeToPush();
    }
  }, []);

  // Función para convertir la clave VAPID en Uint8Array
  function urlBase64ToUint8Array(base64String) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, "+")
      .replace(/_/g, "/");
    const rawData = atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  return (
    <SessionProvider session={pageProps.session}>
      <ChakraProvider theme={theme}>
        <SessionTimeoutHandler>
          <Component {...pageProps} />
        </SessionTimeoutHandler>
      </ChakraProvider>
    </SessionProvider>
  );
}
