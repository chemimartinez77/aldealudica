# Aldea Ludica

Aldea Ludica es una aplicación web para gestionar un club de juegos de mesa. Este proyecto utiliza Next.js (tanto para frontend como backend mediante API Routes), MongoDB con Mongoose y se despliega en Vercel.

## Características

- **Autenticación y Seguridad**
  - Inicio de sesión con Google OAuth.
  - Registro manual con envío de contraseña temporal por correo.
  - Gestión de sesiones con JWT y refresh tokens.
- **Noticias**
  - CRUD para noticias del club con soporte para imágenes y edición en Markdown.
- **Eventos y Partidas**
  - Calendario interactivo para eventos y partidas.
  - Inscripción a eventos con cupos limitados.
  - Notificaciones PUSH y envío de eventos vía WhatsApp.
- **Foro**
  - Sistema de foros con categorías, respuestas anidadas y opción de marcar soluciones.
- **Compra-Venta**
  - Sección de anuncios para comprar/venta de juegos.
  - Chat integrado para comunicación con el vendedor.
- **Extras**
  - Documentación de la API con Swagger.
  - Sistema de roles y permisos (admin, moderador, usuario).
  - Interfaz responsiva con TailwindCSS.

## Instalación y Ejecución

### Prerrequisitos

- Node.js (>= 14)
- Una instancia de MongoDB (por ejemplo, MongoDB Atlas)
- Cuenta en Vercel para despliegue

### Pasos para Ejecutar Localmente

1. Clona el repositorio:
   ```bash
   git clone https://github.com/yourusername/aldea-ludica.git
   cd aldea-ludica
