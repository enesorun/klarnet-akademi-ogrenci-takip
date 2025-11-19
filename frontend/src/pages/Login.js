import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import axios from "axios";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Login = ({ onLogin }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(`${API}/auth/login`, {
        username,
        password,
      });

      if (response.data.success) {
        if (rememberMe) {
          localStorage.setItem("authenticated", "true");
        }
        toast.success("Giriş başarılı!");
        onLogin();
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error("Bir hata oluştu. Lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f7f8fc] dark:bg-gray-900 px-4 transition-colors duration-300">
      <div className="w-full max-w-md animate-scale-in">
        <div className="text-center mb-8 animate-fade-in">
          <img
            src="https://customer-assets.emergentagent.com/job_4b0d0b3e-879e-455d-b243-259cedba9ea8/artifacts/f6s6gzdg_akademi-logo-siyah.png"
            alt="Logo"
            className="mx-auto mb-4 h-24 w-auto dark:hidden transition-all duration-300 hover:scale-110"
            data-testid="login-logo"
          />
          <img
            src="https://customer-assets.emergentagent.com/job_muzikogretmen/artifacts/e0hewzvg_akademi-logo.png"
            alt="Logo"
            className="mx-auto mb-4 h-24 w-auto hidden dark:block transition-all duration-300 hover:scale-110"
            data-testid="login-logo-dark"
          />
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white" data-testid="app-title">
            Klarnet Akademi Öğrenci Takibi
          </h1>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 border border-gray-100 dark:border-gray-700 animate-slide-in" data-testid="login-form-container">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="username" className="dark:text-gray-300">Kullanıcı Adı</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Kullanıcı adınızı girin"
                required
                data-testid="login-username-input"
                className="h-11 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 transition-all duration-200 focus:ring-2 focus:ring-[#4d5deb]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="dark:text-gray-300">Parola</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Parolanızı girin"
                required
                data-testid="login-password-input"
                className="h-11 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 transition-all duration-200 focus:ring-2 focus:ring-[#4d5deb]"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="remember"
                checked={rememberMe}
                onCheckedChange={setRememberMe}
                data-testid="login-remember-checkbox"
              />
              <Label
                htmlFor="remember"
                className="text-sm font-normal cursor-pointer dark:text-gray-300"
              >
                Beni Hatırla
              </Label>
            </div>

            <Button
              type="submit"
              className="w-full h-11 bg-[#4d5deb] hover:bg-[#3a4ad4] text-white font-semibold transform hover:scale-[1.02] transition-all duration-200 shadow-md hover:shadow-lg"
              disabled={loading}
              data-testid="login-submit-button"
            >
              {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;