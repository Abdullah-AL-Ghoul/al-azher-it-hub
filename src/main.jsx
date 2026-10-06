import React, { useState } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { LanguageProvider } from './context/LanguageContext'
import { AuthProvider } from './context/AuthContext'
import { UserDataProvider } from './context/UserDataContext'
import { ThemeProvider } from './context/ThemeContext'
import { ScrollProvider } from './hooks/useScrollManager.jsx'
import SplashScreen from './components/SplashScreen'
import App from './App'
import './index.css'

function Root() {
 const [splashDone, setSplashDone] = useState(false)

 return (
  <React.StrictMode>
   <BrowserRouter>
    <LanguageProvider>
     <ThemeProvider>
      <AuthProvider>
       <UserDataProvider>
        <ScrollProvider>
         <App />
         {!splashDone && <SplashScreen onComplete={() => setSplashDone(true)} />}
        </ScrollProvider>
       </UserDataProvider>
      </AuthProvider>
     </ThemeProvider>
    </LanguageProvider>
   </BrowserRouter>
  </React.StrictMode>
 )
}

ReactDOM.createRoot(document.getElementById('root')).render(<Root />)
