//depreciated

const mongoose = require('mongoose');

const voteSchema = new mongoose.Schema({
  voter: { type: String, required: true },
  newsPrompt: { type: mongoose.Schema.Types.ObjectId, ref: 'NewsPrompt', required: true },
  selectedPunchline: { type: mongoose.Schema.Types.ObjectId, ref: 'Punchline', required: true },
  gameSession: { type: mongoose.Schema.Types.ObjectId, ref: 'GameSession', required: true },
  round: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Vote', voteSchema);