"use strict"

let config = {
    parent: 'phaser-game',
    type: Phaser.CANVAS,
    render: {
        pixelArt: true
    },
    width: 1100,
    height: 1200,
    scene: [Movement]
}

const game = new Phaser.Game(config);