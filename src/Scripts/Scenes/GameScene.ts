import "phaser";
import { Bubble } from "../GameObjects/Bubble";
import { GameOverPanel } from "../GameObjects/GameOverPanel";

// TEST
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
  dragging: boolean;
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
  arrow: Phaser.GameObjects.Image;
  graphics: Phaser.GameObjects.Graphics;
  solidLine: Phaser.Geom.Line;
  dotLine: Phaser.Geom.Line;
  dotLineReflected: Phaser.Geom.Line;
  wallLineLeft: Phaser.Geom.Line;
  wallLineRight: Phaser.Geom.Line;
  points: Phaser.Geom.Point[];
  maxReflection: number;
  ceiling: Phaser.Geom.Line;

  constructor() {
    super({
      key: "GameScene",
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
      white: 0xffffff,
    };
    this.columns = 8;
    this.startRow = 5;
    this.maxRow = 10;
    this.tileWidth = 90;
    this.tileHeight = 80;
    this.scoreHeight = 100;
    this.bubbleSpeed = 800;
    this.score = 0;
    this.maxReflection = 3;
    this.points = new Array<Phaser.Geom.Point>();

    this.neighBorOffsets = [
      [
        [1, 0],
        [0, 1],
        [-1, 1],
        [-1, 0],
        [-1, -1],
        [0, -1],
      ], // even
      [
        [1, 0],
        [1, 1],
        [0, 1],
        [-1, 0],
        [0, -1],
        [1, -1],
      ], // odd
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
      if (
        this.activeBubble == null ||
        this.activeBubble.body.velocity.length() != 0
      ) {
        return;
      }

      this.dragging = true;
      this.arrow = this.add
        .image(this.activeBubble.x, this.activeBubble.y, "arrow")
        .setTint(0xff0000);
      this.arrow.setRotation(this.getAngleEventToActiveBubble(event));
      this.updateGuideLine(event);
    });

    this.clickArea.on("pointermove", (event: any) => {
      if (this.dragging) {
        this.arrow.setRotation(this.getAngleEventToActiveBubble(event));
        this.updateGuideLine(event);
      }
    });

    this.clickArea.on("pointerup", (event: any) => {
      if (!this.dragging) {
        return;
      }

      this.dragging = false;
      this.arrow.destroy();
      this.graphics.clear();
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

    this.clickArea.on("pointerout", (event: any) => {
      if (!this.dragging) {
        return;
      }

      this.dragging = false;
      this.arrow.destroy();
      this.graphics.clear();
    });

    this.scoreText = this.add
      .text(360, 50, "" + this.score, {
        fontFamily: "Roboto Condensed",
        color: "#fff",
        fontSize: "64px",
      })
      .setOrigin(0.5);

    this.graphics = this.add.graphics({
      lineStyle: { width: 8, color: 0xff0000 },
      fillStyle: { color: 0xff0000 },
    });

    this.wallLineLeft = new Phaser.Geom.Line(0, -10000000, 0, 10000000);
    this.wallLineRight = new Phaser.Geom.Line(720, -10000000, 720, 10000000);
    this.ceiling = new Phaser.Geom.Line(-10000000, 100, 10000000, 100);
    this.solidLine = new Phaser.Geom.Line(0, 0, 0, 0);
    this.dotLine = new Phaser.Geom.Line(0, 0, 0, 0);
    this.dotLineReflected = new Phaser.Geom.Line(0, 0, 0, 0);
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

    if (this.bubbles.getLength() <= 1) {
      this.gameOver("You Win");
    }
  }

  private updateGuideLine(event: any) {
    this.solidLine.setTo(
      this.activeBubble.x,
      this.activeBubble.y,
      event.x,
      event.y
    );

    this.dottedGuideLine(
      this.activeBubble.x,
      this.activeBubble.y,
      this.getAngleEventToActiveBubble(event) - 90 * Phaser.Math.DEG_TO_RAD,
      0
    );

    this.graphics.clear();
    this.graphics.strokeLineShape(this.solidLine);
    this.points.forEach((point) => {
      this.graphics.fillPoint(point.x, point.y, 10);
    });
    this.points = new Array();
  }

  private dottedGuideLine(x: number, y: number, angle: number, n: number) {
    if (n > this.maxReflection || y < 100) {
      return;
    }
    Phaser.Geom.Line.SetToAngle(this.dotLine, x, y, angle, 100000);

    var wallIntersectResult = this.getClosestIntersectWall();
    var wallIntersect = wallIntersectResult.intersection;
    var bubbleIntersect = this.getClosestIntersectBubble();
    var ceilingIntersect = this.getCeilingIntersect();

    var length = Math.min(
      wallIntersect.length,
      bubbleIntersect.length,
      ceilingIntersect.length
    );

    Phaser.Geom.Line.SetToAngle(this.dotLine, x, y, angle, length);
    this.drawDottedLine();

    if (
      wallIntersectResult.wallSide != null &&
      wallIntersect.length < bubbleIntersect.length &&
      wallIntersect.length < ceilingIntersect.length
    ) {
      this.dottedGuideLine(
        wallIntersect.x,
        wallIntersect.y,
        Phaser.Geom.Line.ReflectAngle(
          this.dotLine,
          wallIntersectResult.wallSide
        ),
        n + 1
      );
    }
  }

  private getCeilingIntersect() {
    var point = new Phaser.Geom.Point();
    Phaser.Geom.Intersects.LineToLine(this.dotLine, this.ceiling, point);
    return new Intersection(
      point.x,
      point.y,
      Phaser.Math.Distance.Between(
        this.dotLine.x1,
        this.dotLine.y1,
        point.x,
        point.y
      )
    );
  }

  private getClosestIntersectBubble() {
    var point = new Phaser.Geom.Point();
    var points = new Array();
    var length = Number.MAX_VALUE;
    for (var i = 0; i < this.columns; i++) {
      for (var j = 0; j < this.maxRow; j++) {
        var bubble = this.bubblesArray[j][i];
        if (
          bubble != null &&
          Phaser.Geom.Intersects.GetLineToCircle(
            this.dotLine,
            bubble.circle,
            points
          )
        ) {
          points.forEach((temp) => {
            var tempLength = Phaser.Math.Distance.Between(
              this.dotLine.x1,
              this.dotLine.y1,
              temp.x,
              temp.y
            );

            if (tempLength < length) {
              point = temp;
              length = tempLength;
            }
          });
        }
      }
    }
    return new Intersection(point.x, point.y, length);
  }

  private drawDottedLine() {
    var points = new Array<Phaser.Geom.Point>();
    Phaser.Geom.Line.GetPoints(this.dotLine, 0, 25, points);
    this.points = this.points.concat(points);
  }

  private getClosestIntersectWall() {
    var point = new Phaser.Geom.Point();
    var wallSide = null;

    if (
      Phaser.Geom.Intersects.LineToLine(this.dotLine, this.wallLineLeft, point)
    ) {
      wallSide = this.wallLineLeft;
      point.x = 1;
    } else if (
      Phaser.Geom.Intersects.LineToLine(this.dotLine, this.wallLineRight, point)
    ) {
      wallSide = this.wallLineRight;
      point.x = 719;
    }
    return {
      intersection: new Intersection(
        point.x,
        point.y,
        Phaser.Math.Distance.Between(
          this.dotLine.x1,
          this.dotLine.y1,
          point.x,
          point.y
        )
      ),
      wallSide: wallSide,
    };
  }

  private getAngleEventToActiveBubble(event: any): number {
    return (
      Phaser.Math.Angle.Between(
        event.x,
        event.y,
        this.activeBubble.x,
        this.activeBubble.y
      ) +
      90 * Phaser.Math.DEG_TO_RAD
    );
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
      this.gameOver("Game Over");
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
      callbackScope: this,
    });
  }

  private gameOver(text: string): void {
    this.clickArea.removeInteractive();
    new GameOverPanel({ scene: this, x: 360, y: 600, text: text });
  }

  private fallClusters(clusters: Bubble[][]): void {
    var finalCluster = [];
    clusters.forEach((cluster) => {
      cluster.forEach((tile) => {
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
      repeat: -1,
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
      repeat: -1,
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
        this.time.addEvent({
          delay: 10,
          callbackScope: this,
          callback: () => {
            this.snapBubble();
          },
        });
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
    var gridx = Math.max(0, Math.floor((x - xoffset) / this.tileWidth));

    // Workaround. For 7 bubble on odd row.
    if (gridy % 2 && gridx == 7) {
      gridx = 6;
    }
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

class Intersection {
  x: integer;
  y: integer;
  length: integer;

  constructor(x: integer, y: integer, length: integer) {
    this.x = x;
    this.y = y;
    this.length = length;
  }
}
