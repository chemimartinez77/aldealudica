// src/pages/_app.tsx
import '../app/globals.css'; // Asegúrese de que la ruta relativa es correcta
import { SessionProvider } from 'next-auth/react';
import type { AppProps } from 'next/app';
import Navbar from '../components/Navbar'

function MyApp({ Component, pageProps }: AppProps) {
  return (
    // Envuelve el Component con el SessionProvider
    <SessionProvider session={pageProps.session}>
        <Navbar />
        <Component {...pageProps} />
    </SessionProvider>
  );
}

export default MyApp;

