import "phaser";
import { Bubble } from "../GameObjects/Bubble";

export class GameScene extends Phaser.Scene {
  colors: Object;
  columns: integer;
  startRow: integer;
  tileWidth: integer;
  tileHeight: integer;
  bubbles: Phaser.Physics.Arcade.Group;
  bubblesArray: Array<Array<Bubble>>;

  constructor() {
    super({
      key: "GameScene"
    });
  }

  init(): void {
    this.colors = {
      black: 0x3b3b3b,
      red: 0xff0000,
      green: 0x00ff00,
      blue: 0x0000ff,
      yellow: 0xffff00,
      purple: 0xff00ff,
      white: 0xffffff
    };
    this.columns = 8;
    this.startRow = 5;
    this.tileWidth = 90;
    this.tileHeight = 80;
  }

  create(): void {
    this.bubbles = this.physics.add.group();
    this.bubblesArray = new Array();

    for (var j = 0; j < this.startRow; j++) {
      this.bubblesArray.push(new Array());
      for (var i = 0; i < this.columns; i++) {
        if (j % 2 == 1 && i == this.columns - 1) {
          this.bubblesArray[j].push(null);
          continue;
        }
        var coord = this.getTileCoordinate(i, j);
        var bubble = new Bubble(
          { scene: this, x: 45 + coord.x, y: 150 + coord.y },
          this.colors,
          true
        );
        this.bubblesArray[j].push(bubble);
        this.bubbles.add(bubble);
      }
    }
    console.log(this.bubblesArray);
    // for (var i = 0; i < 8; i++) {
    //   // this.add.existing(bubble);
    //   var bubble = new Bubble(
    //     { scene: this, x: 45 + i * 100, y: 44 },
    //     this.colors,
    //     true
    //   );
    //   bubble.setCollideWorldBounds(true);
    //   this.physics.add.existing(bubble);
    //   this.balls.add(bubble);
    //   // this.physics.add.sprite(0,0,"bubble").setPosition(45+(i*90),45).setCircle(60, 28, 28).setScale(0.75,0.75);
    // }

    // this.physics.add.collider(this.balls, undefined, function(
    //   ball1: any,
    //   ball2
    // ) {
    //   console.log("asdasd");
    // });
  }

  private getTileCoordinate(column: integer, row: integer): Coord {
    var tilex = column * this.tileWidth;

    if (row % 2) {
      tilex += this.tileWidth / 2;
    }

    var tiley = row * this.tileHeight;
    return new Coord(tilex, tiley);
  }
}

class Coord {
  x: integer;
  y: integer;

  constructor(x: integer, y: integer) {
    this.x = x;
    this.y = y;
  }
}
