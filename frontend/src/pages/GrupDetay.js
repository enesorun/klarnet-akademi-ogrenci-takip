import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { ArrowLeft, Plus, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const GrupDetay = () => {
  const { grupId } = useParams();
  const navigate = useNavigate();
  
  const [grup, setGrup] = useState(null);
  const [sezon, setSezon] = useState(null);
  const [ogrenciler, setOgrenciler] = useState([]);
  const [filteredOgrenciler, setFilteredOgrenciler] = useState([]);
  const [dersKayitlari, setDersKayitlari] = useState([]);
  const [isOgrenciModalOpen, setIsOgrenciModalOpen] = useState(false);
  const [isDersModalOpen, setIsDersModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("ogrenciler"); // "ogrenciler" veya "dersler"
  
  const [durumFilter, setDurumFilter] = useState("hepsi");
  const [odemeFilter, setOdemeFilter] = useState("hepsi");

  const [ogrenciForm, setOgrenciForm] = useState({
    ad_soyad: "",
    telefon: "",
    eposta: "",
    paket_tipi: "1. Etap",
    ucret: "",
    odeme_sekli: "Peşin",
    ilk_odeme_tutari: "",
    ilk_odeme_tarihi: new Date().toISOString().split('T')[0],
  });

  const [dersForm, setDersForm] = useState({
    tarih: new Date().toISOString().split('T')[0],
    konu: "",
    not_: "",
  });

  useEffect(() => {
    fetchGrupDetay();
    fetchOgrenciler();
    fetchDersKayitlari();
  }, [grupId]);

  useEffect(() => {
    applyFilters();
  }, [ogrenciler, durumFilter, odemeFilter]);

  const fetchGrupDetay = async () => {
    try {
      const grupRes = await axios.get(`${API}/grup-dersleri/gruplar/${grupId}`);
      setGrup(grupRes.data);
      
      // Sezon bilgisini al
      const sezonRes = await axios.get(`${API}/grup-dersleri/sezonlar`);
      const sezonData = sezonRes.data.find(s => s.id === grupRes.data.sezon_id);
      setSezon(sezonData);
    } catch (error) {
      toast.error("Grup bilgileri yüklenirken hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const fetchOgrenciler = async () => {
    try {
      const response = await axios.get(`${API}/grup-dersleri/ogrenciler`, {
        params: { grup_id: grupId },
      });
      setOgrenciler(response.data);
    } catch (error) {
      toast.error("Öğrenciler yüklenirken hata oluştu");
    }
  };

  const fetchDersKayitlari = async () => {
    try {
      const response = await axios.get(`${API}/grup-dersleri/ders-kayitlari`, {
        params: { grup_id: grupId },
      });
      setDersKayitlari(response.data);
    } catch (error) {
      console.error("Ders kayıtları yüklenemedi:", error);
    }
  };

  const applyFilters = () => {
    let filtered = [...ogrenciler];

    // Durum filtresi
    if (durumFilter !== "hepsi") {
      filtered = filtered.filter(o => o.durum === durumFilter);
    }

    // Ödeme filtresi
    if (odemeFilter === "tamamlanan") {
      filtered = filtered.filter(o => o.kalan_tutar === 0);
    } else if (odemeFilter === "devam_eden") {
      filtered = filtered.filter(o => o.kalan_tutar > 0);
    }

    setFilteredOgrenciler(filtered);
  };

  const handleCreateOgrenci = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/grup-dersleri/ogrenciler`, {
        ...ogrenciForm,
        sezon_id: grup.sezon_id,
        grup_id: grupId,
        ucret: parseFloat(ogrenciForm.ucret),
        ilk_odeme_tutari: ogrenciForm.ilk_odeme_tutari 
          ? parseFloat(ogrenciForm.ilk_odeme_tutari) 
          : 0,
      });
      toast.success("Öğrenci eklendi!");
      setIsOgrenciModalOpen(false);
      setOgrenciForm({
        ad_soyad: "",
        telefon: "",
        eposta: "",
        paket_tipi: "1. Etap",
        ucret: "",
        odeme_sekli: "Peşin",
        ilk_odeme_tutari: "",
        ilk_odeme_tarihi: new Date().toISOString().split('T')[0],
      });
      fetchOgrenciler();
    } catch (error) {
      toast.error("Öğrenci eklenirken hata oluştu");
    }
  };

  const handleCreateDers = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/grup-dersleri/ders-kayitlari`, {
        ...dersForm,
        grup_id: grupId,
      });
      toast.success("Ders kaydı eklendi!");
      setIsDersModalOpen(false);
      setDersForm({
        tarih: new Date().toISOString().split('T')[0],
        konu: "",
        not_: "",
      });
      fetchDersKayitlari();
      fetchGrupDetay(); // Ders sayısını güncellemek için
    } catch (error) {
      toast.error("Ders kaydı eklenirken hata oluştu");
    }
  };

  const handleDeleteDers = async (kayitId) => {
    if (!window.confirm("Bu ders kaydını silmek istediğinizden emin misiniz?")) return;
    
    try {
      await axios.delete(`${API}/grup-dersleri/ders-kayitlari/${kayitId}`);
      toast.success("Ders kaydı silindi!");
      fetchDersKayitlari();
      fetchGrupDetay();
    } catch (error) {
      toast.error("Ders kaydı silinirken hata oluştu");
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("tr-TR", {
      style: "decimal",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount) + "₺";
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("tr-TR");
  };

  if (loading || !grup) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg text-gray-600 dark:text-gray-400">Yükleniyor...</div>
      </div>
    );
  }

  const mevcutOgrenciSayisi = ogrenciler.filter(o => o.durum === "aktif").length;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          onClick={() => navigate("/grup-dersleri")}
          className="dark:border-gray-600 dark:text-white dark:hover:bg-gray-700"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Geri
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {grup.grup_adi}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {sezon?.sezon_adi || "Sezon bilgisi yok"}
          </p>
        </div>
        <Button
          onClick={() => setIsOgrenciModalOpen(true)}
          className="bg-[#4d5deb] hover:bg-[#3a4ad4]"
        >
          <Plus className="w-4 h-4 mr-2" />
          Öğrenci Ekle
        </Button>
      </div>

      {/* Grup Bilgileri */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Grup Bilgileri
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Kur/Etap</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">
              {grup.kur_etap}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Gün/Saat</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">
              {grup.gun_saat}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Kapasite</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">
              {mevcutOgrenciSayisi} / {grup.max_kapasite}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Ders İlerleme</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">
              {grup.yapilan_ders_sayisi} / {grup.toplam_ders_sayisi}
            </p>
          </div>
        </div>
      </div>

      {/* Filtreler */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-4">
          <Filter className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <div className="flex-1 grid grid-cols-2 gap-4">
            <div>
              <Label className="text-gray-700 dark:text-gray-300 mb-2 block">Durum</Label>
              <Select value={durumFilter} onValueChange={setDurumFilter}>
                <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="dark:bg-gray-700 dark:border-gray-600">
                  <SelectItem value="hepsi" className="dark:text-white dark:focus:bg-gray-600">Hepsi</SelectItem>
                  <SelectItem value="aktif" className="dark:text-white dark:focus:bg-gray-600">Aktif</SelectItem>
                  <SelectItem value="ayrildi" className="dark:text-white dark:focus:bg-gray-600">Ayrıldı</SelectItem>
                  <SelectItem value="beklemede" className="dark:text-white dark:focus:bg-gray-600">Beklemede</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-gray-700 dark:text-gray-300 mb-2 block">Ödeme Durumu</Label>
              <Select value={odemeFilter} onValueChange={setOdemeFilter}>
                <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="dark:bg-gray-700 dark:border-gray-600">
                  <SelectItem value="hepsi" className="dark:text-white dark:focus:bg-gray-600">Hepsi</SelectItem>
                  <SelectItem value="tamamlanan" className="dark:text-white dark:focus:bg-gray-600">Tamamlanan</SelectItem>
                  <SelectItem value="devam_eden" className="dark:text-white dark:focus:bg-gray-600">Devam Eden</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Öğrenci Listesi */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Öğrenciler ({filteredOgrenciler.length})
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                  Ad Soyad
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                  Telefon
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                  Paket Tipi
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                  Ücret
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                  Ödeme Şekli
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                  Ödenen
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                  Kalan
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                  Kayıt Tarihi
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                  Durum
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredOgrenciler.length === 0 ? (
                <tr>
                  <td
                    colSpan="9"
                    className="px-6 py-8 text-center text-gray-500 dark:text-gray-400"
                  >
                    Öğrenci bulunmamaktadır. "Öğrenci Ekle" butonuna tıklayarak öğrenci
                    ekleyebilirsiniz.
                  </td>
                </tr>
              ) : (
                filteredOgrenciler.map((ogrenci) => (
                  <tr
                    key={ogrenci.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                      {ogrenci.ad_soyad}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {ogrenci.telefon}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {ogrenci.paket_tipi}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(ogrenci.ucret)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {ogrenci.odeme_sekli}
                    </td>
                    <td className="px-6 py-4 text-sm text-green-600 dark:text-green-400 font-medium">
                      {formatCurrency(ogrenci.odenen_tutar)}
                    </td>
                    <td className="px-6 py-4 text-sm text-red-600 dark:text-red-400 font-medium">
                      {formatCurrency(ogrenci.kalan_tutar)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {formatDate(ogrenci.kayit_tarihi)}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          ogrenci.durum === "aktif"
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                            : ogrenci.durum === "ayrildi"
                            ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                            : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
                        }`}
                      >
                        {ogrenci.durum === "aktif"
                          ? "Aktif"
                          : ogrenci.durum === "ayrildi"
                          ? "Ayrıldı"
                          : "Beklemede"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Öğrenci Ekle Modal */}
      <Dialog open={isOgrenciModalOpen} onOpenChange={setIsOgrenciModalOpen}>
        <DialogContent className="max-w-2xl dark:bg-gray-800">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-white">Grup Öğrencisi Ekle</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateOgrenci} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="ad_soyad" className="dark:text-gray-300">Ad Soyad *</Label>
                <Input
                  id="ad_soyad"
                  value={ogrenciForm.ad_soyad}
                  onChange={(e) =>
                    setOgrenciForm({ ...ogrenciForm, ad_soyad: e.target.value })
                  }
                  required
                  className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              <div>
                <Label htmlFor="telefon" className="dark:text-gray-300">Telefon *</Label>
                <Input
                  id="telefon"
                  value={ogrenciForm.telefon}
                  onChange={(e) =>
                    setOgrenciForm({ ...ogrenciForm, telefon: e.target.value })
                  }
                  required
                  className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              <div>
                <Label htmlFor="eposta" className="dark:text-gray-300">E-posta</Label>
                <Input
                  id="eposta"
                  type="email"
                  value={ogrenciForm.eposta}
                  onChange={(e) =>
                    setOgrenciForm({ ...ogrenciForm, eposta: e.target.value })
                  }
                  className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              <div>
                <Label htmlFor="paket_tipi" className="dark:text-gray-300">Paket Tipi *</Label>
                <Select
                  value={ogrenciForm.paket_tipi}
                  onValueChange={(value) =>
                    setOgrenciForm({ ...ogrenciForm, paket_tipi: value })
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
                <Label htmlFor="ucret" className="dark:text-gray-300">Ücret *</Label>
                <Input
                  id="ucret"
                  type="number"
                  step="0.01"
                  value={ogrenciForm.ucret}
                  onChange={(e) =>
                    setOgrenciForm({ ...ogrenciForm, ucret: e.target.value })
                  }
                  required
                  className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              <div>
                <Label htmlFor="odeme_sekli" className="dark:text-gray-300">Ödeme Şekli *</Label>
                <Select
                  value={ogrenciForm.odeme_sekli}
                  onValueChange={(value) =>
                    setOgrenciForm({ ...ogrenciForm, odeme_sekli: value })
                  }
                >
                  <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-gray-700 dark:border-gray-600">
                    <SelectItem value="Peşin" className="dark:text-white dark:focus:bg-gray-600">Peşin</SelectItem>
                    <SelectItem value="2 Taksit" className="dark:text-white dark:focus:bg-gray-600">2 Taksit</SelectItem>
                    <SelectItem value="4 Taksit" className="dark:text-white dark:focus:bg-gray-600">4 Taksit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="ilk_odeme_tutari" className="dark:text-gray-300">İlk Ödeme Tutarı</Label>
                <Input
                  id="ilk_odeme_tutari"
                  type="number"
                  step="0.01"
                  value={ogrenciForm.ilk_odeme_tutari}
                  onChange={(e) =>
                    setOgrenciForm({
                      ...ogrenciForm,
                      ilk_odeme_tutari: e.target.value,
                    })
                  }
                  className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              <div>
                <Label htmlFor="ilk_odeme_tarihi" className="dark:text-gray-300">İlk Ödeme Tarihi</Label>
                <Input
                  id="ilk_odeme_tarihi"
                  type="date"
                  value={ogrenciForm.ilk_odeme_tarihi}
                  onChange={(e) =>
                    setOgrenciForm({
                      ...ogrenciForm,
                      ilk_odeme_tarihi: e.target.value,
                    })
                  }
                  className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOgrenciModalOpen(false)}
              >
                İptal
              </Button>
              <Button type="submit" className="bg-[#4d5deb] hover:bg-[#3a4ad4]">
                Kaydet
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GrupDetay;
