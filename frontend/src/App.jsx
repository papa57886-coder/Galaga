import { useState } from 'react';
import GalagaGame from './components/GalagaGame';
import MainMenu from './components/MainMenu';
import GameLayout from './components/GameLayout'; 
import './App.css';

function App() {
  const [jugando, setJugando] = useState(false);

  return (
   
    <GameLayout>
      
   
      {!jugando ? (
        <MainMenu onStart={() => setJugando(true)} />
      ) : (
        <GalagaGame />
      )}
      
    </GameLayout>
  );
}

export default App;