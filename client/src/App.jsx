/** App shell (banner, navigation, footer) and the route table. Add new pages here. */
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import DemoBanner from './components/DemoBanner.jsx';
import ScrollToTop from './components/ScrollToTop.jsx';
import Home from './pages/Home.jsx';
import Speakers from './pages/Speakers.jsx';
import SpeakerDetail from './pages/SpeakerDetail.jsx';
import Schedule from './pages/Schedule.jsx';
import SessionDetail from './pages/SessionDetail.jsx';
import MySchedule from './pages/MySchedule.jsx';
import Admin from './pages/Admin.jsx';
import NotFound from './pages/NotFound.jsx';

export default function App() {
  return (
    <div className="flex min-h-screen flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-white focus:px-3 focus:py-2">Skip to content</a>
      <DemoBanner />
      <Navbar />
      <ScrollToTop />
      <main id="main" className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/speakers" element={<Speakers />} />
          <Route path="/speakers/:id" element={<SpeakerDetail />} />
          <Route path="/schedule" element={<Schedule />} />
          <Route path="/sessions/:id" element={<SessionDetail />} />
          <Route path="/my-schedule" element={<MySchedule />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
