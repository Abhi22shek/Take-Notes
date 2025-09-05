import './index.css'
import Register from './component/Register'
import Login from './component/Login'
import { AuthProvider } from './context/authContext'
import {  BrowserRouter as Router, Routes,Route , Navigate } from 'react-router-dom'
import ProtectedRoute from './component/ProtectedRoute'
import Dashboard from './component/Dashboard'
import { Toaster } from 'react-hot-toast'


const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/register" element={<Register />} />
          <Route path='/login' element = {<Login/>}/>
           <Route path='/dashboard' element = {<ProtectedRoute><Dashboard/></ProtectedRoute>}/>

            <Route path="/" element={<Navigate to="/register" replace />} />
        </Routes>
        <Toaster position="top-right" />
      </Router>
    </AuthProvider>
  )
}
export default App
  

 