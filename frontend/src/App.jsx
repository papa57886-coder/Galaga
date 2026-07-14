import { useState } from 'react';
import GalagaGame from './components/GalagaGame';
import MainMenu from './components/MainMenu'; 

function App() {


  const [jugando, setJugando] = useState(false);

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',        
      backgroundColor: '#111',
      margin: 0
    }}>
      

      {!jugando ? (
        <MainMenu onStart={() => setJugando(true)} />
      ) : (
        <GalagaGame />
      )}

    </div>
  );
}

export default App;