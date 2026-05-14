import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './ConfigApi/axiosConfig';
import App from './App.jsx'
import 'bootstrap/dist/css/bootstrap.min.css'; // Bootstrap CSS
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import { BrowserRouter } from 'react-router-dom'
import { UserProvider } from './Pages/UserPages/UserFollowingContext.jsx';

createRoot(document.getElementById('root')).render(
  
    <StrictMode>
      <UserProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
      </UserProvider>
    </StrictMode>

  
)
