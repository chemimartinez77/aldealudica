import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { getSession, useSession } from 'next-auth/react';
import Link from 'next/link';
import styles from '../styles/PartidaDetails.module.css';

export default function Home({ initialUpcomingGames, initialLastGames, initialIsLoggedIn }) {
  const { data: session, status } = useSession();
  const [upcomingGames, setUpcomingGames] = useState(initialUpcomingGames);
  const [lastGames, setLastGames] = useState(initialLastGames);
  const [isLoggedIn, setIsLoggedIn] = useState(initialIsLoggedIn);
  const [loading, setLoading] = useState(false);

  // Efecto para cargar datos cuando la sesión cambia
  useEffect(() => {
    const fetchUserGames = async () => {
      if (session && session.user) {
        setLoading(true);
        try {
          const userId = session.user.id;
          const res = await fetch(`/api/partidas/user/${userId}`);
          const data = await res.json();

          if (data && Array.isArray(data.partidas)) {
            const now = new Date();
            const future = [];
            const past = [];
            
            data.partidas.forEach((p) => {
              if (new Date(p.date) >= now) {
                future.push(p);
              } else {
                past.push(p);
              }
            });
            
            setUpcomingGames(future.sort((a, b) => new Date(a.date) - new Date(b.date)));
            setLastGames(past.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10));
            setIsLoggedIn(true);
          }
        } catch (error) {
          console.error("Error fetching user games:", error);
        } finally {
          setLoading(false);
        }
      } else if (status === "unauthenticated") {
        setIsLoggedIn(false);
        setUpcomingGames([]);
        setLastGames([]);
      }
    };

    fetchUserGames();
  }, [session, status]);

  const renderPartidaItem = (partida) => (
    <li key={partida.id} className="flex items-center gap-4 mb-4">
      {/* Imagen del juego */}
      {partida.gameDetails?.image && (
        <img
          src={partida.gameDetails.image}
          alt={partida.gameDetails.name || 'Juego'}
          style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 8 }}
        />
      )}
      <div>
        <Link href={`/partidas/${partida.id}`}>
          <span className="font-medium hover:underline cursor-pointer">{partida.title}</span>
        </Link>
        {' - '}
        {new Date(partida.date).toLocaleDateString('es-ES')} ({partida.startTime} - {partida.endTime})
        {/* Chips de participantes */}
        <div className={styles.chipList} style={{ marginTop: 4 }}>
          {partida.participants?.map((p) => (
            <span key={p._id} className={styles.chip}>
              {p.name}
            </span>
          ))}
        </div>
      </div>
    </li>
  );

  return (
    <Layout>
      <h1 className="text-3xl font-bold">Bienvenido a la Aldea Lúdica</h1>
      <p className="mt-4">El lugar de encuentro de todos los aldeanos.</p>

      {isLoggedIn && (
        <section className="mt-8">
          <h2 className="text-xl font-semibold mb-2">Tus próximas partidas</h2>
          {loading ? (
            <p>Cargando tus partidas...</p>
          ) : upcomingGames.length === 0 ? (
            <p>No estás apuntado a ninguna partida, ¿por qué no montas una?</p>
          ) : (
            <ul className="pl-0">
              {upcomingGames.map(renderPartidaItem)}
            </ul>
          )}
        </section>
      )}

      {isLoggedIn && lastGames.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xl font-semibold mb-2">Tus últimas partidas jugadas</h2>
          {loading ? (
            <p>Cargando tus partidas anteriores...</p>
          ) : (
            <ul className="pl-0">
              {lastGames.map(renderPartidaItem)}
            </ul>
          )}
        </section>
      )}
    </Layout>
  );
}

export async function getServerSideProps(context) {
  // Renombramos las props para indicar que son valores iniciales
  const session = await getSession(context);

  if (!session) {
    return {
      props: {
        initialIsLoggedIn: false,
        initialUpcomingGames: [],
        initialLastGames: [],
      },
    };
  }

  const userId = session.user.id;
  let upcomingGames = [];
  let lastGames = [];

  try {
    // Cambia la URL si tu API está en otro dominio/puerto
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/partidas/user/${userId}`);
    const data = await res.json();

    if (data && Array.isArray(data.partidas)) {
      const now = new Date();
      const future = [];
      const past = [];
      data.partidas.forEach((p) => {
        if (new Date(p.date) >= now) {
          future.push(p);
        } else {
          past.push(p);
        }
      });
      upcomingGames = future.sort((a, b) => new Date(a.date) - new Date(b.date));
      lastGames = past.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10);
    }
  } catch (e) {
    // Si hay error, simplemente deja los arrays vacíos
  }

  return {
    props: {
      initialIsLoggedIn: true,
      initialUpcomingGames: upcomingGames,
      initialLastGames: lastGames,
    },
  };
}
