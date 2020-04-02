import "phaser";
import { Bubble } from "../GameObjects/Bubble";
import { GameOverPanel } from "../GameObjects/GameOverPanel";

export class GameScene extends Phaser.Scene {
  colors: Object;
  columns: integer;
  startRow: integer;
  maxRow: integer;
  tileWidth: integer;
  tileHeight: integer;
  scoreHeight: integer;
  bubbleSpeed: integer;
  score: integer;
  bubbles: Phaser.Physics.Arcade.Group;
  bubblesArray: Array<Array<Bubble>>;
  activeBubble: Bubble;
  clickArea: Phaser.GameObjects.Rectangle;
  bubbleToCluster: Phaser.Physics.Arcade.Collider;
  popSound: Phaser.Sound.BaseSound;
  neighBorOffsets: integer[][][];
  popTimer: Phaser.Time.TimerEvent;
  fallTimer: Phaser.Time.TimerEvent;
  scoreText: Phaser.GameObjects.Text;
  scoreArea: Phaser.GameObjects.Rectangle;

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
    this.scoreHeight = 100;
    this.bubbleSpeed = 800;
    this.score = 0;

    this.neighBorOffsets = [
      [
        [1, 0],
        [0, 1],
        [-1, 1],
        [-1, 0],
        [-1, -1],
        [0, -1]
      ], // even
      [
        [1, 0],
        [1, 1],
        [0, 1],
        [-1, 0],
        [0, -1],
        [1, -1]
      ] // odd
    ];
  }

  create(): void {
    this.popSound = this.sound.add("pop");

    this.clickArea = this.add.rectangle(600, 1100, 1200, 200, 0x5b5b5b);
    this.initTiles();
    this.bubbles.add(
      this.add.rectangle(600, 50, 1200, this.scoreHeight, 0x5b5b5b)
    );
    this.setupNewBubble();

    this.clickArea.setInteractive().on("pointerdown", (event: any) => {
      if (this.activeBubble == null) {
        return;
      }
      var bubbleV = new Phaser.Math.Vector2(
        this.activeBubble.x,
        this.activeBubble.y
      );
      var eventV = new Phaser.Math.Vector2(event.x, event.y);
      var direction = bubbleV.subtract(eventV);
      this.physics.velocityFromAngle(
        direction.angle() * Phaser.Math.RAD_TO_DEG,
        this.bubbleSpeed,
        this.activeBubble.body.velocity
      );
    });

    this.scoreText = this.add
      .text(360, 50, "" + this.score, {
        fontFamily: "Roboto Condensed",
        color: "#fff",
        fontSize: "64px"
      })
      .setOrigin(0.5);
  }

  update(time: any): void {
    this.scoreText.setText("" + this.score).setX(360);

    if (
      this.activeBubble == null &&
      this.popTimer == null &&
      this.fallTimer == null
    ) {
      this.setupNewBubble();
    }
  }

  private findFloatingClusters(): Bubble[][] {
    this.resetProcessed();

    var foundClusters = [];

    for (var j = 0; j < this.maxRow; j++) {
      for (var i = 0; i < this.columns; i++) {
        var tile = this.bubblesArray[j][i];
        if (tile != null && !tile.processed) {
          var index = this.getGridPosition(tile.x, tile.y);
          var foundCluster = this.findCluster(index.x, index.y, false, false);

          if (foundCluster.length <= 0) {
            continue;
          }

          var floating = true;
          for (var k = 0; k < foundCluster.length; k++) {
            if (foundCluster[k].y <= this.scoreHeight + 45) {
              floating = false;
              break;
            }
          }

          if (floating) {
            foundClusters.push(foundCluster);
          }
        }
      }
    }
    return foundClusters;
  }

  private findCluster(
    tx: integer,
    ty: integer,
    matchColor: boolean,
    reset: boolean
  ): Bubble[] {
    if (reset) {
      this.resetProcessed();
    }

    var targetTile = this.bubblesArray[ty][tx];
    var queue = [targetTile];
    targetTile.processed = true;
    var foundCluster = [];

    while (queue.length > 0) {
      var currentTile = queue.pop();

      if (currentTile == null) {
        continue;
      }

      if (!matchColor || currentTile.color == targetTile.color) {
        foundCluster.push(currentTile);

        var neighbors = this.getNeighbors(currentTile);
        for (var i = 0; i < neighbors.length; i++) {
          if (!neighbors[i].processed) {
            queue.push(neighbors[i]);
            neighbors[i].processed = true;
          }
        }
      }
    }

    return foundCluster;
  }

  private getNeighbors(currentTile: Bubble): Bubble[] {
    var indexCurrent = this.getGridPosition(currentTile.x, currentTile.y);
    var offset = this.neighBorOffsets[indexCurrent.y % 2];
    var neighbors = [];

    for (var i = 0; i < offset.length; i++) {
      var nx = indexCurrent.x + offset[i][0];
      var ny = indexCurrent.y + offset[i][1];

      if (
        nx >= 0 &&
        ny >= 0 &&
        nx < this.columns &&
        ny < this.maxRow &&
        this.bubblesArray[ny][nx] != null
      ) {
        neighbors.push(this.bubblesArray[ny][nx]);
      }
    }
    return neighbors;
  }

  private resetProcessed() {
    for (var j = 0; j < this.maxRow; j++) {
      for (var i = 0; i < this.columns; i++) {
        if (this.bubblesArray[j][i] != null) {
          this.bubblesArray[j][i].processed = false;
        }
      }
    }
  }

  private snapBubble() {
    var index = this.getGridPosition(this.activeBubble.x, this.activeBubble.y);
    var coord = this.getTileCoordinate(index.x, index.y);
    this.activeBubble.setVelocity(0, 0);

    if (index.y >= this.maxRow) {
      this.gameOver();
      return;
    }

    this.bubbles.add(this.activeBubble);
    this.bubblesArray[index.y][index.x] = this.activeBubble;
    // Workaroud. If not delayed this.activeBubble.setPosition(45 + coord.x, 45 + coord.y) doesn't work properly
    this.time.addEvent({
      delay: 1,
      callback: () => {
        if (this.activeBubble != null) {
          this.activeBubble.setPosition(45 + coord.x, 45 + coord.y);
          this.popCluster(this.findCluster(index.x, index.y, true, true));
          this.activeBubble = null;
        }
      },
      callbackScope: this
    });
  }

  gameOver() {
    this.clickArea.removeInteractive();
    new GameOverPanel({ scene: this, x: 360, y: 600 });
  }

  private fallClusters(clusters: Bubble[][]): void {
    var finalCluster = [];
    clusters.forEach(cluster => {
      cluster.forEach(tile => {
        finalCluster.push(tile);
      });
    });

    this.fallTimer = this.time.addEvent({
      delay: 100,
      callback: () => {
        if (finalCluster.length <= 0) {
          this.fallTimer.destroy();
          this.fallTimer = null;
          return;
        }

        var bubble = finalCluster.pop();
        var index = this.getGridPosition(bubble.x, bubble.y);
        this.bubblesArray[index.y][index.x] = null;
        bubble.fall();
      },
      callbackScope: this,
      repeat: -1
    });
  }

  private popCluster(cluster: Bubble[]): void {
    if (cluster.length < 3) {
      return;
    }

    cluster.reverse();
    this.popTimer = this.time.addEvent({
      delay: 100,
      callback: () => {
        if (cluster.length <= 0) {
          this.popTimer.destroy();
          this.popTimer = null;
          this.fallClusters(this.findFloatingClusters());
          return;
        }
        var bubble = cluster.pop();
        var index = this.getGridPosition(bubble.x, bubble.y);
        this.bubblesArray[index.y][index.x] = null;
        bubble.pop();
      },
      callbackScope: this,
      repeat: -1
    });
  }

  private setupNewBubble(): void {
    this.activeBubble = new Bubble(
      { scene: this, x: 360, y: 1000 },
      this.colors
    );

    this.bubbleToCluster = this.physics.add.collider(
      this.activeBubble,
      this.bubbles,
      () => {
        this.physics.world.removeCollider(this.bubbleToCluster);
        this.snapBubble();
        this.popSound.play();
      },
      null,
      this
    );
  }

  private getTileCoordinate(column: integer, row: integer): Point {
    var tilex = column * this.tileWidth;
    if (row % 2) {
      tilex += this.tileWidth / 2;
    }
    var tiley = row * this.tileHeight + this.scoreHeight;
    return new Point(tilex, tiley);
  }

  private getGridPosition(x: integer, y: integer): Point {
    var gridy = Math.floor((y - this.scoreHeight) / this.tileHeight);
    var xoffset = 0;
    if (gridy % 2) {
      xoffset = this.tileWidth / 2;
    }
    var gridx = Math.floor((x - xoffset) / this.tileWidth);
    return new Point(gridx, gridy);
  }

  private initTiles(): void {
    this.bubbles = this.physics.add.group({ immovable: true });
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
          { scene: this, x: 45 + coord.x, y: 45 + coord.y },
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
  }
}

class Point {
  x: integer;
  y: integer;

  constructor(x: integer, y: integer) {
    this.x = x;
    this.y = y;
  }
}
