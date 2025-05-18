import Layout from '../components/Layout';
import { getSession } from 'next-auth/react';
import Link from 'next/link';

export default function Home({ upcomingGames, lastGames, isLoggedIn }) {
  return (
    <Layout>
      <h1 className="text-3xl font-bold">Bienvenido a la Aldea Lúdica</h1>
      <p className="mt-4">El lugar de encuentro de todos los aldeanos.</p>

      {isLoggedIn && (
        <section className="mt-8">
          <h2 className="text-xl font-semibold mb-2">Tus próximas partidas</h2>
          {upcomingGames.length === 0 ? (
            <p>No estás apuntado a ninguna partida, ¿por qué no montas una?</p>
          ) : (
            <ul className="list-disc pl-6">
              {upcomingGames.map((partida) => (
                <li key={partida.id}>
                  <Link href={`/partidas/${partida.id}`}>
                    <span className="font-medium hover:underline cursor-pointer">{partida.title}</span>
                  </Link>
                  {' - '}
                  {new Date(partida.date).toLocaleDateString('es-ES')} ({partida.startTime} - {partida.endTime})
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {isLoggedIn && lastGames.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xl font-semibold mb-2">Tus últimas partidas jugadas</h2>
          <ul className="list-disc pl-6">
            {lastGames.map((partida) => (
              <li key={partida.id}>
                <Link href={`/partidas/${partida.id}`}>
                  <span className="font-medium hover:underline cursor-pointer">{partida.title}</span>
                </Link>
                {' - '}
                {new Date(partida.date).toLocaleDateString('es-ES')} ({partida.startTime} - {partida.endTime})
              </li>
            ))}
          </ul>
        </section>
      )}
    </Layout>
  );
}

export async function getServerSideProps(context) {
  const session = await getSession(context);

  if (!session) {
    return {
      props: {
        isLoggedIn: false,
        upcomingGames: [],
        lastGames: [],
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
      isLoggedIn: true,
      upcomingGames,
      lastGames,
    },
  };
}
