import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './screens/login/Login'
import Home from './screens/home/Home'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/home" element={<Home />} />
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
