// Aayan Abdullah
// Wacky Wars - Shooting Game

let score = 0;
let lives = 3;
let highScore = 0;

class Movement extends Phaser.Scene {
    constructor() {
        super('movementScene');
        this.my = { sprite: {} };

        this.playerSpeed = 1000;
        this.bulletSpeed = 1400;
        this.enemyBulletSpeed = 200;
        this.gameOver = false;
        this.wave = 1;
        this.lastFired = 0;
        this.fireDelay = 1000;
    }

    preload() {
        this.load.setPath('./assets/');
        this.load.image('player', 'spaceship.png');
        this.load.image('bullet', 'shipbullet.png');
        this.load.image('alien1', 'alien1.png');
        this.load.image('alien2', 'alien2.png');
        this.load.image('alien1bullet', 'alien1bullet.png');
        this.load.image('alien2bullet', 'alien2bullet.png');
        this.load.image('background', 'background.png');

        // Audio
        this.load.audio('shootSound', 'laserLarge_000.ogg');
        this.load.audio('hitSound', 'impactMetal_004.ogg');
        this.load.audio('playerHitSound', 'spaceEngine_000.ogg');
    }

    create() {
        this.initGame();
    }

    initGame() {
        score = 0;
        lives = 3;
        this.gameOver = false;
        this.wave = 1;
        this.enemyBullets = [];
        this.enemies = [];
        this.bullets = [];

        this.children.removeAll();

        let my = this.my;

        this.add.image(
            this.game.config.width / 2,
            this.game.config.height / 2,
            'background'
        ).setDisplaySize(this.game.config.width, this.game.config.height);

        my.sprite.player = this.add.sprite(
            this.game.config.width / 2,
            this.game.config.height - 60,
            'player'
        ).setScale(0.25);

        this.spawnWave();

        this.scoreText = this.add.text(10, 10, 'Score: 0', {
            fontSize: '22px', fill: '#ffffff', fontFamily: 'Arial'
        });
        this.livesText = this.add.text(10, 35, 'Lives: 3', {
            fontSize: '22px', fill: '#ffffff', fontFamily: 'Arial'
        });
        this.waveText = this.add.text(10, 60, 'Wave: 1', {
            fontSize: '22px', fill: '#ffffff', fontFamily: 'Arial'
        });
        this.highScoreText = this.add.text(
            this.game.config.width - 150, 10, 'Best: 0', {
            fontSize: '22px', fill: '#ffff00', fontFamily: 'Arial'
        });

        this.aKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
        this.dKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.rKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);

        // Sound objects
        this.shootSound = this.sound.add('shootSound');
        this.hitSound = this.sound.add('hitSound');
        this.playerHitSound = this.sound.add('playerHitSound');

        // Enemy shooting timer
        this.enemyShootTimer = this.time.addEvent({
            delay: 500,
            callback: this.enemyShoot,
            callbackScope: this,
            loop: true
        });

