const mongoose = require('mongoose');

const punchlineSchema = new mongoose.Schema({
    text: { type: String, required: true },
    author: { type: String, required: true },
    newsPrompt: { type: mongoose.Schema.Types.ObjectId, ref: 'NewsArticle', required: true },
    gameSession: { type: mongoose.Schema.Types.ObjectId, ref: 'GameSession', required: true },
    round: { type: Number, required: true },
    createdAt: { type: Date, default: Date.now }
  });
  
  // Compound index to ensure uniqueness per user, game session, and news prompt
  punchlineSchema.index({ author: 1, gameSession: 1, newsPrompt: 1 }, { unique: true });
  
  module.exports = mongoose.model('Punchline', punchlineSchema);