import mongoose from 'mongoose';

const TradeSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  price: { type: Number },
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isForSale: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.models.Trade || mongoose.model('Trade', TradeSchema);
