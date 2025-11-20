import { useState, useEffect } from "react";
import axios from "axios";
import { Users, TrendingUp, CheckCircle, Clock, Plus } from "lucide-react";
import { useAyarlar } from "@/hooks/useAyarlar";
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const GrupDersleri = () => {
  const navigate = useNavigate();
  const [sezonlar, setSezonlar] = useState([]);
  const [selectedSezon, setSelectedSezon] = useState("");
  const [gruplar, setGruplar] = useState([]);
  const [stats, setStats] = useState(null);
  const [isSezonModalOpen, setIsSezonModalOpen] = useState(false);
  const [isGrupModalOpen, setIsGrupModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Dinamik ayarlar
  const { ayarlar: etaplar } = useAyarlar("grup_etaplari");
  const { ayarlar: grupDurumlari } = useAyarlar("grup_durumlari");
  const { ayarlar: odemeSekilleri } = useAyarlar("odeme_sekilleri");

  const [sezonForm, setSezonForm] = useState({
    sezon_adi: "",
    baslangic_tarihi: "",
    bitis_tarihi: "",
  });

  const [grupForm, setGrupForm] = useState({
    grup_adi: "",
    kur_etap: "",
    gun_saat: "",
    max_kapasite: 10,
    toplam_ders_sayisi: 16,
  });

  // Etaplar yüklenince default değeri set et
  useEffect(() => {
    if (etaplar.length > 0 && !grupForm.kur_etap) {
      setGrupForm(prev => ({ ...prev, kur_etap: etaplar[0].deger }));
    }
  }, [etaplar]);

  useEffect(() => {
    fetchSezonlar();
  }, []);

  useEffect(() => {
    if (selectedSezon) {
      fetchGruplar();
      fetchStats();
    }
  }, [selectedSezon]);

  const fetchSezonlar = async () => {
    try {
      const response = await axios.get(`${API}/grup-dersleri/sezonlar`);
      setSezonlar(response.data);
      if (response.data.length > 0 && !selectedSezon) {
        setSelectedSezon(response.data[0].id);
      }
    } catch (error) {
      toast.error("Sezonlar yüklenirken hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const fetchGruplar = async () => {
    try {
      const response = await axios.get(`${API}/grup-dersleri/gruplar`, {
        params: { sezon_id: selectedSezon },
      });
      setGruplar(response.data);
    } catch (error) {
      toast.error("Gruplar yüklenirken hata oluştu");
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get(
        `${API}/grup-dersleri/dashboard/${selectedSezon}`
      );
      setStats(response.data);
    } catch (error) {
      console.error("Stats error:", error);
    }
  };

  const handleCreateSezon = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/grup-dersleri/sezonlar`, sezonForm);
      toast.success("Sezon oluşturuldu!");
      setIsSezonModalOpen(false);
      setSezonForm({ sezon_adi: "", baslangic_tarihi: "", bitis_tarihi: "" });
      fetchSezonlar();
    } catch (error) {
      toast.error("Sezon oluşturulurken hata oluştu");
    }
  };

  const handleCreateGrup = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/grup-dersleri/gruplar`, {
        ...grupForm,
        sezon_id: selectedSezon,
      });
      toast.success("Grup oluşturuldu!");
      setIsGrupModalOpen(false);
      setGrupForm({
        grup_adi: "",
        kur_etap: "1. Etap",
        gun_saat: "",
        max_kapasite: 10,
        toplam_ders_sayisi: 16,
      });
      fetchGruplar();
      fetchStats();
    } catch (error) {
      toast.error("Grup oluşturulurken hata oluştu");
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("tr-TR", {
      style: "decimal",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount) + "₺";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg text-gray-600 dark:text-gray-400">Yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Grup Dersleri
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Grup derslerinizi ve öğrencilerinizi yönetin
          </p>
        </div>
      </div>

      {/* Sezon Selector */}
      <div className="flex items-center gap-4">
        <div className="flex-1 max-w-md">
          <Label className="text-gray-700 dark:text-gray-300 mb-2 block">Sezon Seçin</Label>
          <Select value={selectedSezon} onValueChange={setSelectedSezon}>
            <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 dark:text-white">
              <SelectValue placeholder="Sezon seçiniz" />
            </SelectTrigger>
            <SelectContent className="dark:bg-gray-700 dark:border-gray-600">
              {sezonlar.map((sezon) => (
                <SelectItem
                  key={sezon.id}
                  value={sezon.id}
                  className="dark:text-white dark:focus:bg-gray-600"
                >
                  {sezon.sezon_adi}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          onClick={() => setIsSezonModalOpen(true)}
          className="bg-[#4d5deb] hover:bg-[#3a4ad4] mt-6"
        >
          <Plus className="w-4 h-4 mr-2" />
          Yeni Sezon
        </Button>
      </div>

      {selectedSezon && stats && (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Toplam Grup</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                    {stats.toplam_grup_sayisi}
                  </p>
                </div>
                <Users className="w-12 h-12 text-blue-500" />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Toplam Öğrenci</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                    {stats.toplam_ogrenci_sayisi}
                  </p>
                </div>
                <Users className="w-12 h-12 text-green-500" />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Tahmini Gelir</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                    {formatCurrency(stats.tahmini_toplam_gelir)}
                  </p>
                </div>
                <TrendingUp className="w-12 h-12 text-purple-500" />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Ödeme Durumu</p>
                  <div className="flex items-center gap-2 mt-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-lg font-semibold text-gray-900 dark:text-white">
                      {stats.odeme_tamamlanan}
                    </span>
                    <Clock className="w-5 h-5 text-yellow-500 ml-2" />
                    <span className="text-lg font-semibold text-gray-900 dark:text-white">
                      {stats.taksitte_olan}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Grup List */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Gruplar</h2>
              <Button
                onClick={() => setIsGrupModalOpen(true)}
                className="bg-[#4d5deb] hover:bg-[#3a4ad4]"
              >
                <Plus className="w-4 h-4 mr-2" />
                Yeni Grup
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Grup Adı
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Kur/Etap
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Gün/Saat
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Kapasite
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Ders İlerleme
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Durum
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      İşlem
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {gruplar.length === 0 ? (
                    <tr>
                      <td
                        colSpan="7"
                        className="px-6 py-8 text-center text-gray-500 dark:text-gray-400"
                      >
                        Bu sezona ait grup bulunmamaktadır. "Yeni Grup" butonuna tıklayarak grup
                        ekleyebilirsiniz.
                      </td>
                    </tr>
                  ) : (
                    gruplar.map((grup) => (
                      <tr
                        key={grup.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                          {grup.grup_adi}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                          {grup.kur_etap}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                          {grup.gun_saat}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                          {/* TODO: Mevcut öğrenci sayısı hesaplanacak */}
                          0 / {grup.max_kapasite}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                          {grup.yapilan_ders_sayisi} / {grup.toplam_ders_sayisi}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              grup.durum === "aktif"
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                                : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                            }`}
                          >
                            {grup.durum === "aktif" ? "Aktif" : "Tamamlandı"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <Button
                            onClick={() => navigate(`/grup-dersleri/${grup.id}`)}
                            variant="outline"
                            size="sm"
                            className="dark:border-gray-600 dark:text-white dark:hover:bg-gray-700"
                          >
                            Detay
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Yeni Sezon Modal */}
      <Dialog open={isSezonModalOpen} onOpenChange={setIsSezonModalOpen}>
        <DialogContent className="dark:bg-gray-800">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-white">Yeni Sezon Oluştur</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateSezon} className="space-y-4">
            <div>
              <Label htmlFor="sezon_adi" className="dark:text-gray-300">Sezon Adı *</Label>
              <Input
                id="sezon_adi"
                value={sezonForm.sezon_adi}
                onChange={(e) =>
                  setSezonForm({ ...sezonForm, sezon_adi: e.target.value })
                }
                placeholder="Örn: 2025 / Kasım"
                required
                className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            <div>
              <Label htmlFor="baslangic_tarihi" className="dark:text-gray-300">Başlangıç Tarihi *</Label>
              <Input
                id="baslangic_tarihi"
                type="date"
                value={sezonForm.baslangic_tarihi}
                onChange={(e) =>
                  setSezonForm({ ...sezonForm, baslangic_tarihi: e.target.value })
                }
                required
                className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            <div>
              <Label htmlFor="bitis_tarihi" className="dark:text-gray-300">Bitiş Tarihi *</Label>
              <Input
                id="bitis_tarihi"
                type="date"
                value={sezonForm.bitis_tarihi}
                onChange={(e) =>
                  setSezonForm({ ...sezonForm, bitis_tarihi: e.target.value })
                }
                required
                className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsSezonModalOpen(false)}
              >
                İptal
              </Button>
              <Button type="submit" className="bg-[#4d5deb] hover:bg-[#3a4ad4]">
                Oluştur
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Yeni Grup Modal */}
      <Dialog open={isGrupModalOpen} onOpenChange={setIsGrupModalOpen}>
        <DialogContent className="dark:bg-gray-800">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-white">Yeni Grup Oluştur</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateGrup} className="space-y-4">
            <div>
              <Label htmlFor="grup_adi" className="dark:text-gray-300">Grup Adı *</Label>
              <Input
                id="grup_adi"
                value={grupForm.grup_adi}
                onChange={(e) =>
                  setGrupForm({ ...grupForm, grup_adi: e.target.value })
                }
                placeholder="Örn: Grup A"
                required
                className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            <div>
              <Label htmlFor="kur_etap" className="dark:text-gray-300">Kur/Etap *</Label>
              <Select
                value={grupForm.kur_etap}
                onValueChange={(value) =>
                  setGrupForm({ ...grupForm, kur_etap: value })
                }
              >
                <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="dark:bg-gray-700 dark:border-gray-600">
                  <SelectItem value="1. Etap" className="dark:text-white dark:focus:bg-gray-600">1. Etap</SelectItem>
                  <SelectItem value="2. Etap" className="dark:text-white dark:focus:bg-gray-600">2. Etap</SelectItem>
                  <SelectItem value="Tam Paket" className="dark:text-white dark:focus:bg-gray-600">Tam Paket</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="gun_saat" className="dark:text-gray-300">Gün/Saat *</Label>
              <Input
                id="gun_saat"
                value={grupForm.gun_saat}
                onChange={(e) =>
                  setGrupForm({ ...grupForm, gun_saat: e.target.value })
                }
                placeholder="Örn: Pazartesi 18:00"
                required
                className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="max_kapasite" className="dark:text-gray-300">Max Kapasite *</Label>
                <Input
                  id="max_kapasite"
                  type="number"
                  value={grupForm.max_kapasite}
                  onChange={(e) =>
                    setGrupForm({
                      ...grupForm,
                      max_kapasite: parseInt(e.target.value),
                    })
                  }
                  required
                  className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              <div>
                <Label htmlFor="toplam_ders_sayisi" className="dark:text-gray-300">Toplam Ders Sayısı *</Label>
                <Input
                  id="toplam_ders_sayisi"
                  type="number"
                  value={grupForm.toplam_ders_sayisi}
                  onChange={(e) =>
                    setGrupForm({
                      ...grupForm,
                      toplam_ders_sayisi: parseInt(e.target.value),
                    })
                  }
                  required
                  className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsGrupModalOpen(false)}
              >
                İptal
              </Button>
              <Button type="submit" className="bg-[#4d5deb] hover:bg-[#3a4ad4]">
                Oluştur
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GrupDersleri;
