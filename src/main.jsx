import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'

function App() {
  return (
    <main>
      <section aria-labelledby="page-title">
        <p className="eyebrow">A tiny React app</p>
        <h1 id="page-title">Hello, world!</h1>
        <p className="message">Your new web app is up and running.</p>
      </section>
    </main>
  )
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
