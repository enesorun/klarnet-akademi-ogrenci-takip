import { useState, useEffect } from "react";
import { Outlet, NavLink } from "react-router-dom";
import { LayoutDashboard, Users, BarChart3, Moon, Sun, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";

const Layout = ({ onLogout }) => {
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved === 'true';
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', darkMode);
  }, [darkMode]);

  const navItems = [
    { to: "/", icon: LayoutDashboard, label: "Ana Sayfa" },
    { to: "/students", icon: Users, label: "Tüm Öğrenciler" },
    { to: "/reports", icon: BarChart3, label: "Raporlar" },
  ];

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col transition-all duration-300 shadow-sm">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <img
            src={darkMode 
              ? "https://customer-assets.emergentagent.com/job_muzikogretmen/artifacts/e0hewzvg_akademi-logo.png"
              : "https://customer-assets.emergentagent.com/job_4b0d0b3e-879e-455d-b243-259cedba9ea8/artifacts/f6s6gzdg_akademi-logo-siyah.png"
            }
            alt="Logo"
            className="h-16 w-auto transition-all duration-300 hover:scale-105"
            data-testid="sidebar-logo"
          />
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mt-3">Klarnet Akademi</h2>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 transform hover:scale-[1.02] ${
                  isActive
                    ? "bg-[#4d5deb] text-white shadow-md"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`
              }
              data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
            >
              <item.icon className="w-5 h-5 transition-transform duration-200 group-hover:rotate-12" />
              <span className="font-medium">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          {/* Dark Mode Toggle */}
          <Button
            onClick={() => setDarkMode(!darkMode)}
            variant="ghost"
            className="w-full justify-start text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
            data-testid="dark-mode-toggle"
          >
            {darkMode ? (
              <>
                <Sun className="w-5 h-5 mr-3 transition-transform duration-300 hover:rotate-180" />
                Açık Mod
              </>
            ) : (
              <>
                <Moon className="w-5 h-5 mr-3 transition-transform duration-300 hover:rotate-12" />
                Karanlık Mod
              </>
            )}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto p-8">
          <Outlet />
        </div>
      </main>

      <Toaster position="top-right" richColors />
    </div>
  );
};

export default Layout;