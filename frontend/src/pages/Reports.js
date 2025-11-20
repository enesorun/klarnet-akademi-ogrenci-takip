import { useState, useEffect } from "react";
import axios from "axios";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { TrendingUp, Users, DollarSign, Award, ArrowUp, ArrowDown, Calendar, Edit2 } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const COLORS = ['#4d5deb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const Reports = () => {
  const [referansData, setReferansData] = useState([]);
  const [genelStats, setGenelStats] = useState(null);
  const [aylikGelirData, setAylikGelirData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [grupStats, setGrupStats] = useState(null);
  
  // Manuel düzenleme için
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingStatName, setEditingStatName] = useState("");
  const [editingStatLabel, setEditingStatLabel] = useState("");
  const [editingStatValue, setEditingStatValue] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [referansRes, genelRes, aylikGelirRes, grupRes] = await Promise.all([
        axios.get(`${API}/reports/referans`),
        axios.get(`${API}/reports/genel`),
        axios.get(`${API}/reports/aylik-gelir`),
        axios.get(`${API}/reports/grup-istatistik`),
      ]);
      setReferansData(referansRes.data);
      setGenelStats(genelRes.data);
      
      // Aylık gelir verisini tersine çevir (en yeni en üstte)
      const sortedAylikGelir = aylikGelirRes.data.reverse();
      setAylikGelirData(sortedAylikGelir);
      
      setGrupStats(grupRes.data);
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
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4" data-testid="general-stats-title">Tüm Zamanların Genel İstatistikleri</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700" data-testid="total-students-stat">
              <div className="flex items-center justify-between mb-3">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <Users className="w-6 h-6 text-[#4d5deb] dark:text-blue-400" />
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">{genelStats.toplam_ogrenci}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Toplam Öğrenci</div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700" data-testid="total-lessons-stat">
              <div className="flex items-center justify-between mb-3">
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <Award className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">{genelStats.toplam_yapilan_ders}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Toplam Yapılan Ders</div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700" data-testid="total-revenue-stat">
              <div className="flex items-center justify-between mb-3">
                <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <DollarSign className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(genelStats.toplam_kazanilan_para)}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Toplam Kazanılan Para</div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700" data-testid="avg-lesson-price-stat">
              <div className="flex items-center justify-between mb-3">
                <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                </div>
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(genelStats.ortalama_ders_ucreti)}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Ortalama Ders Ücreti</div>
            </div>
          </div>
        </div>
      )}

      {/* Grup Dersleri İstatistikleri */}
      {grupStats && (
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="grup-stats" className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 rounded-xl shadow-sm border border-blue-100 dark:border-gray-600">
            <AccordionTrigger className="px-6 py-4 hover:no-underline">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Grup Dersleri İstatistikleri</h2>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white">{grupStats.toplam_grup_ogrencisi}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Toplam Grup Öğrencisi</div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <Award className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white">{grupStats.toplam_yapilan_grup_dersi}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Toplam Yapılan Grup Dersi</div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <DollarSign className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(grupStats.toplam_grup_geliri)}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Toplam Grup Dersi Geliri</div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(grupStats.ortalama_ders_ucreti)}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Ortalama Ders Saati Ücreti</div>
              </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}

      {/* Aylık Gelir Raporu */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4" data-testid="monthly-income-title">Aylık Gelir Raporu</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">15'ten 15'e dönemler halinde aylık gelir takibi</p>
        
        {/* Bar Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 mb-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Aylık Gelir Trendi</h3>
          {aylikGelirData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={aylikGelirData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="ay" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value) => [formatCurrency(value), 'Gelir']}
                  contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', border: '1px solid #ccc' }}
                />
                <Bar dataKey="toplam_gelir" fill="#4d5deb" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-gray-500 py-8">Henüz ödeme kaydı bulunmuyor</p>
          )}
        </div>

        {/* Detaylı Tablo */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Detaylı Aylık Gelir Verileri</h3>
          {aylikGelirData.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Ay</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Dönem</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Birebir</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Grup</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Toplam Gelir</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Önceki Aya Fark</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Değişim</th>
                  </tr>
                </thead>
                <tbody>
                  {aylikGelirData.map((item, index) => (
                    <tr key={index} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="py-3 px-4 text-sm font-medium text-gray-900 dark:text-white">{item.ay}</td>
                      <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">{item.donem}</td>
                      <td className="py-3 px-4 text-sm text-blue-600 dark:text-blue-400 text-right">
                        {formatCurrency(item.birebir_gelir || 0)}
                      </td>
                      <td className="py-3 px-4 text-sm text-green-600 dark:text-green-400 text-right">
                        {formatCurrency(item.grup_gelir || 0)}
                      </td>
                      <td className="py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white text-right">
                        {formatCurrency(item.toplam_gelir)}
                      </td>
                      <td className={`py-3 px-4 text-sm font-medium text-right ${
                        item.onceki_ay_fark > 0 ? 'text-green-600 dark:text-green-400' : 
                        item.onceki_ay_fark < 0 ? 'text-red-600 dark:text-red-400' : 
                        'text-gray-600 dark:text-gray-400'
                      }`}>
                        {item.onceki_ay_fark !== 0 && (
                          <span className="flex items-center justify-end">
                            {item.onceki_ay_fark > 0 ? (
                              <ArrowUp className="w-4 h-4 mr-1" />
                            ) : (
                              <ArrowDown className="w-4 h-4 mr-1" />
                            )}
                            {formatCurrency(Math.abs(item.onceki_ay_fark))}
                          </span>
                        )}
                        {item.onceki_ay_fark === 0 && '-'}
                      </td>
                      <td className={`py-3 px-4 text-sm font-semibold text-right ${
                        item.degisim_yuzde > 0 ? 'text-green-600 dark:text-green-400' : 
                        item.degisim_yuzde < 0 ? 'text-red-600 dark:text-red-400' : 
                        'text-gray-600 dark:text-gray-400'
                      }`}>
                        {item.degisim_yuzde !== 0 && (
                          <span className="inline-flex items-center">
                            {item.degisim_yuzde > 0 ? '+' : ''}{item.degisim_yuzde.toFixed(1)}%
                          </span>
                        )}
                        {item.degisim_yuzde === 0 && '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center text-gray-500 py-8">Henüz ödeme kaydı bulunmuyor</p>
          )}
        </div>
      </div>

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