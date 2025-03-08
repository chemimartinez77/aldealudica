import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String },
  googleId: { type: String },
  name: { type: String },
  role: { type: String, enum: ['admin', 'moderador', 'usuario'], default: 'usuario' },
  temporaryPassword: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.models.User || mongoose.model('User', UserSchema);
