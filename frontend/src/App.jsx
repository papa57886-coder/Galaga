import { useState } from 'react';
import GalagaGame from './components/GalagaGame';
import MainMenu from './components/MainMenu';
import './App.css';

const LeftPanel = () => (
  <aside className="galaga-panel galaga-panel--left">
    <div className="panel-content">
      <h2 className="panel-title">Historia</h2>
      <p className="panel-text">
        Eres el unico capaz de hacer que sobreviva la humanidad, al abrirse el portal de DOOM en la tierra, los alieniegnas atacan y solo tu puedes detenerlos
      </p>
    </div>
  </aside>
);

const RightPanel = () => (
  <aside className="galaga-panel galaga-panel--right">
    <div className="panel-content">
      <h2 className="panel-title">Curiosidades</h2>
      <p className="panel-text">
        Tiene final boos, items, y un sistema de puntuacion que permite a los jugadores competir por ver quien tiene el mejor puntaje
      </p>
    </div>
  </aside>
);

function App() {
  const [jugando, setJugando] = useState(false);

  return (
    <div className="galaga-root">
      
      <div className="galaga-bg" />

      
      <div className="galaga-layout">
        <LeftPanel />

        <main className="galaga-center">
          {!jugando ? (
            <MainMenu onStart={() => setJugando(true)} />
          ) : (
            <GalagaGame />
          )}
        </main>

        <RightPanel />
      </div>
    </div>
  );
}

export default App;