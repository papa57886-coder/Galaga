import { useEffect, useState } from 'react';

const MainMenu = ({ onStart }) => {
  const [mostrarTexto, setMostrarTexto] = useState(true);

  
  useEffect(() => {
    const intervalo = setInterval(() => {
      setMostrarTexto((prev) => !prev);
    }, 600);
    return () => clearInterval(intervalo);
  }, []);

 
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Enter') {
        onStart();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onStart]);

  return (
    <div style={estilos.contenedor}>
  
      <div style={estilos.estrellas}></div>

     
      <img src="/assets/logo.png" alt="Galaga Logo" style={estilos.logo} />
      


      <div style={{ ...estilos.instruccion, opacity: mostrarTexto ? 1 : 0 }}>
        PRESIONA 'ENTER' PARA JUGAR
      </div>
    </div>
  );
};

const estilos = {
  contenedor: {
    width: '800px',
    height: '600px',
    backgroundColor: '#000',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
    border: '4px solid #222',
    boxShadow: '0 0 20px rgba(0, 255, 255, 0.2)',
  },
  logo: {
    width: '400px', 
    marginBottom: '60px',
    zIndex: 10,
    filter: 'drop-shadow(0px 0px 10px rgba(255, 255, 0, 0.8))' 
  },
  logoTexto: {
    fontFamily: '"Courier New", Courier, monospace',
    fontSize: '80px',
    color: '#ffeb3b',
    textShadow: '4px 4px 0px #f00, -4px -4px 0px #00f', 
    marginBottom: '60px',
    zIndex: 10,
    letterSpacing: '10px'
  },
  instruccion: {
    fontFamily: '"Press Start 2P", "Courier New", monospace', 
    fontSize: '24px',
    color: '#fff',
    textShadow: '2px 2px 0px #f00',
    zIndex: 10,
    letterSpacing: '2px'
  },


  estrellas: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundImage: 'radial-gradient(1px 1px at 20px 30px, #eee, rgba(0,0,0,0)), radial-gradient(1px 1px at 40px 70px, #fff, rgba(0,0,0,0)), radial-gradient(1px 1px at 50px 160px, #ddd, rgba(0,0,0,0)), radial-gradient(1px 1px at 90px 40px, #fff, rgba(0,0,0,0)), radial-gradient(1px 1px at 130px 80px, #fff, rgba(0,0,0,0)), radial-gradient(1px 1px at 160px 120px, #ddd, rgba(0,0,0,0))',
    backgroundRepeat: 'repeat',
    backgroundSize: '200px 200px',
    opacity: 0.5,
    zIndex: 1
  }
};

export default MainMenu;