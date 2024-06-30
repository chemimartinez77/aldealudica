"use client"

import Link from 'next/link'
import Image from 'next/image'
import { signIn, useSession, signOut } from 'next-auth/react'
import { addUserIfNotExist } from '../utils/supabase-utils'
import { useEffect } from 'react'
import { supabase } from '../utils/supabaseClient'

function Navbar() {

    const { data: session } = useSession()

    useEffect(() => {
        // Asegúrate de que el usuario está definido y que tanto el email como el nombre son strings no vacíos.
        if (session?.user?.email && typeof session.user.email === 'string' &&
            session?.user?.name && typeof session.user.name === 'string') {
            addUserIfNotExist(session.user.email, session.user.name);
        }
    }, [session])

    const handleSignOut = async () => {
        if (session?.user?.id) {
            try {
                // Actualiza el registro de logout en la base de datos
                const { error: logoutHistoryError } = await supabase
                    .from('user_login_history')
                    .update({ logout_time: new Date() })
                    .eq('user_id', session.user.id)
                    .is('logout_time', null);

                if (logoutHistoryError) {
                    console.error('Error updating logout time:', logoutHistoryError);
                }
            } catch (error) {
                console.error('Error during logout:', error);
            }
        }

        // Luego llama a signOut
        await signOut({
            callbackUrl: "/"
        });
    }

    return (
        <nav className='bg-slate-900 flex items-center py-3 justify-between px-24 text-white'>
            <div className="flex items-center gap-4">
                <Image src='/logo.png' alt="Logo" width={40} height={40} className='rounded-full cursor-pointer' />
                <Link href="/" legacyBehavior>
                    <a className="text-xl font-bold">Aldea Lúdica</a>
                </Link>
                {session?.user && (
                    <Link href="/userdata" legacyBehavior>
                        <a className="hover:text-sky-400 transition duration-300 ease-in-out cursor-pointer">Datos de usuario</a>
                    </Link>
                )}
                {session?.user && (
                    <div className="relative group">
                        <a className="hover:text-sky-400 transition duration-300 ease-in-out cursor-pointer">Partidas</a>
                        <div className="absolute hidden group-hover:flex flex-col bg-gray-700 text-white rounded shadow-lg" style={{ top: '100%', left: 0 }}>
                            <Link href="/partidas" legacyBehavior>
                                <a className="block px-4 py-2 hover:bg-gray-600 transition duration-300 ease-in-out whitespace-nowrap">Crear Partida</a>
                            </Link>
                            <Link href="/listado" legacyBehavior>
                                <a className="block px-4 py-2 hover:bg-gray-600 transition duration-300 ease-in-out">Listado</a>
                            </Link>
                        </div>
                    </div>
                )}
            </div>
            {session?.user ? (
                <div className='flex gap-x-2 items-center'>
                    <p>{session.user.name} {session.user.email}</p>
                    {session.user.image && (
                        <Image src={session.user.image} alt="User Image" width={40} height={40} className='rounded-full cursor-pointer' />
                    )}
                    <button onClick={handleSignOut}>
                        Sign Out
                    </button>
                </div>
            ) : (
                <button onClick={() => signIn()} className='bg-sky-400 px-3 py-2 rounded'>
                    Sign In
                </button>
            )}
        </nav>
    )
}

export default Navbar
