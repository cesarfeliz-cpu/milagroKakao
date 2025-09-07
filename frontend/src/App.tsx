import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [message, setMessage] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    fetch('/api/health')
      .then(res => res.json())
      .then(data => {
        setMessage(data.message)
        setLoading(false)
      })
      .catch(err => {
        console.error('Error connecting to backend:', err)
        setMessage('Error connecting to backend')
        setLoading(false)
      })
  }, [])

  return (
    <div className="App">
      <header className="App-header">
        <h1>Frontend Application</h1>
        <div className="status-card">
          <h2>Backend Status</h2>
          {loading ? (
            <p>Connecting to backend...</p>
          ) : (
            <p>{message}</p>
          )}
        </div>
      </header>
    </div>
  )
}

export default App