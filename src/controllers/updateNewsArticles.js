require('dotenv').config({ path: '../../.env' });
const axios = require('axios');
const mongoose = require('mongoose');
const NewsPrompt = require('../models/NewsArticle');
console.log(NEWS_API_KEY);
//const MONGODB_URI = process.env.MONGODB_URI;

function cleanHeadline(headline) {
  // Remove everything after the last dash, trim whitespace
  return headline.split(' - ')[0].trim();
}

function isQualityHeadline(headline) {
  // Filter out headlines that are too short or contain certain phrases
  const minLength = 30;
  const bannedPhrases = [
    'according to',
    'here are',
    'these are',
    'best of',
    'top',
    'how to',
    'what you need to know',
    'review',
    'removed'
  ];
  
  const cleanedHeadline = headline.toLowerCase();
  
  if (cleanedHeadline.length < minLength) return false;
  
  for (const phrase of bannedPhrases) {
    if (cleanedHeadline.includes(phrase)) return false;
  }
  
  return true;
}

async function fetchNewsArticles(categoryName) {
  try {
    const response = await axios.get('https://newsapi.org/v2/top-headlines', {
      params: {
        country: 'us',
        category: categoryName,
        pageSize: 100,
        apiKey: NEWS_API_KEY
      }
    });
    
    // Clean and filter headlines
    return response.data.articles
      .map(article => ({
        ...article,
        title: cleanHeadline(article.title)
      }))
      .filter(article => isQualityHeadline(article.title));
  } catch (error) {
    console.error(`Error fetching news articles for category ${categoryName}:`, error);
    return [];
  }
}

async function saveArticlesToDatabase(articles) {
  for (const article of articles) {
    const newsPrompt = new NewsPrompt({
      originalHeadline: article.title,
      modifiedHeadline: article.title,
      source: article.source.name,
      url: article.url,
      publishedAt: new Date(article.publishedAt),
      usedInGame: false
    });
    try {
      await newsPrompt.save();
      console.log('Saved article:', article.title);
    } catch (error) {
      console.error('Error saving article:', error);
    }
  }
}

exports.updateNewsArticles = async () => {
  const categories = ['business', 'entertainment', 'general', 'health', 'science'];
  let allArticles = [];

  try {

    for (const category of categories) {
      console.log(`Fetching articles for category: ${category}`);
      const categoryArticles = await fetchNewsArticles(category);
      allArticles = allArticles.concat(categoryArticles);
      console.log(`Fetched ${categoryArticles.length} quality articles for ${category}`);
    }

    console.log(`Total quality articles fetched: ${allArticles.length}`);
    await saveArticlesToDatabase(allArticles);
    console.log('Finished updating news articles');
  } catch (error) {
    console.error('Error in updateNewsArticles:', error);
  }
}
