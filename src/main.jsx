import { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'

const heatGuidelines = {
  2: [[89.8, 'black', 'Black flag', 'No outdoor practice. Delay, cancel, or move indoors.'], [87.7, 'red', 'Red flag', 'Maximum one hour of outdoor practice.'], [84.7, 'orange', 'Orange flag', 'Maximum two hours of outdoor practice.'], [79.7, 'yellow', 'Yellow flag', 'Modified practice and a rapid cooling zone are required.'], [-Infinity, 'green', 'Green flag', 'Normal practice may proceed with regular hydration breaks.']],
  3: [[92.1, 'black', 'Black flag', 'No outdoor practice. Delay, cancel, or move indoors.'], [90.1, 'red', 'Red flag', 'Maximum one hour of outdoor practice.'], [87, 'orange', 'Orange flag', 'Maximum two hours of outdoor practice.'], [82, 'yellow', 'Yellow flag', 'Modified practice and a rapid cooling zone are required.'], [-Infinity, 'green', 'Green flag', 'Normal practice may proceed with regular hydration breaks.']],
}

const getPosition = () => new Promise((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: false, maximumAge: 900000, timeout: 10000 }))
const fahrenheit = (celsius) => Math.round((celsius * 9) / 5 + 32)

function App() {
  const [conditions, setConditions] = useState(null)
  const [weatherStatus, setWeatherStatus] = useState('loading')
  const [heatClass, setHeatClass] = useState('3')
  const [wbgtInput, setWbgtInput] = useState('')

  const loadConditions = async () => {
    if (!navigator.geolocation) return setWeatherStatus('unsupported')
    setWeatherStatus('loading')
    try {
      const { coords } = await getPosition()
      const pointsResponse = await fetch(`https://api.weather.gov/points/${coords.latitude},${coords.longitude}`)
      if (!pointsResponse.ok) throw new Error()
      const points = await pointsResponse.json()
      const stationsResponse = await fetch(points.properties.observationStations)
      if (!stationsResponse.ok) throw new Error()
      const stations = await stationsResponse.json()
      const station = stations.features[0]?.properties.stationIdentifier
      if (!station) throw new Error()
      const observationResponse = await fetch(`https://api.weather.gov/stations/${station}/observations/latest`)
      if (!observationResponse.ok) throw new Error()
      const { properties } = await observationResponse.json()
      if (properties.temperature.value === null || properties.relativeHumidity.value === null) throw new Error()
      const location = points.properties.relativeLocation?.properties
      setConditions({
        humidity: Math.round(properties.relativeHumidity.value),
        location: location ? `${location.city}, ${location.state}` : station,
        station,
        temperature: fahrenheit(properties.temperature.value),
        updatedAt: new Date(properties.timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
      })
      setWeatherStatus('ready')
    } catch (error) {
      setWeatherStatus(error.code === error.PERMISSION_DENIED ? 'denied' : 'error')
    }
  }

  useEffect(() => { loadConditions() }, [])

  const wbgt = Number.parseFloat(wbgtInput)
  const guideline = Number.isFinite(wbgt) ? heatGuidelines[heatClass].find(([minimum]) => wbgt >= minimum) : null

  return <main><section aria-labelledby="page-title">
    <p className="eyebrow">Texas marching band</p>
    <h1 id="page-title">Practice heat check</h1>
    <p className="message">Make the outdoor call with the right measurement.</p>

    <div className="heat-check">
      <div className="heat-check-header">
        <p className="section-label">UIL practice status</p>
        <label className="class-picker"><span>UIL class</span><select value={heatClass} onChange={(event) => setHeatClass(event.target.value)}><option value="3">Class 3</option><option value="2">Class 2</option></select></label>
      </div>
      <label className="wbgt-entry"><span>Official WBGT reading</span><div><input type="number" inputMode="decimal" min="0" max="120" step="0.1" value={wbgtInput} onChange={(event) => setWbgtInput(event.target.value)} placeholder="00.0" /><span>°F</span></div></label>
      {guideline ? <div className={`flag-status ${guideline[1]}`} aria-live="polite"><p>{guideline[2]}</p><strong>{guideline[3]}</strong></div> : <p className="entry-prompt">Enter the reading from the school-approved WBGT source.</p>}
      <p className="policy-note">Check within 15 minutes of practice and every 30 minutes during it. Follow the school’s written heat plan. <a href="https://wwwprod.uiltexas.org/health/info/heat-stress-and-athletic-participation">UIL guidance</a></p>
    </div>

    <div className="conditions" aria-live="polite">
      <p className="section-label">Nearby conditions</p>
      {weatherStatus === 'ready' && <><p className="conditions-location">Near {conditions.location}</p><div className="condition-values"><p><strong>{conditions.temperature}°F</strong><span>Temperature</span></p><p><strong>{conditions.humidity}%</strong><span>Humidity</span></p></div><p className="conditions-note">Station {conditions.station} · Updated {conditions.updatedAt}</p></>}
      {weatherStatus === 'loading' && <p className="conditions-note">Finding nearby conditions...</p>}
      {weatherStatus === 'denied' && <div className="conditions-error"><p className="conditions-note">Location permission is needed for nearby conditions.</p><button type="button" onClick={loadConditions}>Try again</button></div>}
      {weatherStatus === 'unsupported' && <p className="conditions-note">This browser does not support location services.</p>}
      {weatherStatus === 'error' && <div className="conditions-error"><p className="conditions-note">Current conditions are unavailable right now.</p><button type="button" onClick={loadConditions}>Retry</button></div>}
    </div>
  </section></main>
}

createRoot(document.getElementById('root')).render(<StrictMode><App /></StrictMode>)
