/**
 * React entry point. The providers wrap the whole app and are ordered by dependency:
 *   Router → Event (event info + tracks) → MySchedule (saved sessions) → Auth (admin session) → App
 */
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { EventProvider } from './hooks/useEvent.jsx';
import { MyScheduleProvider } from './hooks/useMySchedule.jsx';
import { AuthProvider } from './hooks/useAuth.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <EventProvider>
        <MyScheduleProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </MyScheduleProvider>
      </EventProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
