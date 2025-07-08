const mongoose = require('mongoose');

const PresupuestoItemSchema = new mongoose.Schema({
  hamperId: String,
  hamperName: String,
  quantity: Number,
  unitPrice: Number
}, { _id: false });

const PresupuestoSchema = new mongoose.Schema({
  customerId: { type: String, required: true },
  items: [PresupuestoItemSchema],
  quoteDate: { type: Date, required: true },
  expiryDate: { type: Date },
  status: { type: String, default: 'DRAFT' },
  shippingAddress: { type: String },
  notes: { type: String },
  relatedOrderId: { type: String },
  totalAmount: { type: Number, default: 0 },
  totalVatAmount: { type: Number, default: 0 },
  quoteNumber: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Presupuesto', PresupuestoSchema);
