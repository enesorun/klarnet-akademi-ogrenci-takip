import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { ArrowLeft, Edit, MapPin, Award, Mail, Briefcase, Calendar, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import LessonsTab from "@/components/student-detail/LessonsTab";
import PaymentsTab from "@/components/student-detail/PaymentsTab";
import TimelineTab from "@/components/student-detail/TimelineTab";
import EditProfileModal from "@/components/EditProfileModal";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const StudentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [tariffs, setTariffs] = useState([]);
  const [currentTariff, setCurrentTariff] = useState(null);
  const [calculations, setCalculations] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const [studentRes, tariffsRes, calcRes] = await Promise.all([
        axios.get(`${API}/students/${id}`),
        axios.get(`${API}/tariffs/${id}`),
        axios.get(`${API}/calculate/${id}`),
      ]);
      setStudent(studentRes.data);
      setTariffs(tariffsRes.data);
      setCurrentTariff(calcRes.data.tariff);
      setCalculations(calcRes.data);
    } catch (error) {
      toast.error("Öğrenci bilgileri yüklenemedi");
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      await axios.put(`${API}/students/${id}`, {
        genel_durum: newStatus,
      });
      toast.success("Durum güncellendi");
      fetchData();
    } catch (error) {
      toast.error("Durum güncellenirken hata oluştu");
    }
  };

  const calculateDuration = (startDate) => {
    const start = new Date(startDate);
    const now = new Date();
    const months = Math.floor((now - start) / (1000 * 60 * 60 * 24 * 30));
    return `${months} ay`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg text-gray-600">Yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="hover:bg-gray-100"
            data-testid="back-button"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900" data-testid="student-detail-name">{student.ad_soyad}</h1>
            <p className="text-gray-600 mt-1">Öğrenci Detayları</p>
          </div>
        </div>
        <Button
          onClick={() => setIsEditModalOpen(true)}
          className="bg-[#4d5deb] hover:bg-[#3a4ad4]"
          data-testid="edit-profile-button"
        >
          <Edit className="w-4 h-4 mr-2" />
          Düzenle
        </Button>
      </div>

      {/* Profile & Tariff Accordion */}
      <Accordion type="single" collapsible defaultValue="profile" className="space-y-4">
        <AccordionItem
          value="profile"
          className="bg-white rounded-xl border border-gray-200 px-6 overflow-hidden"
          data-testid="profile-accordion"
        >
          <AccordionTrigger className="hover:no-underline py-6">
            <h2 className="text-xl font-bold text-gray-900">Profil & Tarife Bilgileri</h2>
          </AccordionTrigger>
          <AccordionContent className="pb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              {/* Profil Bilgileri */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900 mb-4">Profil Bilgileri</h3>
                
                <div className="flex items-start space-x-3">
                  <User className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Ad Soyad</p>
                    <p className="font-medium text-gray-900">{student.ad_soyad}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Konum</p>
                    <p className="font-medium text-gray-900">{student.konum}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Award className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Seviye</p>
                    <p className="font-medium text-gray-900">{student.seviye}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">E-mail</p>
                    <p className="font-medium text-gray-900">{student.email}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <User className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Yaş</p>
                    <p className="font-medium text-gray-900">{student.yas}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Briefcase className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Meslek</p>
                    <p className="font-medium text-gray-900">{student.meslek}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">İlk Ders Tarihi</p>
                    <p className="font-medium text-gray-900">
                      {new Date(student.ilk_ders_tarihi).toLocaleDateString('tr-TR')}
                    </p>
                    <p className="text-sm text-gray-500">Toplam Süresi: {calculateDuration(student.ilk_ders_tarihi)}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <User className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Referans</p>
                    <p className="font-medium text-gray-900">{student.referans}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <User className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 mb-2">Genel Durum</p>
                    <Select
                      value={student.genel_durum}
                      onValueChange={handleStatusChange}
                    >
                      <SelectTrigger className="w-full" data-testid="status-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="aktif">Aktif</SelectItem>
                        <SelectItem value="ara_verdi">Ara Verdi</SelectItem>
                        <SelectItem value="eski">Eski Öğrenci</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {student.notlar && (
                  <div className="flex items-start space-x-3">
                    <User className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">Genel Notlar</p>
                      <p className="font-medium text-gray-900">{student.notlar}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Güncel Tarife */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900 mb-4">Güncel Tarife</h3>
                {currentTariff ? (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                    <div>
                      <p className="text-sm text-gray-600">Aylık Ders Sayısı</p>
                      <p className="text-2xl font-bold text-gray-900">{currentTariff.aylik_ders_sayisi} ders</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Üret</p>
                      <p className="text-2xl font-bold text-[#4d5deb]">
                        {new Intl.NumberFormat('tr-TR').format(currentTariff.ucret)}₺
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Başlangıç Tarihi</p>
                      <p className="font-medium text-gray-900">
                        {new Date(currentTariff.baslangic_tarihi).toLocaleDateString('tr-TR')}
                      </p>
                    </div>
                    {currentTariff.not_ && (
                      <div>
                        <p className="text-sm text-gray-600">Not</p>
                        <p className="font-medium text-gray-900">{currentTariff.not_}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-500">Tarife bulunamadı</p>
                )}

                {/* Durum Bilgileri */}
                {calculations && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-2">
                    <h4 className="font-semibold text-gray-900 mb-3">Durum Bilgileri</h4>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Yapılan Ders</span>
                      <span className="font-medium text-gray-900">{calculations.yapilan_ders}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Kalan Ders</span>
                      <span className="font-medium text-gray-900">{calculations.kalan_ders}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Toplam Ödenen</span>
                      <span className="font-medium text-gray-900">
                        {new Intl.NumberFormat('tr-TR').format(calculations.toplam_odenen)}₺
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Tarife Geçmişi */}
        <AccordionItem
          value="tariff-history"
          className="bg-white rounded-xl border border-gray-200 px-6 overflow-hidden"
          data-testid="tariff-history-accordion"
        >
          <AccordionTrigger className="hover:no-underline py-6">
            <h2 className="text-xl font-bold text-gray-900">Tarife Geçmişi</h2>
          </AccordionTrigger>
          <AccordionContent className="pb-6">
            <div className="overflow-x-auto mt-4">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Başlangıç</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Bitiş</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Üret</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Aylık Ders</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Not</th>
                  </tr>
                </thead>
                <tbody>
                  {tariffs.map((tariff) => (
                    <tr key={tariff.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm text-gray-900">
                        {new Date(tariff.baslangic_tarihi).toLocaleDateString('tr-TR')}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-900">
                        {tariff.bitis_tarihi ? new Date(tariff.bitis_tarihi).toLocaleDateString('tr-TR') : 'Aktif'}
                      </td>
                      <td className="py-3 px-4 text-sm font-medium text-gray-900">
                        {new Intl.NumberFormat('tr-TR').format(tariff.ucret)}₺
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-900">{tariff.aylik_ders_sayisi}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">{tariff.not_ || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Tabs */}
      <Tabs defaultValue="lessons" className="space-y-6">
        <TabsList className="bg-white border border-gray-200 p-1">
          <TabsTrigger value="lessons" className="data-[state=active]:bg-[#4d5deb] data-[state=active]:text-white" data-testid="tab-lessons">
            Dersler
          </TabsTrigger>
          <TabsTrigger value="payments" className="data-[state=active]:bg-[#4d5deb] data-[state=active]:text-white" data-testid="tab-payments">
            Ödemeler
          </TabsTrigger>
          <TabsTrigger value="timeline" className="data-[state=active]:bg-[#4d5deb] data-[state=active]:text-white" data-testid="tab-timeline">
            Zaman Çizelgesi
          </TabsTrigger>
        </TabsList>

        <TabsContent value="lessons">
          <LessonsTab studentId={id} onUpdate={fetchData} />
        </TabsContent>

        <TabsContent value="payments">
          <PaymentsTab studentId={id} onUpdate={fetchData} />
        </TabsContent>

        <TabsContent value="timeline">
          <TimelineTab student={student} tariffs={tariffs} />
        </TabsContent>
      </Tabs>

      {/* Edit Modal */}
      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        student={student}
        currentTariff={currentTariff}
        onSuccess={fetchData}
      />
    </div>
  );
};

export default StudentDetail;