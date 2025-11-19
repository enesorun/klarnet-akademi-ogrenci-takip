import "@/App.css";
import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import AllStudents from "./pages/AllStudents";
import StudentDetail from "./pages/StudentDetail";
import Reports from "./pages/Reports";
import GrupDersleri from "./pages/GrupDersleri";
import GrupDetay from "./pages/GrupDetay";
import Ayarlar from "./pages/Ayarlar";
import Login from "./pages/Login";
import Layout from "./components/Layout";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const authenticated = localStorage.getItem("authenticated");
    if (authenticated === "true") {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem("authenticated");
  };

  if (!isAuthenticated) {
    return (
      <div className="App">
        <BrowserRouter>
          <Routes>
            <Route path="*" element={<Login onLogin={handleLogin} />} />
          </Routes>
        </BrowserRouter>
      </div>
    );
  }

  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout onLogout={handleLogout} />}>
            <Route index element={<Dashboard />} />
            <Route path="students" element={<AllStudents />} />
            <Route path="students/:id" element={<StudentDetail />} />
            <Route path="grup-dersleri" element={<GrupDersleri />} />
            <Route path="grup-dersleri/:grupId" element={<GrupDetay />} />
            <Route path="reports" element={<Reports />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;