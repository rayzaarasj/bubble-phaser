import "phaser";
import { GameScene } from "../Scenes/GameScene";

export class Bubble extends Phaser.Physics.Arcade.Sprite {
  color: integer;
  processed: boolean;

  constructor(config: any, colors: object) {
    super(config.scene, 0, 0, "bubble");
    config.scene.add.existing(this);
    config.scene.physics.add.existing(this);

    this.setPosition(config.x, config.y);
    this.setScale(0.75, 0.75);
    this.setCircle(60, 28, 28);
    this.setCollideWorldBounds(true);
    this.setBounce(1, 1);
    this.processed = false;

    var keys = Object.keys(colors);
    this.color = colors[keys[(keys.length * Math.random()) << 0]];
    this.setTint(this.color);

    this.scene.anims.create({
      key: "pop",
      frames: this.scene.anims.generateFrameNumbers("bubble", {}),
      repeat: 0
    });
  }

  pop() {
    this.scene.sound.play("pop");
    this.play("pop");
    (this.scene as GameScene).score += 10;
    this.scene.time.addEvent({
      delay: 100,
      callback: () => {
        this.destroy();
      },
      callbackScope: this
    });
  }

  fall() {
    this.scene.sound.play("pop");
    this.play("pop");
    this.setVelocityY(500);
    (this.scene as GameScene).score += 20;
    this.scene.time.addEvent({
      delay: 200,
      callback: () => {
        this.destroy();
      },
      callbackScope: this
    });
  }
}
