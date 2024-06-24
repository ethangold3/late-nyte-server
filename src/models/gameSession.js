const mongoose = require('mongoose');

const gameSessionSchema = new mongoose.Schema({
  gameId: { type: String, required: true, unique: true },
  players: [{
    username: { type: String, required: true },
    score: { type: Number, default: 0 }
  }],
  rounds: [{
    roundNumber: { type: Number, required: true },
    newsPrompts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'NewsPrompt' }],
    assignments: [{
      player: { type: String, required: true },
      prompts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'NewsPrompt' }]
    }],
    punchlines: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Punchline' }],
    votes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Vote' }]
  }],
  status: { type: String, enum: ['waiting', 'in-progress', 'completed'], default: 'waiting' },
  currentRound: { type: Number, default: 0 },
  totalRounds: { type: Number, default: 5 },
  createdAt: { type: Date, default: Date.now },
  endedAt: { type: Date }
});

gameSessionSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 });

module.exports = mongoose.model('GameSession', gameSessionSchema);