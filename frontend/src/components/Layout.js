import { Outlet, NavLink } from "react-router-dom";
import { LayoutDashboard, Users, BarChart3, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";

const Layout = ({ onLogout }) => {
  const navItems = [
    { to: "/", icon: LayoutDashboard, label: "Ana Sayfa" },
    { to: "/students", icon: Users, label: "Tüm Öğrenciler" },
    { to: "/reports", icon: BarChart3, label: "Raporlar" },
  ];

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <img
            src="https://customer-assets.emergentagent.com/job_4b0d0b3e-879e-455d-b243-259cedba9ea8/artifacts/f6s6gzdg_akademi-logo-siyah.png"
            alt="Logo"
            className="h-16 w-auto"
            data-testid="sidebar-logo"
          />
          <h2 className="text-sm font-semibold text-gray-700 mt-3">Klarnet Akademi</h2>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? "bg-[#4d5deb] text-white"
                    : "text-gray-700 hover:bg-gray-100"
                }`
              }
              data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <Button
            onClick={onLogout}
            variant="ghost"
            className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
            data-testid="logout-button"
          >
            <LogOut className="w-5 h-5 mr-3" />
            Çıkış Yap
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