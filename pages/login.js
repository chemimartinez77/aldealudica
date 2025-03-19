// login.js
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export default function LoginPage() {
    const { data: session } = useSession();
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    // Si el usuario ya está autenticado, redirigirlo a la página principal
    useEffect(() => {
        if (session) {
            router.push("/");
        }
    }, [session, router]);

    // Manejar inicio de sesión con Google
    const handleLogin = async () => {
        setLoading(true);
        await signIn("google");
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
            <div className="bg-white p-6 rounded-lg shadow-md text-center relative">
                <h1 className="text-2xl font-bold mb-4">Iniciar sesión</h1>

                {/* Botón Google Estilizado */}
                <button
                    onClick={handleLogin}
                    className="flex items-center justify-center w-64 bg-white border border-gray-300 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 py-3"
                    disabled={loading}
                >
                    {/* Logo de Google */}
                    <img
                        src="/googlelogo.svg"
                        alt="Google Logo"
                        className="h-6 w-6 mr-3"
                    />

                    {/* Texto */}
                    <span className="text-gray-700 font-medium">
                        Acceder con Google
                    </span>
                </button>
            </div>

            {/* Modal de carga cuando se hace login */}
            {loading && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                    <div className="bg-blue-100 p-6 rounded-lg text-center shadow-lg">
                        <p className="text-lg font-semibold text-gray-800">
                            Llegando a la Aldea...
                        </p>
                        <div className="mt-4">
                            <svg
                                className="animate-spin h-8 w-8 text-blue-600 mx-auto"
                                viewBox="0 0 24 24"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                ></circle>
                                <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8v8H4z"
                                ></path>
                            </svg>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
