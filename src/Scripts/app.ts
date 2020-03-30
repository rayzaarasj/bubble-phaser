import "phaser";
import { GameScene } from "./Scenes/GameScene";
import { PreLoadScene } from "./Scenes/PreLoadScene";

const DEFAULT_WIDTH = 720;
const DEFAULT_HEIGHT = 1200;

const config: Phaser.Types.Core.GameConfig = {
  title: "Bubble",
  scale: {
    parent: "game",
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: DEFAULT_WIDTH,
    height: DEFAULT_HEIGHT
  },
  physics: {
    default: "arcade",
    arcade: {
      debug: true
    }
  },
  backgroundColor: "#c0c0c0",
  scene: [PreLoadScene, GameScene]
};

export class BubbleGame extends Phaser.Game {
  constructor(config: Phaser.Types.Core.GameConfig) {
    super(config);
  }
}

window.onload = () => {
  var game = new BubbleGame(config);
};
