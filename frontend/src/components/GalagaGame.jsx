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
          debug: false // HITBOXES
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
      this.load.image('enemy', '/assets/enemigo.png');
      
      // sprites settings

      this.load.spritesheet('enemy2_fly', '/assets/lost_soul_fly.png', { 
        frameWidth: 50,  
        frameHeight: 50  
      }); 

      this.load.spritesheet('enemy2_die', '/assets/lost_soul_die.png', { 
        frameWidth: 50,  
        frameHeight: 60  
      }); 
    }

    function create() {
      // levels
      this.currentLevel = 1;
      this.isTransitioning = true; 

      // bg
      this.stars = this.add.graphics();
      this.starPositions = Array.from({ length: 100 }).map(() => ({
        x: Phaser.Math.Between(0, 800),
        y: Phaser.Math.Between(0, 600),
        speed: Phaser.Math.Between(1, 3)
      }));

      // games
      this.player = this.physics.add.sprite(400, 500, 'player');
      this.player.setCollideWorldBounds(true);
      this.player.body.setSize(35, 80); 
      this.player.body.setOffset(115, 80); 

      // control
      this.cursors = this.input.keyboard.createCursorKeys();
      this.wasd = this.input.keyboard.addKeys({
        up: Phaser.Input.Keyboard.KeyCodes.W,
        down: Phaser.Input.Keyboard.KeyCodes.S,
        left: Phaser.Input.Keyboard.KeyCodes.A,
        right: Phaser.Input.Keyboard.KeyCodes.D
      });
      this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
      
      // laser
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

      //animations
      this.anims.create({
        key: 'fly_soul',
        frames: this.anims.generateFrameNumbers('enemy2_fly', { start: 0, end: 1 }), 
        frameRate: 8, 
        repeat: -1    
      });

      this.anims.create({
        key: 'die_soul',
        frames: this.anims.generateFrameNumbers('enemy2_die', { start: 0, end: 3 }), // Asume que la explosión tiene 5 cuadros
        frameRate: 15,
        repeat: 0,             
        hideOnComplete: true   
      });

      // enemys
      this.enemies = this.physics.add.group();
      
      this.spawnWave = () => {
        for (let row = 0; row < 3; row++) {
          for (let col = 0; col < 8; col++) {
            let x = 150 + col * 70;
            let y = 50 + row * 50;
            
            // La fila superior usa el nuevo sprite animado
            let tipoEnemigo = (row === 0) ? 'enemy2_fly' : 'enemy';
            let enemy = this.enemies.create(x, y, tipoEnemigo);
            
            if (tipoEnemigo === 'enemy2_fly') {
                enemy.play('fly_soul'); 
                enemy.setDisplaySize(50, 50); 
            } else {
                enemy.setDisplaySize(40, 40); 
            }

            enemy.body.setSize(enemy.width, enemy.height);
            enemy.baseX = x;
            enemy.baseY = y;
            enemy.estado = 'formacion'; 
            enemy.puntos = (tipoEnemigo === 'enemy2_fly') ? 300 : 100;
          }
        }
      };

      // ui 
      this.currentScore = 0;
      this.scoreText = this.add.text(16, 16, 'Puntos: 0', { fontSize: '24px', fill: '#fff' });
      this.levelUIText = this.add.text(16, 45, 'Nivel: 1', { fontSize: '24px', fill: '#fff' });
      
      this.centerText = this.add.text(400, 300, 'NIVEL 1', { fontSize: '64px', fill: '#ff0', fontStyle: 'bold' }).setOrigin(0.5);
      this.centerText.setShadow(3, 3, 'rgba(0,0,0,0.5)', 2);

      this.time.delayedCall(2000, () => {
        this.centerText.setVisible(false);
        this.isTransitioning = false;
        this.spawnWave();
      });

      // diing
      this.time.addEvent({
        delay: 1500, 
        callback: () => {
          if (this.isTransitioning) return; 

          let enemigosActivos = this.enemies.countActive();

          // Subir de nivel si no hay enemigos
          if (enemigosActivos === 0) {
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

          let enemigosDisponibles = this.enemies.getChildren().filter(e => e.estado === 'formacion');
          
          if (enemigosDisponibles.length > 0) {
            let atacante = Phaser.Utils.Array.GetRandom(enemigosDisponibles);
            atacante.estado = 'picada';
            
            let velocidadPicada = 250 + (this.currentLevel * 20); 
            this.physics.moveToObject(atacante, this.player, velocidadPicada);

            let chanceDisparo = Math.max(2, 5 - this.currentLevel); 
            if (Phaser.Math.Between(1, chanceDisparo) === 1) {
              this.time.delayedCall(500, () => {
                if (atacante && atacante.active) {
                  let laser = this.enemyLasers.create(atacante.x, atacante.y, 'enemyLaser');
                  this.physics.moveToObject(laser, this.player, 300 + (this.currentLevel * 10));
                }
              });
            }
          }
        },
        callbackScope: this,
        loop: true
      });

      // colisiones
      this.physics.add.overlap(this.lasers, this.enemies, (laser, enemy) => {
        laser.destroy(); 
        
        this.currentScore += enemy.puntos; 
        this.scoreText.setText('Puntos: ' + this.currentScore);

        // display explosion for enemy2_fly
        if (enemy.texture.key === 'enemy2_fly') {
          let explosion = this.add.sprite(enemy.x, enemy.y, 'enemy2_die');
          explosion.setDisplaySize(80, 80); 
          explosion.play('die_soul');
          
          explosion.on('animationcomplete', () => {
            explosion.destroy();
          });
        }

        enemy.destroy();
      }, null, this);

      const gameOver = () => {
        this.physics.pause();
        this.player.setTint(0xff0000);
        setScoreFinal(this.currentScore);
        setJuegoTerminado(true);
      };

      this.physics.add.overlap(this.player, this.enemies, gameOver, null, this);
      this.physics.add.overlap(this.player, this.enemyLasers, gameOver, null, this);
    }

    function update(time, delta) {
      // player movement
      if (this.cursors.left.isDown || this.wasd.left.isDown) {
        this.player.setVelocityX(-350);
      } else if (this.cursors.right.isDown || this.wasd.right.isDown) {
        this.player.setVelocityX(350);
      } else {
        this.player.setVelocityX(0);
      }

      // shotsss
      if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
        if (this.lasers.countActive(true) < 2) {
          const laser = this.lasers.create(this.player.x, this.player.y - 20, 'laser');
          laser.setVelocityY(-500);
        }
      }

      // starsss
      this.stars.clear();
      this.stars.fillStyle(0xffffff, 0.8);
      this.starPositions.forEach(star => {
        star.y += star.speed;
        if (star.y > 600) star.y = 0;
        this.stars.fillPoint(star.x, star.y, 2);
      });

      // enemigos
      let velocidadOscilacion = 0.002 + (this.currentLevel * 0.0005);
      let oscilacion = Math.sin(time * velocidadOscilacion) * 50; 

      this.enemies.getChildren().forEach((enemy) => {
        if (enemy.estado === 'formacion') {
          enemy.x = enemy.baseX + oscilacion;
          enemy.y = enemy.baseY;
          enemy.setVelocity(0, 0); 
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

      // laser clean cache
      this.lasers.getChildren().forEach((laser) => {
        if (laser && laser.active && laser.y < 0) {
          laser.destroy();
        }
      });
      
      this.enemyLasers.getChildren().forEach((laser) => {
        if (laser && laser.active && laser.y > 600) {
          laser.destroy();
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
    <div style={{ position: 'relative', width: '800px', margin: '0 auto', textAlign: 'center' }}>
      
      {!juegoTerminado && (
        <div style={{ position: 'relative' }}>
          <div id="phaser-container"></div>
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
        <div style={{ backgroundColor: '#222', padding: '50px', borderRadius: '15px', color: 'white', marginTop: '50px' }}>
          <h1>¡NAVE DESTRUIDA!</h1>
          <h2>Tu Puntuación Final: {scoreFinal}</h2>
          
          <form onSubmit={enviarPuntuacion} style={{ marginTop: '30px' }}>
            <input
              type="text"
              placeholder="Ingresa tu nombre..."
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
              style={{ padding: '10px', fontSize: '18px', marginRight: '15px' }}
            />
            <button type="submit" style={{ padding: '10px 20px', fontSize: '18px', cursor: 'pointer', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '5px' }}>
              Guardar en Base de Datos
            </button>
          </form>
        </div>
      )}

    </div>
  );
};

export default GalagaGame;