import "phaser";

export class PreLoadScene extends Phaser.Scene {
  constructor() {
    super({
      key: "PreLoadScene"
    });
  }

  preload(): void {
    this.load.spritesheet("bubble", "src/Assets/bubblesprite.png", {
      frameWidth: 180,
      frameHeight: 180
    });
    this.load.audio("pop", "src/Assets/Audio/Blop.mp3");
  }

  create(): void {
    this.scene.start("GameScene");
  }
}
