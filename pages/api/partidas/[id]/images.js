import { getToken } from 'next-auth/jwt';
import dbConnect from '../../../../lib/dbConnect';
import Partida from '../../../../models/partida';
import { v2 as cloudinary } from 'cloudinary';

// Configurar Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default async function handler(req, res) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  console.log("Token recibido en /api/partidas/[id]/images:", token);

  console.log("Headers cookie:", req.headers.cookie);

  if (!token) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  const { id } = req.query;

  await dbConnect();

  if (req.method === 'POST') {
    try {
      const { images } = req.body;

      // Buscar partida por ID personalizado
      const partida = await Partida.findOne({ id });

      if (!partida) {
        return res.status(404).json({ error: 'Partida no encontrada' });
      }

      // Verificar permisos
      const userId = token.id;
      const isAdmin = token.role === "admin";
      const isParticipant = partida.participants.some(p =>
        p.toString() === userId || (p._id && p._id.toString() === userId)
      );
      if (!isAdmin && !isParticipant) {
        return res.status(403).json({ error: 'No tiene permiso para agregar imágenes a esta partida' });
      }

      // Añadir imágenes nuevas
      partida.images = [...(partida.images || []), ...images];
      await partida.save();

      return res.status(200).json({ success: true, images: partida.images });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Error al guardar las imágenes' });
    }
  }

  // En el caso DELETE
  if (req.method === 'DELETE') {
    const { publicId } = req.body;
    
    if (!publicId) {
      return res.status(400).json({ error: 'Se requiere el publicId de la imagen' });
    }
  
    try {
      await dbConnect();
      // Cambiar findById por findOne({ id }) para ser consistente con el método POST
      const partida = await Partida.findOne({ id });
      
      if (!partida) {
        return res.status(404).json({ error: 'Partida no encontrada' });
      }
  
      // En lugar de eliminar de Cloudinary, solo marcamos como eliminada en MongoDB
      const imageIndex = partida.images.findIndex(img => img.publicId === publicId);
      
      if (imageIndex !== -1) {
        // Marcar como eliminada lógicamente
        partida.images[imageIndex].isDeleted = true;
        await partida.save();
        
        return res.status(200).json({ 
          success: true, 
          images: partida.images 
        });
      } else {
        return res.status(404).json({ error: 'Imagen no encontrada' });
      }
    } catch (error) {
      console.error('Error al marcar imagen como eliminada:', error);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  return res.status(405).json({ error: 'Método no permitido' });
}
