// pages/register.js
import { useState, useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/router";

export default function RegisterPage() {
    const router = useRouter();
    const { data: session, status } = useSession(); // Detecta si el usuario está autenticado

    // Estados locales
    const [email, setEmail] = useState("");
    const [name, setName] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    // Si el usuario está autenticado con Google, mostramos la modal de éxito
    useEffect(() => {
        if (status === "authenticated") {
            setShowSuccessModal(true);
        }
    }, [status]);

    // Maneja el registro manual
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setLoading(false);
            setError("Las contraseñas no coinciden.");
            return;
        }
        setError("");
        setSuccess("");
        setLoading(true);

        try {
            const res = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, name, password }),
            });

            const data = await res.json();
            setLoading(false);

            if (!res.ok) {
                throw new Error(
                    data.error || "Error desconocido al registrar."
                );
            }

            setSuccess("Usuario registrado. Revisa tu correo.");
            setEmail("");
            setName("");
        } catch (err) {
            setLoading(false);
            setError(err.message);
        }
    };

    // Maneja el registro con Google
    const handleGoogleRegister = async () => {
        setGoogleLoading(true);
        await signIn("google");
    };

    return (
        <div className="max-w-md mx-auto mt-10 p-4 border border-gray-200 rounded">
            <h1 className="text-2xl font-bold mb-4">Registro</h1>

            {/* Formulario de registro manual */}
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label
                        htmlFor="name"
                        className="block text-sm font-medium text-gray-700"
                    >
                        Nombre
                    </label>
                    <input
                        id="name"
                        type="text"
                        className="mt-1 block w-full p-2 border border-gray-300 rounded"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Tu nombre"
                        required
                    />
                </div>

                <div>
                    <label
                        htmlFor="email"
                        className="block text-sm font-medium text-gray-700"
                    >
                        Correo electrónico
                    </label>
                    <input
                        id="email"
                        type="email"
                        className="mt-1 block w-full p-2 border border-gray-300 rounded"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="tuemail@ejemplo.com"
                        required
                    />
                </div>
                <div>
                    <label
                        htmlFor="password"
                        className="block text-sm font-medium text-gray-700"
                    >
                        Contraseña
                    </label>
                    <input
                        id="password"
                        type="password"
                        className="mt-1 block w-full p-2 border border-gray-300 rounded"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>

                <div>
                    <label
                        htmlFor="confirmPassword"
                        className="block text-sm font-medium text-gray-700"
                    >
                        Confirmar contraseña
                    </label>
                    <input
                        id="confirmPassword"
                        type="password"
                        className="mt-1 block w-full p-2 border border-gray-300 rounded"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                    />
                </div>

                <button
                    type="submit"
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 flex items-center justify-center"
                    disabled={loading}
                >
                    {loading ? "Registrando..." : "Registrar"}
                </button>
            </form>

            {/* Mensajes de éxito o error */}
            {success && <p className="mt-4 text-green-600">{success}</p>}
            {error && <p className="mt-4 text-red-600">{error}</p>}

            {/* Separador */}
            <div className="relative mt-6 mb-6">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">O</span>
                </div>
            </div>

            {/* Registro con Google */}
            <button
                onClick={handleGoogleRegister}
                className="w-full bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700 flex items-center justify-center"
                disabled={googleLoading}
            >
                {googleLoading ? "Conectando..." : "Registrar con Google"}
            </button>

            {/* Modal de éxito */}
            {showSuccessModal && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white p-6 rounded-lg text-center">
                        <p className="text-xl font-semibold">
                            Registro exitoso
                        </p>
                        <p>Pulsa "Aceptar" para continuar.</p>
                        <button
                            onClick={() => {
                                setShowSuccessModal(false);
                                router.push("/");
                            }}
                            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
                        >
                            Aceptar
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
