import "phaser";

export class Bubble extends Phaser.Physics.Arcade.Sprite {
  color: integer;
  inPlay: boolean;

  constructor(config: any, colors: object, inPlay: boolean) {
    super(config.scene, 0, 0, "bubble");
    config.scene.add.existing(this);
    config.scene.physics.add.existing(this);

    this.inPlay = inPlay;

    this.setPosition(config.x, config.y);
    this.setScale(0.75, 0.75);
    this.setCircle(60, 28, 28);

    var keys = Object.keys(colors);
    this.color = colors[keys[(keys.length * Math.random()) << 0]];
    this.setTint(this.color);
  }
}
