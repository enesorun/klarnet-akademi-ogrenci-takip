import { useState, useEffect } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import AllStudents from "./pages/AllStudents";
import StudentDetail from "./pages/StudentDetail";
import Reports from "./pages/Reports";
import Layout from "./components/Layout";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const auth = localStorage.getItem("authenticated");
    if (auth === "true") {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("authenticated");
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login onLogin={handleLogin} />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
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
            <Route path="reports" element={<Reports />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;