import { useState, useEffect } from "react";
import axios from "axios";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import StudentCard from "@/components/StudentCard";
import { useAyarlar } from "@/hooks/useAyarlar";
import { useOzelAlanlar } from "@/hooks/useOzelAlanlar";
import { Users, Grid, List, Filter, X, FileDown, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AllStudents = () => {
  // Dinamik ayarları yükle
  const { ayarlar: seviyeler } = useAyarlar("seviyeler");
  const { ayarlar: referansKaynaklari } = useAyarlar("referans_kaynaklari");
  const { ayarlar: etaplar } = useAyarlar("etaplar");
  const ozelAlanlar = useOzelAlanlar("ogrenci");

  const [aktifStudents, setAktifStudents] = useState([]);
  const [araVerdiStudents, setAraVerdiStudents] = useState([]);
  const [eskiStudents, setEskiStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("card"); // card or list
  const [showFilters, setShowFilters] = useState(false);
  
  // Düzenle/Sil modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [ozelAlanlarData, setOzelAlanlarData] = useState({});
  
  // Filtreler
  const [filters, setFilters] = useState({
    konum: "",
    seviye: "",
    referans: "",
    baslangicAyi: "",
    tarifeSiralama: "",
  });

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const [aktif, araVerdi, eski] = await Promise.all([
        axios.get(`${API}/students?status=aktif`),
        axios.get(`${API}/students?status=ara_verdi`),
        axios.get(`${API}/students?status=eski`),
      ]);
      setAktifStudents(aktif.data);
      setAraVerdiStudents(araVerdi.data);
      setEskiStudents(eski.data);
    } catch (error) {
      toast.error("Veriler yüklenirken hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = (students) => {
    let filtered = [...students];

    // Konum filtresi
    if (filters.konum) {
      filtered = filtered.filter(s => 
        s.konum.toLowerCase().includes(filters.konum.toLowerCase())
      );
    }

    // Seviye filtresi
    if (filters.seviye) {
      filtered = filtered.filter(s => s.seviye === filters.seviye);
    }

    // Referans filtresi
    if (filters.referans) {
      filtered = filtered.filter(s => s.referans === filters.referans);
    }

    // Başlangıç ayı filtresi
    if (filters.baslangicAyi) {
      filtered = filtered.filter(s => {
        const studentDate = new Date(s.ilk_ders_tarihi);
        const monthYear = `${studentDate.getFullYear()}-${String(studentDate.getMonth() + 1).padStart(2, '0')}`;
        return monthYear === filters.baslangicAyi;
      });
    }

    return filtered;
  };

  const sortByTariff = async (students) => {
    if (!filters.tarifeSiralama) return students;

    const studentsWithTariff = await Promise.all(
      students.map(async (student) => {
        try {
          const calcRes = await axios.get(`${API}/calculate/${student.id}`);
          return { ...student, tariff: calcRes.data.tariff };
        } catch {
          return { ...student, tariff: { ucret: 0 } };
        }
      })
    );

    return studentsWithTariff.sort((a, b) => {
      if (filters.tarifeSiralama === "artan") {
        return (a.tariff?.ucret || 0) - (b.tariff?.ucret || 0);
      } else {
        return (b.tariff?.ucret || 0) - (a.tariff?.ucret || 0);
      }
    });
  };

  const clearFilters = () => {
    setFilters({
      konum: "",
      seviye: "",
      referans: "",
      baslangicAyi: "",
      tarifeSiralama: "",
    });
  };

  const hasActiveFilters = Object.values(filters).some(v => v !== "");

  const handleExportCSV = async () => {
    try {
      toast.info("CSV dosyası indiriliyor...");
      
      const response = await axios.get(`${API}/export/students/csv`, {
        responseType: 'blob'
      });
      
      // Blob oluştur ve indir
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      const contentDisposition = response.headers['content-disposition'];
      const filename = contentDisposition 
        ? contentDisposition.split('filename=')[1].replace(/"/g, '')
        : `ogrenciler_${new Date().getTime()}.csv`;
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success("CSV dosyası indirildi!");
    } catch (error) {
      toast.error("CSV export sırasında hata oluştu");
    }
  };

  const handleOpenEditModal = (student, e) => {
    e?.stopPropagation(); // Prevent navigation
    setSelectedStudent(student);
    setEditForm({
      ad_soyad: student.ad_soyad,
      konum: student.konum,
      seviye: student.seviye,
      referans: student.referans,
      ilk_ders_tarihi: student.ilk_ders_tarihi,
      genel_durum: student.genel_durum,
    });
    setOzelAlanlarData(student.ozel_alanlar || {});
    setIsEditModalOpen(true);
  };

  const handleUpdateStudent = async () => {
    try {
      const updateData = {
        ...editForm,
        ozel_alanlar: ozelAlanlarData,
      };
      
      await axios.put(`${API}/students/${selectedStudent.id}`, updateData);
      toast.success("Öğrenci güncellendi!");
      setIsEditModalOpen(false);
      fetchStudents();
    } catch (error) {
      toast.error("Güncelleme sırasında hata oluştu");
    }
  };

  const handleOpenDeleteModal = (student, e) => {
    e?.stopPropagation(); // Prevent navigation
    setSelectedStudent(student);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteStudent = async () => {
    try {
      await axios.delete(`${API}/students/${selectedStudent.id}`);
      toast.success("Öğrenci silindi!");
      setIsDeleteModalOpen(false);
      fetchStudents();
    } catch (error) {
      toast.error("Silme sırasında hata oluştu");
    }
  };

  const renderStudentList = (students) => {
    if (viewMode === "card") {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
          {students.map((student) => (
            <StudentCard key={student.id} student={student} onUpdate={fetchStudents} />
          ))}
        </div>
      );
    }

    // Liste görünümü
    return (
      <div className="mt-4 overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">Ad Soyad</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">Konum</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">Seviye</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">Referans</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">İlk Ders</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">Durum</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase">İşlemler</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {students.map((student) => (
              <tr 
                key={student.id} 
                className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <td 
                  className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white cursor-pointer"
                  onClick={() => window.location.href = `/students/${student.id}`}
                >
                  {student.ad_soyad}
                </td>
                <td 
                  className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 cursor-pointer"
                  onClick={() => window.location.href = `/students/${student.id}`}
                >
                  {student.konum}
                </td>
                <td 
                  className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 cursor-pointer"
                  onClick={() => window.location.href = `/students/${student.id}`}
                >
                  {student.seviye}
                </td>
                <td 
                  className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 cursor-pointer"
                  onClick={() => window.location.href = `/students/${student.id}`}
                >
                  {student.referans}
                </td>
                <td 
                  className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 cursor-pointer"
                  onClick={() => window.location.href = `/students/${student.id}`}
                >
                  {new Date(student.ilk_ders_tarihi).toLocaleDateString('tr-TR')}
                </td>
                <td 
                  className="px-4 py-3 text-sm cursor-pointer"
                  onClick={() => window.location.href = `/students/${student.id}`}
                >
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    student.genel_durum === 'aktif' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                    student.genel_durum === 'ara_verdi' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                    'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
                  }`}>
                    {student.genel_durum === 'aktif' ? 'Aktif' : student.genel_durum === 'ara_verdi' ? 'Ara Verdi' : 'Eski'}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm">
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => handleOpenEditModal(student, e)}
                      className="hover:bg-blue-50 dark:hover:bg-blue-900/20"
                    >
                      <Edit className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => handleOpenDeleteModal(student, e)}
                      className="hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
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
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white" data-testid="all-students-title">Tüm Öğrenciler</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Öğrencileri kategorilere göre görüntüleyin</p>
        </div>

        {/* View Toggle & Filters */}
        <div className="flex items-center space-x-3">
          {/* View Mode Toggle */}
          <div className="flex bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-1">
            <button
              onClick={() => setViewMode("card")}
              className={`px-3 py-2 rounded-md transition-colors ${
                viewMode === "card" 
                  ? "bg-[#4d5deb] text-white" 
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
              data-testid="view-card-button"
            >
              <Grid className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`px-3 py-2 rounded-md transition-colors ${
                viewMode === "list" 
                  ? "bg-[#4d5deb] text-white" 
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
              data-testid="view-list-button"
            >
              <List className="w-5 h-5" />
            </button>
          </div>

          {/* Filter Toggle */}
          <Button
            onClick={() => setShowFilters(!showFilters)}
            variant="outline"
            className={`${
              showFilters ? "bg-[#4d5deb] text-white border-[#4d5deb]" : ""
            }`}
            data-testid="filter-toggle-button"
          >
            <Filter className="w-4 h-4 mr-2" />
            Filtreler
            {hasActiveFilters && (
              <span className="ml-2 bg-red-500 text-white rounded-full w-2 h-2"></span>
            )}
          </Button>

          {/* CSV Export */}
          <Button
            onClick={handleExportCSV}
            variant="outline"
            className="border-green-500 text-green-600 hover:bg-green-50 dark:border-green-600 dark:text-green-400 dark:hover:bg-green-900/20"
          >
            <FileDown className="w-4 h-4 mr-2" />
            CSV İndir
          </Button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 animate-fade-in">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Filtreler</h3>
            {hasActiveFilters && (
              <Button
                onClick={clearFilters}
                variant="ghost"
                size="sm"
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <X className="w-4 h-4 mr-1" />
                Temizle
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Konum */}
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Konum</label>
              <input
                type="text"
                placeholder="Şehir ara..."
                value={filters.konum}
                onChange={(e) => setFilters({ ...filters, konum: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#4d5deb] bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            {/* Seviye */}
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Seviye</label>
              <Select value={filters.seviye} onValueChange={(value) => setFilters({ ...filters, seviye: value })}>
                <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600">
                  <SelectValue placeholder="Tümü" />
                </SelectTrigger>
                <SelectContent className="dark:bg-gray-700">
                  <SelectItem value=" ">Tümü</SelectItem>
                  {seviyeler.map((seviye) => (
                    <SelectItem key={seviye.id} value={seviye.deger}>
                      {seviye.deger}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Referans */}
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Referans</label>
              <Select value={filters.referans} onValueChange={(value) => setFilters({ ...filters, referans: value })}>
                <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600">
                  <SelectValue placeholder="Tümü" />
                </SelectTrigger>
                <SelectContent className="dark:bg-gray-700">
                  <SelectItem value=" ">Tümü</SelectItem>
                  {referansKaynaklari.map((referans) => (
                    <SelectItem key={referans.id} value={referans.deger}>
                      {referans.deger}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Başlangıç Ayı */}
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Başlangıç Ayı</label>
              <input
                type="month"
                value={filters.baslangicAyi}
                onChange={(e) => setFilters({ ...filters, baslangicAyi: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#4d5deb] bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            {/* Tarife Sıralama */}
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Tarife Sıralama</label>
              <Select value={filters.tarifeSiralama} onValueChange={(value) => setFilters({ ...filters, tarifeSiralama: value })}>
                <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600">
                  <SelectValue placeholder="Sıralama yok" />
                </SelectTrigger>
                <SelectContent className="dark:bg-gray-700">
                  <SelectItem value=" ">Sıralama yok</SelectItem>
                  <SelectItem value="artan">Artan fiyat</SelectItem>
                  <SelectItem value="azalan">Azalan fiyat</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}

      {/* Accordion Categories */}
      <Accordion type="multiple" defaultValue={["aktif"]} className="space-y-4">
        {/* Aktif Öğrenciler */}
        <AccordionItem
          value="aktif"
          className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 px-6 overflow-hidden"
          data-testid="accordion-active"
        >
          <AccordionTrigger className="hover:no-underline py-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <Users className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div className="text-left">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  Aktif Öğrenciler
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{applyFilters(aktifStudents).length} öğrenci</p>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-6">
            {applyFilters(aktifStudents).length === 0 ? (
              <p className="text-center text-gray-500 py-8">Aktif öğrenci bulunamadı</p>
            ) : (
              renderStudentList(applyFilters(aktifStudents))
            )}
          </AccordionContent>
        </AccordionItem>

        {/* Ara Verdi */}
        <AccordionItem
          value="ara_verdi"
          className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 px-6 overflow-hidden"
          data-testid="accordion-paused"
        >
          <AccordionTrigger className="hover:no-underline py-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                <Users className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div className="text-left">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Ara Verdi</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{applyFilters(araVerdiStudents).length} öğrenci</p>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-6">
            {applyFilters(araVerdiStudents).length === 0 ? (
              <p className="text-center text-gray-500 py-8">Ara veren öğrenci bulunamadı</p>
            ) : (
              renderStudentList(applyFilters(araVerdiStudents))
            )}
          </AccordionContent>
        </AccordionItem>

        {/* Eski Öğrenci */}
        <AccordionItem
          value="eski"
          className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 px-6 overflow-hidden"
          data-testid="accordion-former"
        >
          <AccordionTrigger className="hover:no-underline py-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                <Users className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </div>
              <div className="text-left">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Eski Öğrenci</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{applyFilters(eskiStudents).length} öğrenci</p>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-6">
            {applyFilters(eskiStudents).length === 0 ? (
              <p className="text-center text-gray-500 py-8">Eski öğrenci bulunamadı</p>
            ) : (
              renderStudentList(applyFilters(eskiStudents))
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

export default AllStudents;