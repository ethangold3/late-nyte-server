const mongoose = require('mongoose');
const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');
const GameSession = require('../src/models/GameSession');
const NewsPrompt = require('../src/models/NewsArticle');
const gameController = require('../src/controllers/gameController');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('startNewRound function', () => {
  beforeEach(async () => {
    await GameSession.deleteMany({});
    await NewsPrompt.deleteMany({});
  });

  test('creates and joins game correctly', async () => {
    const {gameId} = await gameController.createGame();
    const joinResult1 = await gameController.joinGame(gameId, 'player1');
    expect(joinResult1.message).toBe('Joined game successfully');
    const joinResult2 = await gameController.joinGame(gameId, 'player2');
    expect(joinResult2.message).toBe('Joined game successfully');
    const joinResult3 = await gameController.joinGame(gameId, 'player3');
    expect(joinResult3.message).toBe('Joined game successfully');
    const joinResult4 = await gameController.joinGame(gameId, 'player4');
    expect(joinResult4.message).toBe('Joined game successfully');
    const promptsData = [
      { 
          originalHeadline: 'Headline 1', 
          modifiedHeadline: 'Modified 1',
          publishedAt: new Date(),
          url: 'https://example.com/news1',
          source: 'News Source 1'
      },
      { 
          originalHeadline: 'Headline 2', 
          modifiedHeadline: 'Modified 2',
          publishedAt: new Date(),
          url: 'https://example.com/news2',
          source: 'News Source 2'
      },
      { 
          originalHeadline: 'Headline 3', 
          modifiedHeadline: 'Modified 3',
          publishedAt: new Date(),
          url: 'https://example.com/news3',
          source: 'News Source 3'
      },
      { 
          originalHeadline: 'Headline 4', 
          modifiedHeadline: 'Modified 4',
          publishedAt: new Date(),
          url: 'https://example.com/news4',
          source: 'News Source 4'
      },
  ];
    await NewsPrompt.insertMany(promptsData);
    const updatedGame = await gameController.startGame(gameId);
  

    // Assertions
    expect(updatedGame.rounds.length).toBe(1);
    const round = updatedGame.rounds[0];
    
    // Check that all prompts are used
    expect(round.newsPrompts.length).toBe(4);
    
    // Check assignments
    expect(round.assignments.length).toBe(4);
    
    // Check that each player has 2 prompts
    round.assignments.forEach(assignment => {
      expect(assignment.prompts.length).toBe(2);
    });

    // Check that each prompt is assigned twice
    const allAssignedPrompts = round.assignments.flatMap(a => a.prompts);
    round.newsPrompts.forEach(promptId => {
      const count = allAssignedPrompts.filter(p => p.equals(promptId)).length;
      expect(count).toBe(2);
    });

    // Check that no player has the same prompt twice
    round.assignments.forEach(assignment => {

      const uniquePrompts = new Set(assignment.prompts.map(p => p.toString()));
      expect(uniquePrompts.size).toBe(2);
    });

    // Check that prompts are marked as used
    const usedPrompts = await NewsPrompt.find({ usedInGame: true });
    expect(usedPrompts.length).toBe(4);
  });
 });