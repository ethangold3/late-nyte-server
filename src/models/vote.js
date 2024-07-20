//depreciated

const mongoose = require('mongoose');

const voteSchema = new mongoose.Schema({
  voter: { type: String, required: true },
  newsPrompt: { type: mongoose.Schema.Types.ObjectId, ref: 'NewsArticle', required: true },
  selectedPunchline: { type: mongoose.Schema.Types.ObjectId, ref: 'Punchline', required: true },
  gameSession: { type: mongoose.Schema.Types.ObjectId, ref: 'GameSession', required: true },
  round: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now }
});

voteSchema.index({ voter: 1, newsPrompt: 1, gameSession: 1 }, { unique: true });


module.exports = mongoose.model('Vote', voteSchema);