import React, { useState, useEffect } from 'react';
import './GameLayout.css'; 

const GameLayout = ({ children }) => {
  const [topScores, setTopScores] = useState([]);


  useEffect(() => {
    const fetchTopScores = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/top-puntuaciones/');
        if (response.ok) {
          const data = await response.json();
          setTopScores(data);
        } else {
          console.error('Error al obtener puntuaciones');
        }
      } catch (error) {
        console.error('Error de red:', error);
      }
    };

    fetchTopScores();
    
    
    const interval = setInterval(fetchTopScores, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="game-layout-root">
      
    
      <aside className="retro-panel">
        <h2 className="retro-title">Historia</h2>
        <p className="retro-text">
          Eres el único capaz de hacer que sobreviva la humanidad. Al abrirse el portal de DOOM en la tierra, los alienígenas atacan y solo tú puedes detenerlos.
        </p>
      </aside>

     
      <main className="game-container-slot">
        {children}
      </main>

    
      <aside className="retro-panel">
        <h2 className="retro-title">Top 10 Scores</h2>
        <div className="retro-text leaderboard-container">
          {topScores.length > 0 ? (
            <ol className="score-list">
              {topScores.map((player, index) => (
                <li key={player.id || index} className="score-item">
                  <span className="player-name">
                    {index + 1}. {player.nombre}
                  </span>
                  <span className="player-score">
                    {player.score}
                  </span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="loading-text">Cargando...</p>
          )}
        </div>
      </aside>

    </div>
  );
};

export default GameLayout;