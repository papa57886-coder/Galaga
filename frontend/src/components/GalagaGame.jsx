import { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';

const GalagaGame = () => {
  const gameRef = useRef(null);
  
  const [juegoTerminado, setJuegoTerminado] = useState(false);
  const [scoreFinal, setScoreFinal] = useState(0);
  const [nombre, setNombre] = useState('');
  const [pausado, setPausado] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !juegoTerminado) {
        setPausado((prevPausado) => {
          const nuevoEstadoPausa = !prevPausado;
          if (gameRef.current) {
            if (nuevoEstadoPausa) {
              gameRef.current.scene.pause('MainScene');
            } else {
              gameRef.current.scene.resume('MainScene');
            }
          }
          return nuevoEstadoPausa;
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [juegoTerminado]);

  useEffect(() => {
    if (juegoTerminado) return;

    const config = {
      type: Phaser.AUTO,
      width: 800,
      height: 600,
      parent: 'phaser-container',
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { y: 0 },
          debug: false 
        }
      },
      scene: {
        key: 'MainScene',
        preload: preload,
        create: create,
        update: update
      }
    };

    if (!gameRef.current) {
      gameRef.current = new Phaser.Game(config);
    }

    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };

    function preload() {
      this.load.image('player', '/assets/player.png');
      this.load.image('live', '/assets/live.png');     // src healts
      this.load.image('items', '/assets/items.png');   // src items
      
      this.load.spritesheet('enemy2_fly', '/assets/lost_soul_fly.png', { 
        frameWidth: 50,  
        frameHeight: 50  
      }); 

      this.load.spritesheet('enemy2_die', '/assets/lost_soul_die.png', { 
        frameWidth: 50,  
        frameHeight: 60  
      }); 

      this.load.spritesheet('caco_fly', '/assets/cocodemonl_fly.png', { 
        frameWidth: 50,  
        frameHeight: 50  
      }); 

      this.load.spritesheet('caco_die', '/assets/cocodemon_die.png', { 
        frameWidth: 50,  
        frameHeight: 60  
      }); 

      this.load.spritesheet('final_boss_fly', '/assets/final_boss_fly.png', { 
        frameWidth: 103,  
        frameHeight: 96  
      }); 

      this.load.spritesheet('final_boss_die', '/assets/final_boss_die.png', { 
        frameWidth: 112,  
        frameHeight: 92  
      });
    }

    function create() {
      this.currentLevel = 1;
      this.isTransitioning = true; 

      this.bossPhase2 = false;
      this.bossMinionEvent = null;

      this.stars = this.add.graphics();
      this.starPositions = Array.from({ length: 100 }).map(() => ({
        x: Phaser.Math.Between(0, 800),
        y: Phaser.Math.Between(0, 600),
        speed: Phaser.Math.Between(1, 3)
      }));

      this.player = this.physics.add.sprite(400, 500, 'player');
      this.player.setCollideWorldBounds(true);
      this.player.body.setSize(35, 80); 
      this.player.body.setOffset(115, 80); 

      this.cursors = this.input.keyboard.createCursorKeys();
      this.wasd = this.input.keyboard.addKeys({
        up: Phaser.Input.Keyboard.KeyCodes.W,
        down: Phaser.Input.Keyboard.KeyCodes.S,
        left: Phaser.Input.Keyboard.KeyCodes.A,
        right: Phaser.Input.Keyboard.KeyCodes.D
      });
      this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
      this.nextLevelKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.N);
      
      const laserG = this.add.graphics();
      laserG.fillStyle(0xffff00, 1);
      laserG.fillRect(0, 0, 4, 15); 
      laserG.generateTexture('laser', 4, 15);
      laserG.destroy();
      this.lasers = this.physics.add.group();

      const enemyLaserG = this.add.graphics();
      enemyLaserG.fillStyle(0xff0000, 1); 
      enemyLaserG.fillRect(0, 0, 5, 15);  
      enemyLaserG.generateTexture('enemyLaser', 5, 15);
      enemyLaserG.destroy(); 
      this.enemyLasers = this.physics.add.group();

      // shield
      const shieldG = this.add.graphics();
      shieldG.fillStyle(0x00ffff, 1); 
      shieldG.fillCircle(10, 10, 10);  
      shieldG.generateTexture('shield_drop', 20, 20);
      shieldG.destroy(); 
      this.shields = this.physics.add.group();

      // double shot lol
      const doubleGunG = this.add.graphics();
      doubleGunG.fillStyle(0xff00ff, 1); 
      doubleGunG.fillRect(0, 0, 15, 15);  
      doubleGunG.generateTexture('double_gun_drop', 15, 15);
      doubleGunG.destroy(); 
      this.doubleGuns = this.physics.add.group();

      // shotgun drop
      const shotgunG = this.add.graphics();
      shotgunG.fillStyle(0x00ff00, 1); 
      shotgunG.fillTriangle(0, 15, 7.5, 0, 15, 15); 
      shotgunG.generateTexture('shotgun_drop', 15, 15);
      shotgunG.destroy(); 
      this.shotguns = this.physics.add.group();

      this.anims.create({
        key: 'fly_soul',
        frames: this.anims.generateFrameNumbers('enemy2_fly', { start: 0, end: 1 }), 
        frameRate: 8, 
        repeat: -1    
      });

      this.anims.create({
        key: 'die_soul',
        frames: this.anims.generateFrameNumbers('enemy2_die', { start: 0, end: 3 }),
        frameRate: 15,
        repeat: 0,             
        hideOnComplete: true   
      });

      this.anims.create({
        key: 'fly_caco',
        frames: this.anims.generateFrameNumbers('caco_fly', { start: 0, end: 1 }),
        frameRate: 4, 
        repeat: -1    
      });

      this.anims.create({
        key: 'die_caco',
        frames: this.anims.generateFrameNumbers('caco_die', { start: 0, end: 3 }),
        frameRate: 10,
        repeat: 0,             
        hideOnComplete: true   
      });

      this.anims.create({
        key: 'fly_boss',
        frames: this.anims.generateFrameNumbers('final_boss_fly', { start: 0, end: 2 }), 
        frameRate: 4, 
        repeat: -1    
      });

      this.anims.create({
        key: 'die_boss',
        frames: this.anims.generateFrameNumbers('final_boss_die', { start: 0, end: 2 }), 
        frameRate: 8,
        repeat: 0,             
        hideOnComplete: true   
      });

      this.enemies = this.physics.add.group();
      
      this.spawnWave = () => {
        if (this.currentLevel >= 10) {
          let boss = this.enemies.create(400, 150, 'final_boss_fly'); 
          boss.play('fly_boss');
          boss.setDisplaySize(154, 144); 
          boss.body.setSize(boss.width, boss.height);
          boss.baseX = 400;
          boss.baseY = 150;
          boss.estado = 'boss_movimiento'; 
          boss.puntos = 5000;
          boss.isBoss = true;
          boss.hp = 50; 
          
          this.bossMaxHp = 50;
          this.bossHpText = this.add.text(400, 40, 'FINAL BOSS', { fontSize: '20px', fill: '#ff0000', fontStyle: 'bold' }).setOrigin(0.5);
          
          this.bossHpBarBg = this.add.graphics();
          this.bossHpBarBg.fillStyle(0x330000, 1);
          this.bossHpBarBg.fillRect(200, 60, 400, 20); 
          
          this.bossHpBar = this.add.graphics();
          this.bossHpBar.fillStyle(0xff0000, 1);
          this.bossHpBar.fillRect(200, 60, 400, 20); 

          return;
        }

        let layout = [];
        
        if (this.currentLevel <= 3) {
          for (let r = 0; r < 3; r++) {
            for (let c = 0; c < 8; c++) layout.push({x: 150 + c * 70, y: 50 + r * 50, row: r});
          }
        } else if (this.currentLevel <= 6) {
          for (let r = 0; r < 5; r++) {
            layout.push({x: 400 - r * 60, y: 50 + r * 45, row: r});
            if (r > 0) layout.push({x: 400 + r * 60, y: 50 + r * 45, row: r});
          }
        } else {
          for (let r = 0; r < 4; r++) {
            for (let c = 0; c < 3; c++) {
              layout.push({x: 150 + c * 50, y: 50 + r * 50, row: r}); 
              layout.push({x: 550 + c * 50, y: 50 + r * 50, row: r}); 
            }
          }
        }

        layout.forEach(pos => {
          let tipoEnemigo = (pos.row === 0) ? 'enemy2_fly' : 'caco_fly';
          let enemy = this.enemies.create(pos.x, pos.y, tipoEnemigo);
          
          if (tipoEnemigo === 'enemy2_fly') {
            enemy.play('fly_soul'); 
            enemy.setDisplaySize(50, 50); 
          } else {
            enemy.play('fly_caco'); 
            enemy.setDisplaySize(40, 40); 
          }

          enemy.body.setSize(enemy.width, enemy.height);
          enemy.baseX = pos.x;
          enemy.baseY = pos.y;
          enemy.estado = 'formacion'; 
          enemy.puntos = (tipoEnemigo === 'enemy2_fly') ? 300 : 100;
          enemy.isMinion = false; 
        });
      };

      this.currentScore = 0;
      this.playerLives = 2; 
      this.isInvulnerable = false; 

      this.scoreText = this.add.text(16, 16, 'Puntos: 0', { fontSize: '24px', fill: '#fff' });
      this.levelUIText = this.add.text(16, 45, 'Nivel: 1', { fontSize: '24px', fill: '#fff' });

      // life and looting
      this.livesGroup = this.add.group();

      this.updateLivesDisplay = () => {
        this.livesGroup.clear(true, true); 
        for (let i = 0; i < this.playerLives; i++) {
          let lifeIcon = this.add.image(700 + (i * 35), 35, 'live'); 
          lifeIcon.setDisplaySize(30, 30); 
          this.livesGroup.add(lifeIcon);
        }
      };
      
      this.updateLivesDisplay(); 

      this.activeItemIcon = this.add.image(715, 75, 'items');
      this.activeItemIcon.setDisplaySize(35, 35); 
      this.activeItemIcon.setVisible(false); 
   

      this.weaponState = 'normal'; 
      this.weaponTimer = null;     

      const setWeaponState = (state, duration = 8000) => {
        this.weaponState = state;
        
        if (this.weaponTimer) {
          this.weaponTimer.remove(); 
        }

        if (state !== 'normal') {
          this.activeItemIcon.setVisible(true); 
          
          this.weaponTimer = this.time.delayedCall(duration, () => {
            this.weaponState = 'normal'; 
            this.activeItemIcon.setVisible(false); 
          });
        } else {
          this.activeItemIcon.setVisible(false); 
        }
      };
      
      this.centerText = this.add.text(400, 300, 'NIVEL 1', { fontSize: '64px', fill: '#ff0', fontStyle: 'bold' }).setOrigin(0.5);
      this.centerText.setShadow(3, 3, 'rgba(0,0,0,0.5)', 2);

      this.time.delayedCall(2000, () => {
        this.centerText.setVisible(false);
        this.isTransitioning = false;
        this.spawnWave();
      });

      this.jumpToLevel = (level) => {
        if (this.currentLevel === level && !this.isTransitioning) return;
        
        this.currentLevel = level;
        this.isTransitioning = true;
        
        if (this.bossMinionEvent) this.bossMinionEvent.destroy();
        this.bossPhase2 = false;

        this.enemies.clear(true, true);
        this.enemyLasers.clear(true, true);
        this.shields.clear(true, true); 
        this.doubleGuns.clear(true, true); 
        this.shotguns.clear(true, true); 
        
        if (this.bossHpText) this.bossHpText.destroy();
        if (this.bossHpBarBg) this.bossHpBarBg.destroy();
        if (this.bossHpBar) this.bossHpBar.destroy();
        
        this.levelUIText.setText('Nivel: ' + this.currentLevel);
        this.centerText.setText('NIVEL ' + this.currentLevel);
        this.centerText.setVisible(true);

        this.time.delayedCall(1500, () => {
          this.centerText.setVisible(false);
          this.isTransitioning = false;
          this.spawnWave();
        });
      };

      const gameOver = () => {
        this.physics.pause();
        this.player.setTint(0xff0000);
        setScoreFinal(this.currentScore);
        setJuegoTerminado(true);
      };

      const loseLife = (player, hazard) => {
        if (this.isInvulnerable) return; 

        this.playerLives -= 1;
        setWeaponState('normal'); 
        this.updateLivesDisplay();

        if (this.playerLives <= 0) {
          gameOver();
        } else {
          this.isInvulnerable = true;

          if (hazard.texture && hazard.texture.key === 'enemyLaser') {
            hazard.destroy();
          }

          this.tweens.add({
            targets: this.player,
            alpha: 0.2,
            yoyo: true,
            repeat: 5,     
            duration: 200, 
            onComplete: () => {
              this.player.setAlpha(1);
              this.isInvulnerable = false; 
            }
          });
        }
      };

      this.time.addEvent({
        delay: 1500, 
        callback: () => {
          if (this.isTransitioning) return; 

          let enemigosActivos = this.enemies.countActive();

          if (enemigosActivos === 0) {
            if (this.currentLevel >= 10) {
              this.isTransitioning = true;
              this.centerText.setText('¡VICTORIA TOTAL!');
              this.centerText.setVisible(true);
              this.physics.pause();
              this.time.delayedCall(3000, () => {
                setScoreFinal(this.currentScore);
                setJuegoTerminado(true);
              });
              return;
            }

            this.isTransitioning = true;
            this.currentLevel++;
            
            this.levelUIText.setText('Nivel: ' + this.currentLevel);
            this.centerText.setText('NIVEL ' + this.currentLevel);
            this.centerText.setVisible(true);

            this.time.delayedCall(2000, () => {
              this.centerText.setVisible(false);
              this.isTransitioning = false;
              this.spawnWave();
            });
            return;
          }

          let enemigosDisponibles = this.enemies.getChildren().filter(e => e.estado === 'formacion' || e.estado === 'boss_movimiento');
          
          if (enemigosDisponibles.length > 0) {
            let atacante = Phaser.Utils.Array.GetRandom(enemigosDisponibles);
            
            if (!atacante.isBoss) {
              atacante.estado = 'picada';
              let velocidadPicada = 250 + (this.currentLevel * 20); 
              this.physics.moveToObject(atacante, this.player, velocidadPicada);
            }

            let chanceDisparo = atacante.isBoss ? 1 : Math.max(2, 5 - this.currentLevel); 
            if (Phaser.Math.Between(1, chanceDisparo) === 1) {
              this.time.delayedCall(500, () => {
                if (atacante && atacante.active) {
                  let laser = this.enemyLasers.create(atacante.x, atacante.y, 'enemyLaser');
                  let velDisparo = atacante.isBoss ? 500 : 300 + (this.currentLevel * 10);
                  this.physics.moveToObject(laser, this.player, velDisparo);
                }
              });
            }
          }
        },
        callbackScope: this,
        loop: true
      });

      this.physics.add.overlap(this.lasers, this.enemies, (laser, enemy) => {
        laser.destroy(); 

        if (enemy.isBoss) {
          enemy.hp -= 1;
          enemy.setTint(0xff0000); 
          
          if (this.bossHpBar) {
             let hpPercentage = Math.max(enemy.hp, 0) / this.bossMaxHp;
             this.bossHpBar.clear();
             this.bossHpBar.fillStyle(0xff0000, 1);
             this.bossHpBar.fillRect(200, 60, 400 * hpPercentage, 20);
          }

          if (enemy.hp <= (this.bossMaxHp / 2) && !this.bossPhase2) {
            this.bossPhase2 = true;
            
            this.bossMinionEvent = this.time.addEvent({
              delay: 3000, 
              callback: () => {
                if (!enemy.active) return; 

                let m1 = this.enemies.create(150, -50, 'enemy2_fly');
                m1.play('fly_soul');
                m1.setDisplaySize(50, 50);
                m1.body.setSize(m1.width, m1.height);
                m1.baseX = 150; m1.baseY = 100;
                m1.estado = 'picada'; 
                m1.puntos = 300;
                m1.isMinion = true; 
                this.physics.moveToObject(m1, this.player, 350);

                let m2 = this.enemies.create(650, -50, 'caco_fly');
                m2.play('fly_caco');
                m2.setDisplaySize(40, 40);
                m2.body.setSize(m2.width, m2.height);
                m2.baseX = 650; m2.baseY = 100;
                m2.estado = 'picada'; 
                m2.puntos = 100;
                m2.isMinion = true; 
                this.physics.moveToObject(m2, this.player, 350);
              },
              callbackScope: this,
              loop: true
            });
          }

          this.time.delayedCall(100, () => {
            if (enemy && enemy.active) enemy.clearTint();
          });
      
          if (enemy.hp > 0) return; 
          
          if (this.bossHpText) this.bossHpText.destroy();
          if (this.bossHpBarBg) this.bossHpBarBg.destroy();
          if (this.bossHpBar) this.bossHpBar.destroy();
          
          if (this.bossMinionEvent) this.bossMinionEvent.destroy(); 
          
          this.enemies.getChildren().forEach(minion => {
            if (minion !== enemy) {
              minion.destroy();
            }
          });
        }
        
        this.currentScore += enemy.puntos; 
        this.scoreText.setText('Puntos: ' + this.currentScore);

        if (enemy.texture.key === 'enemy2_fly') {
          let explosion = this.add.sprite(enemy.x, enemy.y, 'enemy2_die');
          explosion.setDisplaySize(80, 80); 
          explosion.play('die_soul');
          explosion.on('animationcomplete', () => explosion.destroy());
        } 
        else if (enemy.texture.key === 'caco_fly') {
          let explosion = this.add.sprite(enemy.x, enemy.y, 'caco_die');
          explosion.setDisplaySize(60, 60); 
          explosion.play('die_caco');
          explosion.on('animationcomplete', () => explosion.destroy());
        }
        else if (enemy.texture.key === 'final_boss_fly') {
          let explosion = this.add.sprite(enemy.x, enemy.y, 'final_boss_die');
          explosion.setDisplaySize(168, 138); 
          explosion.setOrigin(0.5, 0.5); 
          explosion.play('die_boss');
          explosion.on('animationcomplete', () => explosion.destroy());
        }

        if (!enemy.isBoss) {
          let randDrop = Phaser.Math.Between(1, 100);
          
          let chanceTotal = enemy.isMinion ? 50 : 20;
          
          if (randDrop <= (chanceTotal * 0.5)) { 
            let shield = this.shields.create(enemy.x, enemy.y, 'shield_drop');
            shield.setVelocityY(150);
          } else if (randDrop > (chanceTotal * 0.5) && randDrop <= (chanceTotal * 0.75)) { 
            let dGun = this.doubleGuns.create(enemy.x, enemy.y, 'double_gun_drop');
            dGun.setVelocityY(150);
          } else if (randDrop > (chanceTotal * 0.75) && randDrop <= chanceTotal) {
            let sGun = this.shotguns.create(enemy.x, enemy.y, 'shotgun_drop');
            sGun.setVelocityY(150);
          }
        }

        enemy.destroy();
      }, null, this);

      this.physics.add.overlap(this.player, this.enemies, loseLife, null, this);
      this.physics.add.overlap(this.player, this.enemyLasers, loseLife, null, this);
      
      this.physics.add.overlap(this.player, this.shields, (player, shield) => {
        shield.destroy();
        if (this.playerLives < 2) {
          this.playerLives += 1;
          this.updateLivesDisplay(); // Actualizar interfaz de vidas
        } else {
          this.currentScore += 500;
          this.scoreText.setText('Puntos: ' + this.currentScore);
        }
      }, null, this);

      this.physics.add.overlap(this.player, this.doubleGuns, (player, dGun) => {
        dGun.destroy();
        setWeaponState('double', 8000); 
        this.currentScore += 1000; 
        this.scoreText.setText('Puntos: ' + this.currentScore);
      }, null, this);

      this.physics.add.overlap(this.player, this.shotguns, (player, sGun) => {
        sGun.destroy();
        setWeaponState('shotgun', 8000); 
        this.currentScore += 1000; 
        this.scoreText.setText('Puntos: ' + this.currentScore);
      }, null, this);
    }

    function update(time, delta) {
      if (this.cursors.left.isDown || this.wasd.left.isDown) {
        this.player.setVelocityX(-350);
      } else if (this.cursors.right.isDown || this.wasd.right.isDown) {
        this.player.setVelocityX(350);
      } else {
        this.player.setVelocityX(0);
      }

      if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
        let maxLasers = this.weaponState === 'shotgun' ? 6 : (this.weaponState === 'double' ? 4 : 2);

        if (this.lasers.countActive(true) < maxLasers) {
          
          if (this.weaponState === 'double') {
            const laser1 = this.lasers.create(this.player.x - 15, this.player.y - 20, 'laser');
            laser1.setVelocityY(-500);
            
            const laser2 = this.lasers.create(this.player.x + 15, this.player.y - 20, 'laser');
            laser2.setVelocityY(-500);

          } else if (this.weaponState === 'shotgun') {
            const laserL = this.lasers.create(this.player.x, this.player.y - 20, 'laser');
            laserL.setVelocity(-150, -500); 

            const laserC = this.lasers.create(this.player.x, this.player.y - 20, 'laser');
            laserC.setVelocity(0, -500); 

            const laserR = this.lasers.create(this.player.x, this.player.y - 20, 'laser');
            laserR.setVelocity(150, -500); 

          } else {
            const laser = this.lasers.create(this.player.x, this.player.y - 20, 'laser');
            laser.setVelocityY(-500);
          }
        }
      }

      if (Phaser.Input.Keyboard.JustDown(this.nextLevelKey)) {
        if (this.currentLevel < 10 && !this.isTransitioning) {
          this.jumpToLevel(this.currentLevel + 1);
        }
      }

      this.stars.clear();
      this.stars.fillStyle(0xffffff, 0.8);
      this.starPositions.forEach(star => {
        star.y += star.speed;
        if (star.y > 600) star.y = 0;
        this.stars.fillPoint(star.x, star.y, 2);
      });

      let velocidadOscilacion = 0.002 + (this.currentLevel * 0.0005);
      let oscilacion = Math.sin(time * velocidadOscilacion) * 50; 

      this.enemies.getChildren().forEach((enemy) => {
        if (enemy.estado === 'formacion') {
          enemy.x = enemy.baseX + oscilacion;
          enemy.y = enemy.baseY;
          enemy.setVelocity(0, 0); 
        } 
        else if (enemy.estado === 'boss_movimiento') {
          enemy.x = 400 + Math.sin(time * 0.001) * 300; 
          enemy.y = enemy.baseY + Math.cos(time * 0.002) * 50; 
        }
        else if (enemy.estado === 'picada') {
          if (enemy.y > 650) {
            enemy.y = -50;
            enemy.estado = 'retornando';
          }
        } 
        else if (enemy.estado === 'retornando') {
          let targetX = enemy.baseX + oscilacion;
          let targetY = enemy.baseY;
          
          this.physics.moveTo(enemy, targetX, targetY, 200);
          
          let distancia = Phaser.Math.Distance.Between(enemy.x, enemy.y, targetX, targetY);
          if (distancia < 10) {
            enemy.estado = 'formacion';
            enemy.body.reset(targetX, targetY);
          }
        }
      });

      this.lasers.getChildren().forEach((laser) => {
        if (laser && laser.active && (laser.y < 0 || laser.x < 0 || laser.x > 800)) {
          laser.destroy();
        }
      });
      
      this.enemyLasers.getChildren().forEach((laser) => {
        if (laser && laser.active && laser.y > 600) {
          laser.destroy();
        }
      });

      this.shields.getChildren().forEach((shield) => {
        if (shield && shield.active && shield.y > 600) {
          shield.destroy();
        }
      });

      this.doubleGuns.getChildren().forEach((dGun) => {
        if (dGun && dGun.active && dGun.y > 600) {
          dGun.destroy();
        }
      });

      this.shotguns.getChildren().forEach((sGun) => {
        if (sGun && sGun.active && sGun.y > 600) {
          sGun.destroy();
        }
      });
    }
  }, [juegoTerminado]); 

  const enviarPuntuacion = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:8000/api/guardar-puntuacion/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nombre: nombre,
          score: scoreFinal
        })
      });

      if (response.ok) {
        alert('¡Datos guardados en PostgreSQL exitosamente!');
        setNombre('');
        setScoreFinal(0);
        setJuegoTerminado(false);
        setPausado(false);
      } else {
        alert('Hubo un problema al guardar la puntuación.');
      }
    } catch (error) {
      console.error('Error de conexión:', error);
      alert('Error al conectar con el servidor.');
    }
  };

  return (
    <div style={{ position: 'relative', width: '800px', height: '600px', margin: '0 auto', textAlign: 'center' }}>
      
      {!juegoTerminado && (
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
          <div id="phaser-container" style={{ width: '100%', height: '100%' }}></div>
          {pausado && (
            <div style={{
              position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
              backgroundColor: 'rgba(0, 0, 0, 0.7)', display: 'flex', flexDirection: 'column',
              justifyContent: 'center', alignItems: 'center', color: 'white', zIndex: 10
            }}>
              <h1 style={{ fontSize: '60px', margin: '0 0 10px 0', textShadow: '3px 3px 6px #000' }}>PAUSA</h1>
              <p style={{ fontSize: '24px' }}>Presiona ESC para continuar</p>
            </div>
          )}
        </div>
      )}

      {juegoTerminado && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '800px', 
          height: '600px', 
          backgroundColor: 'rgba(0, 0, 0, 0.9)', 
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          color: '#fff',
          zIndex: 20, 
          fontFamily: '"Courier New", Courier, monospace', 
          border: '4px solid #333',
          boxShadow: 'inset 0 0 50px rgba(255, 0, 0, 0.2)' 
        }}>
          
          <h1 style={{ 
            fontSize: '70px', 
            color: '#ff0000', 
            textShadow: '4px 4px 0px #550000', 
            margin: '0 0 20px 0', 
            letterSpacing: '5px' 
          }}>
            GAME OVER
          </h1>
          
          <h2 style={{ 
            fontSize: '32px', 
            color: '#ffeb3b', 
            margin: '0 0 50px 0',
            textShadow: '2px 2px 0px #888'
          }}>
            SCORE: {scoreFinal}
          </h2>
          
          <form onSubmit={enviarPuntuacion} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '25px' }}>
            <input
              type="text"
              placeholder="INGRESA TU NOMBRE"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
              style={{ 
                padding: '15px 20px', 
                fontSize: '24px', 
                fontFamily: '"Courier New", Courier, monospace',
                backgroundColor: '#000',
                color: '#0f0', 
                border: '2px solid #0f0',
                textAlign: 'center',
                outline: 'none',
                textTransform: 'uppercase', 
                width: '350px'
              }}
            />
            <button type="submit" style={{ 
              padding: '15px 30px', 
              fontSize: '22px', 
              fontFamily: '"Courier New", Courier, monospace',
              cursor: 'pointer', 
              backgroundColor: '#000', 
              color: '#00ffff', 
              border: '2px solid #00ffff', 
              textTransform: 'uppercase',
              letterSpacing: '2px',
              transition: 'all 0.2s ease-in-out'
            }}
            onMouseOver={(e) => { e.target.style.backgroundColor = '#00ffff'; e.target.style.color = '#000'; }}
            onMouseOut={(e) => { e.target.style.backgroundColor = '#000'; e.target.style.color = '#00ffff'; }}
            >
              GUARDAR PUNTUACIÓN
            </button>
          </form>

        </div>
      )}

    </div>
  );
};

export default GalagaGame;