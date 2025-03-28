// pages/login.js
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export default function LoginPage() {
    const { data: session } = useSession();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        if (session) {
            router.push("/");
        }
    }, [session, router]);

    // Login con Google
    const handleGoogleLogin = async () => {
        setGoogleLoading(true);
        await signIn("google");
    };

    // Login con email/contraseña
    const handleManualLogin = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        const res = await signIn("credentials", {
            redirect: false,
            email,
            password,
        });

        setLoading(false);

        if (res.error) {
            setError("Credenciales inválidas o usuario no verificado.");
        } else {
            router.push("/");
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
            <div className="bg-white p-6 rounded-lg shadow-md text-center relative w-full max-w-sm">
                <h1 className="text-2xl font-bold mb-4">Iniciar sesión</h1>

                <form onSubmit={handleManualLogin} className="space-y-4">
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Correo electrónico"
                        className="w-full border border-gray-300 rounded px-3 py-2"
                        required
                    />
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Contraseña"
                        className="w-full border border-gray-300 rounded px-3 py-2"
                        required
                    />
                    <button
                        type="submit"
                        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
                        disabled={loading}
                    >
                        {loading ? "Accediendo..." : "Entrar"}
                    </button>
                    {error && <p className="text-red-600 text-sm">{error}</p>}
                </form>

                <div className="my-4 border-t border-gray-300"></div>

                <button
                    onClick={handleGoogleLogin}
                    className="flex items-center justify-center w-full bg-white border border-gray-300 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 py-3"
                    disabled={googleLoading}
                >
                    <img
                        src="/googlelogo.svg"
                        alt="Google Logo"
                        className="h-6 w-6 mr-3"
                    />
                    <span className="text-gray-700 font-medium">
                        Acceder con Google
                    </span>
                </button>
            </div>

            {/* Modal de carga al hacer login */}
            {(loading || googleLoading) && (
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
