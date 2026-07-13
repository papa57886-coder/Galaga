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
          debug: true //fix hitbox
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
    }

    function create() {

      this.player = this.physics.add.sprite(400, 500, 'player');
      this.player.setCollideWorldBounds(true);
      this.player.body.setSize(35, 200); 
      this.player.body.setOffset(115, 50); 


      this.cursors = this.input.keyboard.createCursorKeys();
      

      this.wasd = this.input.keyboard.addKeys({
        up: Phaser.Input.Keyboard.KeyCodes.W,
        down: Phaser.Input.Keyboard.KeyCodes.S,
        left: Phaser.Input.Keyboard.KeyCodes.A,
        right: Phaser.Input.Keyboard.KeyCodes.D
      });

      this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
      this.enterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER); 
      
  
      const laserG = this.add.graphics();
      laserG.fillStyle(0xffff00, 1); 
      laserG.fillRect(0, 0, 4, 15);  
      laserG.generateTexture('laser', 4, 15);
      laserG.destroy(); 

  
      this.lasers = this.physics.add.group();
      this.enemies = this.physics.add.group();

   
      this.currentScore = 0;
      this.scoreText = this.add.text(16, 16, 'Puntos: 0', { fontSize: '24px', fill: '#fff' });

    
      this.time.addEvent({
        delay: 1000,
        callback: () => {
          const x = Phaser.Math.Between(50, 750);
          const enemy = this.enemies.create(x, 0, 'enemy');
          enemy.setVelocityY(150); 
          enemy.body.setSize(125, 125);
          enemy.body.setOffset(1, 5); 
        },
        callbackScope: this,
        loop: true
      });


      this.physics.add.overlap(this.lasers, this.enemies, (laser, enemy) => {
        laser.destroy(); 
        enemy.destroy(); 
        this.currentScore += 100; 
        this.scoreText.setText('Puntos: ' + this.currentScore);
      }, null, this);

      this.physics.add.overlap(this.player, this.enemies, (player, enemy) => {
        this.physics.pause(); 
        player.setTint(0xff0000); 
        setScoreFinal(this.currentScore); 
        setJuegoTerminado(true); 
      }, null, this);
    }

    function update() {

      if (this.cursors.left.isDown || this.wasd.left.isDown) {
        this.player.setVelocityX(-350);
      } else if (this.cursors.right.isDown || this.wasd.right.isDown) {
        this.player.setVelocityX(350);
      } else {
        this.player.setVelocityX(0);
      }


      if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
        const laser = this.lasers.create(this.player.x, this.player.y - 20, 'laser');
        laser.setVelocityY(-500); 
      }

 
      this.lasers.getChildren().forEach((laser) => {
        if (laser && laser.active && laser.y < 0) {
          laser.destroy();
        }
      });
      this.enemies.getChildren().forEach((enemy) => {
        if (enemy && enemy.active && enemy.y > 600) {
          enemy.destroy();
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
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              color: 'white',
              zIndex: 10
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