// Navbar.js
import { useState } from "react";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";

export default function Navbar() {
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingLogout, setPendingLogout] = useState(false);

  // Alterna el menú al hacer click
  const handleMenuClick = () => {
    setMenuOpen(!menuOpen);
  };

  // Cierra el menú cuando el ratón sale del contenedor (botón + menú)
  const handleMouseLeave = () => {
    setMenuOpen(false);
  };

  // Mostrar la modal de confirmación de logout
  const handleLogoutClick = () => {
    setShowConfirmModal(true);
  };

  // El usuario confirma que quiere desloguearse
  const confirmLogout = async () => {
    setPendingLogout(true);
    await signOut();
    // Después de signOut(), NextAuth recarga/redirige la página.
    // Por eso, no solemos mostrar un mensaje persistente.
    // Pero si deseas forzar un redirect manual, podrías usar:
    // router.push("/"); // por ejemplo
  };

  // El usuario cancela la confirmación
  const cancelLogout = () => {
    setShowConfirmModal(false);
  };

  return (
    <nav className="bg-gray-800 text-white">
      <div className="container mx-auto px-4 flex items-center justify-between h-16">
        {/* Contenedor que agrupa botón + menú */}
        <div
          className="relative inline-block"
          onMouseLeave={handleMouseLeave}
        >
          {/* Botón "Menú" */}
          <button
            className="px-4 py-2 text-sm font-medium hover:bg-gray-700"
            onClick={handleMenuClick}
            onMouseEnter={() => setMenuOpen(true)}
          >
            Menú
          </button>

          {/* Dropdown */}
          {menuOpen && (
            <div className="absolute left-0 top-full w-48 bg-white text-black rounded-md shadow-lg z-50">
              <Link href="/" legacyBehavior>
                <a className="block px-4 py-2 hover:bg-gray-100">Inicio</a>
              </Link>
              <Link href="/eventos" legacyBehavior>
                <a className="block px-4 py-2 hover:bg-gray-100">Eventos</a>
              </Link>
              {/* <Link href="/foro" legacyBehavior>
                <a className="block px-4 py-2 hover:bg-gray-100">Foro</a>
              </Link>
              <Link href="/compra-venta" legacyBehavior>
                <a className="block px-4 py-2 hover:bg-gray-100">Compra-Venta</a>
              </Link> */}
            </div>
          )}
        </div>

        {/* Botones de Login y Registro a la derecha */}
        <div className="flex space-x-2">
          {session ? (
            <button
              onClick={handleLogoutClick}
              className="px-3 py-2 rounded-md text-sm font-medium bg-red-500 hover:bg-red-600"
            >
              Logout
            </button>
          ) : (
            <>
              <Link href="/login" legacyBehavior>
                <a className="px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-700">
                  Login
                </a>
              </Link>
              <Link href="/register" legacyBehavior>
                <a className="px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-700">
                  Registro
                </a>
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Modal de confirmación de Logout */}
      {showConfirmModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg text-center shadow-lg border border-gray-300 max-w-sm w-full">
            <p className="text-xl font-semibold text-gray-800">
              ¿Deseas cerrar sesión?
            </p>
            <p className="text-gray-700 mt-2">
              Tu sesión se cerrará y volverás como invitado.
            </p>

            <div className="mt-4 flex justify-center space-x-4">
              <button
                onClick={cancelLogout}
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
                disabled={pendingLogout}
              >
                Cancelar
              </button>
              <button
                onClick={confirmLogout}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                disabled={pendingLogout}
              >
                {pendingLogout ? "Saliendo..." : "Aceptar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
