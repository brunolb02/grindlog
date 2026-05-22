import { useState } from 'react'
import TabBar from './components/TabBar'
import Dashboard from './pages/Dashboard'
import Workout from './pages/Workout'
import Nutrition from './pages/Nutrition'
import Library from './pages/Library'
import './App.css'

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard')

  return (
    <div className="app">
      <div className="page-container">
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'workout' && <Workout />}
        {activeTab === 'nutrition' && <Nutrition />}
        {activeTab === 'library' && <Library />}
      </div>
      <TabBar active={activeTab} onSelect={setActiveTab} />
    </div>
  )
}
