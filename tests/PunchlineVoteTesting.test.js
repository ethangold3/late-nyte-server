const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const GameSession = require('../src/models/GameSession');
const NewsArticle = require('../src/models/NewsArticle');
const Punchline = require('../src/models/Punchline');
const gameController = require('../src/controllers/gameController');
const Vote = require('../src/models/Vote');

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

describe('Punchline and Vote Functions', () => {
    beforeEach(async () => {
        await GameSession.deleteMany({});
        await NewsArticle.deleteMany({});
        await Punchline.deleteMany({});
        await Vote.deleteMany({});
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
        await NewsArticle.insertMany(promptsData);
        const game = await gameController.startGame(gameId);
        // Submit punchlines
        for (const assignment of game.rounds[0].assignments) {
            for (const promptId of assignment.prompts) {
            const result = await gameController.submitPunchline(
                game.gameId,
                assignment.player,
                promptId,
                `Punchline by ${assignment.player} for ${promptId}`
            );
            expect(result).toHaveProperty('message', 'Punchline submitted successfully');
            expect(result).toHaveProperty('punchlineId');
            }
        }
    
        // Verify punchlines
        const submittedPunchlines = await Punchline.find({ gameSession: game._id });
        expect(submittedPunchlines).toHaveLength(8);  // 4 players * 2 prompts each
    
        // Refresh game data
        const updatedGame = await GameSession.findOne({ gameId: game.gameId });
    
        // Submit votes
        for (const player of updatedGame.players) {
            for (const promptId of updatedGame.rounds[0].newsPrompts) {
            const punchlinesForPrompt = await Punchline.find({ 
                gameSession: updatedGame._id,
                newsPrompt: promptId
            });
            expect(punchlinesForPrompt).toHaveLength(2);
    
            // Choose a random punchline to vote for
            const randomPunchline = punchlinesForPrompt[Math.floor(Math.random() * punchlinesForPrompt.length)];
            
            const voteResult = await gameController.submitVote(
                updatedGame.gameId,
                player.username,
                randomPunchline.punchlineId
            );
            expect(voteResult).toHaveProperty('message', 'Vote submitted successfully');
            }
        }
    
        // Verify votes
        const submittedVotes = await Vote.find({ gameSession: updatedGame._id });
        expect(submittedVotes).toHaveLength(16);  // 4 players * 4 prompts
    
        // Final game state check
        const newGame = await GameSession.findOne({ gameId: updatedGame.gameId }).populate('rounds.punchlines rounds.votes');
        expect(newGame.rounds[0].punchlines).toHaveLength(8);
        expect(newGame.rounds[0].votes).toHaveLength(16);
        console.log(newGame)
        console.log(newGame.rounds[0].punchlines)
        console.log(newGame.rounds[0].votes)
        });
    });