        // Dive timer
        this.diveTimer = this.time.addEvent({
            delay: 3000,
            callback: this.startDive,
            callbackScope: this,
            loop: true
        });
    }

    spawnWave() {
        this.enemies = [];

        for (let i = 0; i < 6; i++) {
            let path = new Phaser.Curves.Path(200 + i * 150, 300);
            let enemy = this.add.follower(
                path,
                200 + i * 150,
                300,
                'alien1'
            ).setScale(0.25);
            enemy.type = 1;
            enemy.direction = 1;
            enemy.speed = 500 + (this.wave * 100);
            enemy.isDiving = false;
            this.enemies.push(enemy);
        }

        for (let i = 0; i < 3; i++) {
            let enemy = this.add.sprite(
                200 + i * 350,
                100,
                'alien2'
            ).setScale(0.3);
            enemy.type = 2;
            enemy.direction = -1;
            enemy.speed = 300 + (this.wave * 20);
            enemy.isDiving = false;
            this.enemies.push(enemy);
        }
    }

    startDive() {
        if (this.gameOver) return;

        let candidates = this.enemies.filter(e => e.type === 1 && !e.isDiving);
        if (candidates.length === 0) return;

        let diver = candidates[Math.floor(Math.random() * candidates.length)];
        diver.isDiving = true;

        let startX = diver.x;
        let startY = diver.y;
        let path = new Phaser.Curves.Path(startX, startY);

        path.cubicBezierTo(
            startX - 200, startY + 300,
            startX + 300, startY + 100,
            startX - 300, startY + 200
        );

        path.cubicBezierTo(
            startX, startY,
            startX - 300, startY + 400,
            startX + 300, startY + 300
        );

        diver.setPath(path);
        diver.startFollow({
            from: 0,
            to: 1,
            duration: 3000,
            ease: 'Linear',
            repeat: -1,
            rotateToPath: true
        });
    }

    enemyShoot() {
        if (this.enemies.length === 0 || this.gameOver) return;

        let shooter = this.enemies[Math.floor(Math.random() * this.enemies.length)];
        let bulletKey = shooter.type === 1 ? 'alien1bullet' : 'alien2bullet';
        let bulletScale = shooter.type === 1 ? 0.15 : 0.7;
        let b = this.add.sprite(shooter.x, shooter.y + 20, bulletKey).setScale(bulletScale);
        b.speedY = shooter.type === 1
            ? this.enemyBulletSpeed * 6 + (this.wave * 10)
            : this.enemyBulletSpeed * 4 + (this.wave * 15);
        this.enemyBullets.push(b);
    }

    update(time, delta) {
        if (this.gameOver) {
            if (Phaser.Input.Keyboard.JustDown(this.rKey)) {
                this.initGame();
            }
            return;
        }

        let my = this.my;
        let player = my.sprite.player;
        let dt = delta / 1000;
        let currentSpeed = this.playerSpeed + (this.wave * 20);

        if (this.aKey.isDown) {
            player.x -= currentSpeed * dt;
        }

        if (this.dKey.isDown) {
            player.x += currentSpeed * dt;
        }

        player.x = Phaser.Math.Clamp(player.x, 20, this.game.config.width - 20);

        // Fire TWO bullets with delay
        if (Phaser.Input.Keyboard.JustDown(this.spaceKey) &&
            time - this.lastFired > this.fireDelay) {
            this.lastFired = time;

            let b1 = this.add.sprite(player.x - 105, player.y - 100, 'bullet').setScale(0.15);
            b1.speedY = this.bulletSpeed;
            this.bullets.push(b1);

            let b2 = this.add.sprite(player.x + 100, player.y - 100, 'bullet').setScale(0.15);
            b2.speedY = this.bulletSpeed;
            this.bullets.push(b2);

            // Play shoot sound
            this.shootSound.play({ volume: 0.5 });
        }

        for (let b of this.bullets) {
            b.y -= b.speedY * dt;
        }

        this.bullets = this.bullets.filter(b => {
            if (b.y < 0) { b.destroy(); return false; }
            return true;
        });

        for (let enemy of this.enemies) {
            if (enemy.isDiving) continue;
            enemy.x += enemy.direction * enemy.speed * dt;
            if (enemy.x > this.game.config.width - 50) enemy.direction = -1;
            if (enemy.x < 50) enemy.direction = 1;
        }

        for (let eb of this.enemyBullets) {
            eb.y += eb.speedY * dt;
        }

        this.enemyBullets = this.enemyBullets.filter(eb => {
            if (eb.y > this.game.config.height) { eb.destroy(); return false; }
            return true;
        });

        // Check player bullets hitting enemies
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            for (let j = this.enemies.length - 1; j >= 0; j--) {
                if (!this.bullets[i] || !this.enemies[j]) continue;
                let b = this.bullets[i];
                let e = this.enemies[j];
                if (b.x >= e.x - 100 && b.x <= e.x + 100 &&
                    b.y >= e.y - 100 && b.y <= e.y + 100) {
                    let points = e.type === 2 ? 200 : 100;
                    b.destroy();
                    this.bullets.splice(i, 1);
                    e.destroy();
                    this.enemies.splice(j, 1);
                    score += points;
                    this.scoreText.setText('Score: ' + score);
                    // Play hit sound
                    this.hitSound.play({ volume: 0.7 });
                    break;
                }
            }
        }

        // Check enemy bullets hitting player
        for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
            let eb = this.enemyBullets[i];
            if (eb.y >= player.y - 100 && eb.y <= player.y + 100 &&
                eb.x >= player.x - 100 && eb.x <= player.x + 100) {
                eb.destroy();
                this.enemyBullets.splice(i, 1);
                lives--;
                this.livesText.setText('Lives: ' + lives);
                // Play player hit sound
                // Play player hit sound for 1 second only
                this.playerHitSound.play({ volume: 0.8 });
                this.time.delayedCall(1000, () => {
                    this.playerHitSound.stop();
});
                if (lives <= 0) { this.endGame(); }
            }
        }

        // All enemies cleared — next wave
        if (this.enemies.length === 0) {
            this.wave++;
            this.waveText.setText('Wave: ' + this.wave);
            this.spawnWave();

            let waveMsg = this.add.text(
                this.game.config.width / 2,
                this.game.config.height / 2,
                'Wave ' + this.wave + '!', {
                fontSize: '48px', fill: '#ffff00', fontFamily: 'Arial'
            }).setOrigin(0.5);

            this.time.delayedCall(1500, () => { waveMsg.destroy(); });
        }
    }

    endGame() {
        this.gameOver = true;
        this.enemyShootTimer.remove();
        this.diveTimer.remove();

        if (score > highScore) highScore = score;
        this.highScoreText.setText('Best: ' + highScore);

        this.add.rectangle(
            this.game.config.width / 2,
            this.game.config.height / 2,
            400, 220, 0x000000, 0.8
        );

        this.add.text(
            this.game.config.width / 2,
            this.game.config.height / 2 - 50,
            'GAME OVER', {
            fontSize: '48px', fill: '#ff0000', fontFamily: 'Arial'
        }).setOrigin(0.5);

        this.add.text(
            this.game.config.width / 2,
            this.game.config.height / 2,
            'Score: ' + score, {
            fontSize: '28px', fill: '#ffffff', fontFamily: 'Arial'
        }).setOrigin(0.5);

        this.add.text(
            this.game.config.width / 2,
            this.game.config.height / 2 + 45,
            'Press R to play again', {
            fontSize: '22px', fill: '#ffff00', fontFamily: 'Arial'
        }).setOrigin(0.5);
    }
}