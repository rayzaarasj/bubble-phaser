import "phaser";

export class PreLoadScene extends Phaser.Scene {
    constructor() {
        super({
            key: "PreLoadScene"
        });
    }
    
    preload(): void {

    }

    create(): void {
        this.scene.start("GameScene");
    }
}