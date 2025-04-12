import { v2 as cloudinary } from 'cloudinary';
import { getSession } from 'next-auth/react';
import formidable from 'formidable';

// Configurar para que Next.js no analice el cuerpo de la solicitud como JSON
export const config = {
  api: {
    bodyParser: false,
  },
};

// Configurar Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default async function handler(req, res) {
  const session = await getSession({ req });
  if (!session) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const form = formidable({ keepExtensions: true });
    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) {
          console.error('Formidable parse error:', err);
          reject(err);
        } else {
          resolve([fields, files]);
        }
      });
    });

    // Si files.file es un array, tomar el primer elemento
    const file = Array.isArray(files.file) ? files.file[0] : files.file;
    console.log('File received:', file);
    
    if (!file) {
      return res.status(400).json({ error: 'No se ha proporcionado ningún archivo' });
    }

    // Normalizar la ruta para Windows (cambiar backslashes por slashes)
    const normalizedPath = file.filepath.replace(/\\/g, "/");
    console.log("Uploading to Cloudinary from:", normalizedPath);

    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload(
        normalizedPath,
        {
          folder: 'partidas',
          resource_type: 'image',
        },
        (error, result) => {
          if (error) {
            console.error('Cloudinary upload error:', error);
            reject(error);
          } else {
            console.log('Cloudinary upload result:', result);
            resolve(result);
          }
        }
      );
    });

    return res.status(200).json({
      url: result.secure_url,
      public_id: result.public_id,  // Nota: usamos public_id en minúscula para ser coherentes
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    return res.status(500).json({ error: 'Error uploading image' });
  }
}
