// models/User.js
import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  name: { type: String },
  password: { type: String },
  googleId: { type: String },
  phoneNumber: String, // o { type: String, required: false }
  role: { type: String, enum: ['admin', 'moderador', 'usuario'], default: 'usuario' },
  temporaryPassword: { type: Boolean, default: false },
  
  // Campos para verificación de correo
  verified: { type: Boolean, default: false },
  verificationToken: { type: String, required: false },
}, { timestamps: true });

export default mongoose.models.User || mongoose.model('User', UserSchema);
