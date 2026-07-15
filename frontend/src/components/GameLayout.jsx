import React from 'react';
import './GameLayout.css'; 

const GameLayout = ({ children }) => {
  return (
    <div className="game-layout-root">
      
      {/* Panel Izquierdo - Historia */}
      <aside className="retro-panel">
        <h2 className="retro-title">Historia</h2>
        <p className="retro-text">
          Eres el único capaz de hacer que sobreviva la humanidad. Al abrirse el portal de DOOM en la tierra, los alienígenas atacan y solo tú puedes detenerlos.
        </p>
      </aside>


      <main className="game-container-slot">
        {children}
      </main>

      {/* Panel Derecho - Curiosidades */}
      <aside className="retro-panel">
        <h2 className="retro-title">Curiosidades</h2>
        <p className="retro-text">
          Tiene final boss, items, y un sistema de puntuación que permite a los jugadores competir por ver quién tiene el mejor puntaje.
        </p>
      </aside>

    </div>
  );
};

export default GameLayout;