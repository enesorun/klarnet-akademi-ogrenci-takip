import { useState, useEffect } from "react";
import axios from "axios";
import { Users, TrendingUp, Clock, AlertCircle } from "lucide-react";
import StudentCard from "@/components/StudentCard";
import { Button } from "@/components/ui/button";
import AddStudentModal from "@/components/AddStudentModal";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Dashboard = () => {
  const [students, setStudents] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [studentsRes, statsRes] = await Promise.all([
        axios.get(`${API}/students?status=aktif`),
        axios.get(`${API}/dashboard/stats`),
      ]);
      setStudents(studentsRes.data);
      setStats(statsRes.data);
    } catch (error) {
      toast.error("Veriler yüklenirken hata oluştu");
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

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center animate-slide-in">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white" data-testid="dashboard-title">Ana Sayfa</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Aktif öğrencilerinizi ve genel durumu görüntüleyin</p>
        </div>
        <Button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-[#4d5deb] hover:bg-[#3a4ad4] transform hover:scale-105 transition-all duration-200 shadow-md hover:shadow-lg"
          data-testid="add-student-button"
        >
          Yeni Öğrenci Ekle
        </Button>
      </div>

      {/* Stats Grid */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Stat 1 */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 card-hover stagger-item" data-testid="stat-active-students">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-50 rounded-lg">
                <Users className="w-6 h-6 text-[#4d5deb]" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900">{stats.aktif_ogrenci_sayisi}</div>
            <div className="text-sm text-gray-600 mt-1">Aktif Öğrenci</div>
          </div>

          {/* Stat 2 */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100" data-testid="stat-potential-income">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-50 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900">{formatCurrency(stats.potansiyel_aylik_gelir)}</div>
            <div className="text-sm text-gray-600 mt-1">Potansiyel Aylık Gelir</div>
          </div>

          {/* Stat 3 */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100" data-testid="stat-payment-approaching">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-yellow-50 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900">{stats.odeme_yaklasan.count}</div>
            <div className="text-sm text-gray-600 mt-1">Öğrenci</div>
            <div className="text-xs text-gray-500 mt-1">Yaklaşan Ödeme</div>
            <div className="text-sm font-semibold text-yellow-600 mt-2">≈ {formatCurrency(stats.odeme_yaklasan.tutar)}</div>
          </div>

          {/* Stat 4 */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100" data-testid="stat-payment-pending">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-red-50 rounded-lg">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900">{stats.odeme_bekleyen.count}</div>
            <div className="text-sm text-gray-600 mt-1">Öğrenci</div>
            <div className="text-xs text-gray-500 mt-1">Ödeme Bekliyor</div>
            <div className="text-sm font-semibold text-red-600 mt-2">≈ {formatCurrency(stats.odeme_bekleyen.tutar)}</div>
          </div>
        </div>
      )}

      {/* Students Grid */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4" data-testid="active-students-title">
          Aktif Öğrenciler ({students.length})
        </h2>
        
        {students.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-100">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">Henüz aktif öğrenci bulunmuyor</p>
            <p className="text-gray-400 text-sm mt-2">Yeni öğrenci eklemek için yukarıdaki butonu kullanın</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {students.map((student) => (
              <StudentCard key={student.id} student={student} onUpdate={fetchData} />
            ))}
          </div>
        )}
      </div>

      {/* Add Student Modal */}
      <AddStudentModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={fetchData}
      />
    </div>
  );
};

export default Dashboard;