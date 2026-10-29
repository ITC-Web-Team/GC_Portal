import React, { useEffect, useState } from "react";
import "./App.css";
import { BrowserRouter as Router, Route, Routes, Navigate, Outlet } from "react-router-dom";
import SideBar from "./Components/sideBar";
import Header from "./Components/header";
import Footer from "./Components/footer";
import Loader from "./pages/Loader";

import Gc from "./pages/Gc";
import Dashboard from "./Components/Dashboard";
import Instuctions from "./pages/instuctions";
import Portal from "./pages/Portal";

// Old pages (header + sidebar + footer) that still exist
function Layout() {
  return (
    <>
      <Header />
      <SideBar>
        <Outlet />
      </SideBar>
      <Footer />
    </>
  );
}

function App() {
  const [loadingComplete, setLoadingComplete] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setLoadingComplete(true), 3000);
    return () => clearTimeout(t);
  }, []);

  return (
    <Router>
      <div>
        {loadingComplete ? (
          <Routes>
            {/* New design: has its own navbar + footer, so no Layout */}
            <Route path="/" element={<Portal />} />

            {/* Old pages are now inside Portal, so send old links to it */}
            <Route path="/Overall" element={<Navigate to="/" replace />} />
            <Route path="/Genre1" element={<Navigate to="/" replace />} />
            <Route path="/Genre2" element={<Navigate to="/" replace />} />
            <Route path="/Genre3" element={<Navigate to="/" replace />} />
            <Route path="/Genre4" element={<Navigate to="/" replace />} />
            <Route path="/hostels" element={<Navigate to="/" replace />} />
            <Route path="/GC/Genre1" element={<Navigate to="/" replace />} />
            <Route path="/GC/Genre2" element={<Navigate to="/" replace />} />
            <Route path="/GC/Genre3" element={<Navigate to="/" replace />} />
            <Route path="/GC/Genre4" element={<Navigate to="/" replace />} />

            {/* Pages that keep the old header + sidebar + footer */}
            <Route element={<Layout />}>
              <Route path="/GC/Genre1/:name" element={<Gc />} />
              <Route path="/GC/Genre2/:name" element={<Gc />} />
              <Route path="/GC/Genre3/:name" element={<Gc />} />
              <Route path="/GC/Genre4/:name" element={<Gc />} />
              <Route path="/instuctions" element={<Instuctions />} />
              <Route path="/Dashboard/:name" element={<Dashboard />} />
            </Route>
          </Routes>
        ) : (
          <Loader />
        )}
      </div>
    </Router>
  );
}

export default App;