import { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'

const getCurrentPosition = () =>
  new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: false,
      maximumAge: 15 * 60 * 1000,
      timeout: 10_000,
    })
  })

const toFahrenheit = (celsius) => Math.round((celsius * 9) / 5 + 32)

function App() {
  const [weather, setWeather] = useState(null)
  const [status, setStatus] = useState('loading')

  const loadWeather = async () => {
    if (!navigator.geolocation) {
      setStatus('unsupported')
      return
    }

    setStatus('loading')

    try {
      const position = await getCurrentPosition()
      const { latitude, longitude } = position.coords
      const pointsResponse = await fetch(`https://api.weather.gov/points/${latitude},${longitude}`)

      if (!pointsResponse.ok) throw new Error('Could not find a nearby weather station.')

      const points = await pointsResponse.json()
      const stationsResponse = await fetch(points.properties.observationStations)

      if (!stationsResponse.ok) throw new Error('Could not find a nearby weather station.')

      const stations = await stationsResponse.json()
      const station = stations.features[0]?.properties.stationIdentifier

      if (!station) throw new Error('No nearby weather station is available.')

      const observationResponse = await fetch(
        `https://api.weather.gov/stations/${station}/observations/latest`,
      )

      if (!observationResponse.ok) throw new Error('Could not load current conditions.')

      const observation = await observationResponse.json()
      const { temperature, relativeHumidity, timestamp } = observation.properties

      if (temperature.value === null || relativeHumidity.value === null) {
        throw new Error('The nearby station did not report complete conditions.')
      }

      const location = points.properties.relativeLocation?.properties
      setWeather({
        humidity: Math.round(relativeHumidity.value),
        location: location ? `${location.city}, ${location.state}` : station,
        station,
        temperature: toFahrenheit(temperature.value),
        updatedAt: new Date(timestamp).toLocaleTimeString([], {
          hour: 'numeric',
          minute: '2-digit',
        }),
      })
      setStatus('ready')
    } catch (error) {
      setStatus(error.code === error.PERMISSION_DENIED ? 'denied' : 'error')
    }
  }

  useEffect(() => {
    loadWeather()
  }, [])

  return (
    <main>
      <section aria-labelledby="page-title">
        <p className="eyebrow">A tiny React app</p>
        <h1 id="page-title">Hello, world!</h1>
        <p className="message">Your new web app is up and running.</p>

        <div className="weather" aria-live="polite">
          {status === 'ready' && (
            <>
              <p className="weather-location">Outside near {weather.location}</p>
              <div className="weather-values">
                <p><strong>{weather.temperature}°F</strong><span>Temperature</span></p>
                <p><strong>{weather.humidity}%</strong><span>Humidity</span></p>
              </div>
              <p className="weather-note">Nearest station: {weather.station} · Updated {weather.updatedAt}</p>
            </>
          )}
          {status === 'loading' && <p className="weather-note">Finding nearby conditions...</p>}
          {status === 'denied' && (
            <div className="weather-error">
              <p className="weather-note">Location permission is needed for nearby conditions.</p>
              <button type="button" onClick={loadWeather}>Try again</button>
            </div>
          )}
          {status === 'unsupported' && <p className="weather-note">This browser does not support location services.</p>}
          {status === 'error' && (
            <div className="weather-error">
              <p className="weather-note">Current conditions are unavailable right now.</p>
              <button type="button" onClick={loadWeather}>Retry</button>
            </div>
          )}
        </div>
      </section>
    </main>
  )
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
