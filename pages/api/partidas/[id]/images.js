import { getToken } from 'next-auth/jwt';
import dbConnect from '../../../../lib/dbConnect';
import Partida from '../../../../models/Partida';
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

  if (req.method === 'DELETE') {
    try {
      const { publicId } = req.body;

      if (!publicId) {
        return res.status(400).json({ error: 'Falta publicId de la imagen' });
      }

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
        return res.status(403).json({ error: 'No tiene permiso para eliminar imágenes de esta partida' });
      }

      // Eliminar de Cloudinary
      try {
        await cloudinary.uploader.destroy(publicId);
      } catch (cloudError) {
        console.error('Error deleting image from Cloudinary:', cloudError);
      }

      // Eliminar de la base de datos
      partida.images = (partida.images || []).filter(img => img.publicId !== publicId);
      await partida.save();

      return res.status(200).json({ success: true, images: partida.images });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Error al eliminar la imagen' });
    }
  }

  return res.status(405).json({ error: 'Método no permitido' });
}
