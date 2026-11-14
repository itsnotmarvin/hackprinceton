// SHARED FILE: route table. Tell the other frontend lane before changing.
import { Route, Routes } from 'react-router-dom'
import { Layout } from './shared/components/Layout'
// Frontend 1 (search, ranking, sliders)
import { SearchPage } from './features/search/SearchPage'
// Frontend 2 (detail, parcel, watchlist, report)
import { RegionPage } from './features/detail/RegionPage'
import { ParcelPage } from './features/detail/ParcelPage'
import { WatchlistPage } from './features/detail/WatchlistPage'
import { ReportPage } from './features/detail/ReportPage'

export function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<SearchPage />} />
        <Route path="/region/:id" element={<RegionPage />} />
        <Route path="/parcel/:id" element={<ParcelPage />} />
        <Route path="/watchlist" element={<WatchlistPage />} />
        <Route path="/report/:id" element={<ReportPage />} />
        <Route path="*" element={<p className="state">Page not found.</p>} />
      </Route>
    </Routes>
  )
}
