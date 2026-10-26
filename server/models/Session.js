const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  sessionToken: { type: String, required: true, unique: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  email: { type: String, required: true },
  role: { type: String },
  organisationId: { type: String },
  entitlements: [{ type: String }],
  slmSub: { type: String, index: true },
  sid: { type: String, sparse: true, index: true },
  expiresAt: { type: Date, required: true, index: { expires: 0 } }
}, { timestamps: true });

module.exports = mongoose.model('Session', sessionSchema);
