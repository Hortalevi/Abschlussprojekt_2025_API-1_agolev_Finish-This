import { useEffect } from 'react'
import './App.css'

function App() {
  useEffect(() =>{
    fetch('http://localhost:3001/api/ping')
    .then(res => res.json())
    .then(data => console.log(data));
  }, []);
  return (
    <div>
      <h1>Finish This!</h1>
      <p>Check console for backend response.</p>
    </div>
  );
}  

export default App
