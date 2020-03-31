import "phaser";
import { Bubble } from "../GameObjects/Bubble";

export class GameScene extends Phaser.Scene {
  colors: Object;
  columns: integer;
  startRow: integer;
  maxRow: integer;
  tileWidth: integer;
  tileHeight: integer;
  bubbles: Phaser.Physics.Arcade.Group;
  bubblesArray: Array<Array<Bubble>>;
  activeBubble: Bubble;

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
    this.maxRow = 10;
    this.tileWidth = 90;
    this.tileHeight = 80;
  }

  create(): void {
    this.initTiles();
    this.activeBubble = new Bubble(
      { scene: this, x: 350, y: 1000 },
      this.colors
    );
  }

  private getTileCoordinate(column: integer, row: integer): Coord {
    var tilex = column * this.tileWidth;

    if (row % 2) {
      tilex += this.tileWidth / 2;
    }

    var tiley = row * this.tileHeight;
    return new Coord(tilex, tiley);
  }

  private initTiles() {
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
          this.colors
        );
        this.bubblesArray[j].push(bubble);
        this.bubbles.add(bubble);
      }
    }
    for (var i = this.startRow; i < this.maxRow; i++) {
      this.bubblesArray.push(new Array());
      for (var j = 0; j < this.columns; j++) {
        this.bubblesArray[i].push(null);
      }
    }
    console.log(this.bubblesArray);
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
