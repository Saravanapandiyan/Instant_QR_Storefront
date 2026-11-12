import { Routes, Route } from 'react-router-dom';
import { LandingPage } from './features/landing/LandingPage.tsx';
import { StorefrontPage } from './features/menu/StorefrontPage.tsx';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/r/:branchSlug" element={<StorefrontPage />} />
    </Routes>
  );
}
