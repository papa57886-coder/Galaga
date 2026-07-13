import GalagaGame from './components/GalagaGame';

function App() {
  return (

    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',        
      backgroundColor: '#111',
      margin: 0
    }}>
      <GalagaGame />
    </div>
    
  );
}

export default App;