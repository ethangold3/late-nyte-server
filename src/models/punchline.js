const mongoose = require('mongoose');

const punchlineSchema = new mongoose.Schema({
  punchlineId: {
    type: Number,
    required: true
  },
  text: {
    type: String,
    required: true
  },
  author: {
    type: String,
    required: true
  },
  newsPrompt: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'NewsArticle',
    required: true
  },
  gameSession: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GameSession',
    required: true
  },
  round: {
    type: Number,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index to ensure uniqueness per user, game session, and news prompt
punchlineSchema.index({ author: 1, gameSession: 1, newsPrompt: 1 }, { unique: true });

// Compound index to ensure uniqueness of punchlineId within a game session
punchlineSchema.index({ gameSession: 1, punchlineId: 1 }, { unique: true });

// Pre-validate hook to set punchlineId
punchlineSchema.pre('validate', async function(next) {
  if (this.isNew && !this.punchlineId) {
    try {
      const maxPunchline = await this.constructor.findOne(
        { gameSession: this.gameSession },
        { punchlineId: 1 },
        { sort: { punchlineId: -1 } }
      );
      this.punchlineId = maxPunchline ? maxPunchline.punchlineId + 1 : 1;
      next();
    } catch (error) {
      next(error);
    }
  } else {
    next();
  }
});

module.exports = mongoose.model('Punchline', punchlineSchema);