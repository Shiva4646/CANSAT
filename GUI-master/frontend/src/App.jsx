import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import './App.css'
import MissionTimer from './components/MissionTimer'
import Sidebar from './components/Sidebar'
import { TelemetryProvider } from './context/TelemetryContext'
import Communication from './pages/Communication'
import Dashboard from './pages/Dashboard'
import GPS from './pages/GPS'
import Gyro from './pages/Gyro'
import Sensors from './pages/Sensors'

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

  return (
    <TelemetryProvider>
      <BrowserRouter>
        <div
          className={`app-shell${isSidebarOpen ? '' : ' sidebar-closed'}`}
          style={{
            gridTemplateColumns: isSidebarOpen ? '72px 1fr' : '0px 1fr',
          }}
        >
          <Sidebar isOpen={isSidebarOpen} />
          <button
            aria-controls="sidebar"
            aria-expanded={isSidebarOpen}
            aria-label={isSidebarOpen ? 'Close sidebar' : 'Open sidebar'}
            className="sidebar-toggle"
            onClick={() => setIsSidebarOpen((isOpen) => !isOpen)}
            style={{ left: isSidebarOpen ? '72px' : '0px' }}
            type="button"
          >
            {isSidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
          </button>
          <main className="content-wrap">
            <header className="top-strip">
              <div className="row">
                <h1>CanSat Ground Station</h1>
                <MissionTimer />
              </div>
            </header>
            <div className="dashboard-border">
              <Routes>
                <Route element={<Dashboard />} path="/" />
                <Route element={<Sensors />} path="/sensors" />
                <Route element={<GPS />} path="/gps" />
                <Route element={<Gyro />} path="/gyro" />
                <Route
                  element={<Communication />}
                  path="/communication"
                />
              </Routes>
            </div>
          </main>
        </div>
      </BrowserRouter>
    </TelemetryProvider>
  )
}

export default App
