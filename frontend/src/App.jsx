import { BrowserRouter, Routes, Route } from 'react-router-dom'
import HomePage    from './pages/HomePage'
import BoardPage   from './pages/BoardPage'
import NotFoundPage from './pages/NotFoundPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"           element={<HomePage />} />
        <Route path="/board/:code" element={<BoardPage />} />
        <Route path="*"           element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}