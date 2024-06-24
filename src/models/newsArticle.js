const mongoose = require('mongoose');

const newsArticleSchema = new mongoose.Schema({
    originalHeadline: { type: String, required: true },
    modifiedHeadline: { type: String, required: true },
    source: { type: String, required: true },
    url: { type: String, required: true },
    publishedAt: { type: Date, required: true },
    createdAt: { type: Date, default: Date.now },
    usedInGame: { type: Boolean, default: false }
  });

  
module.exports = mongoose.model('NewsArticle', newsArticleSchema);