import mongoose from 'mongoose';

const ForumSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  category: { type: String },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  replies: [{
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    content: { type: String },
    solution: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

export default mongoose.models.Forum || mongoose.model('Forum', ForumSchema);
