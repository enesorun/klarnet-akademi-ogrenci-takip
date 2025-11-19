import { useState, useEffect } from "react";
import axios from "axios";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { TrendingUp, Users, DollarSign, Award } from "lucide-react";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const COLORS = ['#4d5deb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const Reports = () => {
  const [referansData, setReferansData] = useState([]);
  const [genelStats, setGenelStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [referansRes, genelRes] = await Promise.all([
        axios.get(`${API}/reports/referans`),
        axios.get(`${API}/reports/genel`),
      ]);
      setReferansData(referansRes.data);
      setGenelStats(genelRes.data);
    } catch (error) {
      toast.error("Raporlar yüklenirken hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount) + '₺';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg text-gray-600">Yükleniyor...</div>
      </div>
    );
  }

  // Prepare chart data
  const pieChartData = referansData.map((item) => ({
    name: item.referans,
    value: item.ogrenci_sayisi,
  }));

  const barChartData = referansData.map((item) => ({
    name: item.referans,
    gelir: item.toplam_gelir,
    ogrenci: item.ogrenci_sayisi,
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900" data-testid="reports-title">Raporlar</h1>
        <p className="text-gray-600 mt-1">Detaylı analizler ve istatistikler</p>
      </div>

      {/* Genel İstatistikler */}
      {genelStats && (
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4" data-testid="general-stats-title">Tüm Zamanların Genel İstatistikleri</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100" data-testid="total-students-stat">
              <div className="flex items-center justify-between mb-3">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <Users className="w-6 h-6 text-[#4d5deb]" />
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-900">{genelStats.toplam_ogrenci}</div>
              <div className="text-sm text-gray-600 mt-1">Toplam Öğrenci</div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100" data-testid="total-lessons-stat">
              <div className="flex items-center justify-between mb-3">
                <div className="p-3 bg-green-50 rounded-lg">
                  <Award className="w-6 h-6 text-green-600" />
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-900">{genelStats.toplam_yapilan_ders}</div>
              <div className="text-sm text-gray-600 mt-1">Toplam Yapılan Ders</div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100" data-testid="total-revenue-stat">
              <div className="flex items-center justify-between mb-3">
                <div className="p-3 bg-purple-50 rounded-lg">
                  <DollarSign className="w-6 h-6 text-purple-600" />
                </div>
              </div>
              <div className="text-2xl font-bold text-gray-900">{formatCurrency(genelStats.toplam_kazanilan_para)}</div>
              <div className="text-sm text-gray-600 mt-1">Toplam Kazanılan Para</div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100" data-testid="avg-lesson-price-stat">
              <div className="flex items-center justify-between mb-3">
                <div className="p-3 bg-yellow-50 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
              <div className="text-2xl font-bold text-gray-900">{formatCurrency(genelStats.ortalama_ders_ucreti)}</div>
              <div className="text-sm text-gray-600 mt-1">Ortalama Ders Ücreti</div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100" data-testid="avg-lessons-per-student-stat">
              <div className="flex items-center justify-between mb-3">
                <div className="p-3 bg-pink-50 rounded-lg">
                  <Users className="w-6 h-6 text-pink-600" />
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-900">{genelStats.ogrenci_basina_ortalama_ders}</div>
              <div className="text-sm text-gray-600 mt-1">Öğrenci Başına Ort. Ders</div>
            </div>
          </div>
        </div>
      )}

      {/* Referans Raporu */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4" data-testid="reference-report-title">Referans Raporu</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pie Chart */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-900 mb-4">Öğrenci Dağılımı</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Bar Chart */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-900 mb-4">Referans Kaynaklarına Göre Gelir</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value, name) => {
                    if (name === 'gelir') return [formatCurrency(value), 'Gelir'];
                    return [value, 'Öğrenci'];
                  }}
                />
                <Legend />
                <Bar dataKey="gelir" fill="#4d5deb" name="Gelir" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Referans Table */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mt-6">
          <h3 className="font-semibold text-gray-900 mb-4">Detaylı Referans Verileri</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Referans</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Öğrenci Sayısı</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Ort. Kalış Süresi</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Toplam Gelir</th>
                </tr>
              </thead>
              <tbody>
                {referansData.map((item, index) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm font-medium text-gray-900">{item.referans}</td>
                    <td className="py-3 px-4 text-sm text-gray-900">{item.ogrenci_sayisi}</td>
                    <td className="py-3 px-4 text-sm text-gray-900">{item.ortalama_kalis_suresi} ay</td>
                    <td className="py-3 px-4 text-sm font-medium text-gray-900">{formatCurrency(item.toplam_gelir)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;