import { Game } from './game.js';

const canvas = document.getElementById('game-canvas');
const game = new Game(canvas);

game.init().then(() => {
  game.start();
  console.log('Game started!');
}).catch((error) => {
  console.error('Failed to load game:', error);
});
