const mongoose = require('mongoose');

const passkeyCredentialSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  credentialId: { type: String, required: true, unique: true }, // base64url
  publicKey: { type: String, required: true }, // base64url
  signCount: { type: Number, default: 0 },
  transports: { type: [String], default: [] },
}, { timestamps: true });

module.exports = mongoose.model('PasskeyCredential', passkeyCredentialSchema);


