import "phaser";

export class GameOverPanel extends Phaser.GameObjects.Image {
  constructor(config) {
    super(config.scene, config.x, config.y, "panel");
    this.scene.add.existing(this);

    this.scene.add
      .text(360, 500, config.text, {
        fontFamily: "Roboto Condensed",
        color: "#fff",
        fontSize: "64px",
      })
      .setOrigin(0.5, 0.5)
      .setX(360);

    this.scene.add
      .image(360, 650, "replay")
      .setScale(0.7, 0.7)
      .setInteractive()
      .on("pointerdown", () => {
        this.scene.scene.start("GameScene");
      });
  }
}
