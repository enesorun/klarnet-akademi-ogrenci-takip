import { useState, useEffect } from "react";
import axios from "axios";
import { Settings, Plus, Pencil, Trash2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import OzelAlanlar from "@/components/OzelAlanlar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const KATEGORILER = [
  { key: "seviyeler", label: "Öğrenci Seviyeleri", hasPrice: false },
  { key: "ogrenci_durumlari", label: "Öğrenci Durumları", hasPrice: false },
  { key: "referans_kaynaklari", label: "Referans Kaynakları", hasPrice: false },
  { key: "grup_etaplari", label: "Grup Etapları", hasPrice: true },
  { key: "grup_durumlari", label: "Grup Durumları", hasPrice: false },
  { key: "grup_ogrenci_durumlari", label: "Grup Öğrenci Durumları", hasPrice: false },
  { key: "odeme_sekilleri", label: "Ödeme Şekilleri", hasPrice: false },
];

const Ayarlar = () => {
  const [ayarlar, setAyarlar] = useState({});
  const [selectedKategori, setSelectedKategori] = useState("seviyeler");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    deger: "",
    varsayilan_ucret: "",
    sira: 0,
  });

  useEffect(() => {
    fetchAyarlar();
  }, []);

  const fetchAyarlar = async () => {
    try {
      const response = await axios.get(`${API}/ayarlar`);
      // Kategorilere göre grupla
      const grouped = response.data.reduce((acc, item) => {
        if (!acc[item.kategori]) {
          acc[item.kategori] = [];
        }
        acc[item.kategori].push(item);
        return acc;
      }, {});
      setAyarlar(grouped);
    } catch (error) {
      toast.error("Ayarlar yüklenirken hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const handleInitialize = async () => {
    try {
      const response = await axios.post(`${API}/ayarlar/initialize`);
      toast.success(response.data.message);
      fetchAyarlar();
    } catch (error) {
      toast.error("Başlatma hatası");
    }
  };

  const handleOpenModal = (item = null) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        deger: item.deger,
        varsayilan_ucret: item.varsayilan_ucret || "",
        sira: item.sira,
      });
    } else {
      setEditingItem(null);
      const maxSira = ayarlar[selectedKategori]?.length || 0;
      setFormData({
        deger: "",
        varsayilan_ucret: "",
        sira: maxSira + 1,
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        kategori: selectedKategori,
        deger: formData.deger,
        sira: parseInt(formData.sira),
        aktif: true,
      };

      // Fiyat varsa ekle
      const kategoriInfo = KATEGORILER.find(k => k.key === selectedKategori);
      if (kategoriInfo?.hasPrice && formData.varsayilan_ucret) {
        data.varsayilan_ucret = parseFloat(formData.varsayilan_ucret);
      }

      if (editingItem) {
        await axios.put(`${API}/ayarlar/${editingItem.id}`, data);
        toast.success("Ayar güncellendi!");
      } else {
        await axios.post(`${API}/ayarlar`, data);
        toast.success("Ayar eklendi!");
      }

      setIsModalOpen(false);
      setFormData({ deger: "", varsayilan_ucret: "", sira: 0 });
      fetchAyarlar();
    } catch (error) {
      toast.error("İşlem sırasında hata oluştu");
    }
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    try {
      await axios.delete(`${API}/ayarlar/${deleteItem.id}`);
      toast.success("Ayar silindi!");
      setDeleteItem(null);
      fetchAyarlar();
    } catch (error) {
      toast.error("Silme işlemi başarısız");
    }
  };

  const currentKategori = KATEGORILER.find(k => k.key === selectedKategori);
  const currentItems = ayarlar[selectedKategori] || [];

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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Settings className="w-8 h-8" />
            Sistem Ayarları
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Tüm sistem seçeneklerini buradan yönetin
          </p>
        </div>
        {Object.keys(ayarlar).length === 0 && (
          <Button
            onClick={handleInitialize}
            className="bg-green-600 hover:bg-green-700"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Varsayılan Ayarları Yükle
          </Button>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={selectedKategori} onValueChange={setSelectedKategori}>
        <TabsList className="grid grid-cols-4 lg:grid-cols-8 gap-2 h-auto bg-white dark:bg-gray-800 p-2 rounded-lg border border-gray-200 dark:border-gray-700">
          {KATEGORILER.map((kategori) => (
            <TabsTrigger
              key={kategori.key}
              value={kategori.key}
              className="data-[state=active]:bg-[#4d5deb] data-[state=active]:text-white dark:text-gray-300 px-3 py-2 text-sm"
            >
              {kategori.label}
            </TabsTrigger>
          ))}
          <TabsTrigger
            value="ozel_alanlar"
            className="data-[state=active]:bg-[#4d5deb] data-[state=active]:text-white dark:text-gray-300 px-3 py-2 text-sm"
          >
            Özel Alanlar
          </TabsTrigger>
        </TabsList>

        {KATEGORILER.map((kategori) => (
          <TabsContent key={kategori.key} value={kategori.key} className="space-y-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {kategori.label}
                </h2>
                <Button
                  onClick={() => handleOpenModal()}
                  className="bg-[#4d5deb] hover:bg-[#3a4ad4]"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Yeni Ekle
                </Button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                        Sıra
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                        Değer
                      </th>
                      {kategori.hasPrice && (
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                          Varsayılan Ücret
                        </th>
                      )}
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                        İşlemler
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {currentItems.length === 0 ? (
                      <tr>
                        <td
                          colSpan={kategori.hasPrice ? 4 : 3}
                          className="px-6 py-8 text-center text-gray-500 dark:text-gray-400"
                        >
                          Henüz kayıt yok. "Yeni Ekle" butonuna tıklayarak ekleyebilirsiniz.
                        </td>
                      </tr>
                    ) : (
                      currentItems.map((item) => (
                        <tr
                          key={item.id}
                          className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                          <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                            {item.sira}
                          </td>
                          <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                            {item.deger}
                          </td>
                          {kategori.hasPrice && (
                            <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                              {item.varsayilan_ucret
                                ? new Intl.NumberFormat("tr-TR", {
                                    style: "decimal",
                                    minimumFractionDigits: 0,
                                  }).format(item.varsayilan_ucret) + "₺"
                                : "-"}
                            </td>
                          )}
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                onClick={() => handleOpenModal(item)}
                                variant="outline"
                                size="sm"
                                className="dark:border-gray-600 dark:text-white dark:hover:bg-gray-700"
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button
                                onClick={() => setDeleteItem(item)}
                                variant="outline"
                                size="sm"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>
        ))}

        {/* Özel Alanlar Tab */}
        <TabsContent value="ozel_alanlar">
          <OzelAlanlar />
        </TabsContent>
      </Tabs>

      {/* Add/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="dark:bg-gray-800">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-white">
              {editingItem ? "Düzenle" : "Yeni Ekle"} - {currentKategori?.label}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="deger" className="dark:text-gray-300">Değer *</Label>
              <Input
                id="deger"
                value={formData.deger}
                onChange={(e) => setFormData({ ...formData, deger: e.target.value })}
                required
                className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            {currentKategori?.hasPrice && (
              <div>
                <Label htmlFor="varsayilan_ucret" className="dark:text-gray-300">
                  Varsayılan Ücret
                </Label>
                <Input
                  id="varsayilan_ucret"
                  type="number"
                  step="0.01"
                  value={formData.varsayilan_ucret}
                  onChange={(e) =>
                    setFormData({ ...formData, varsayilan_ucret: e.target.value })
                  }
                  className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
            )}
            <div>
              <Label htmlFor="sira" className="dark:text-gray-300">Sıra *</Label>
              <Input
                id="sira"
                type="number"
                value={formData.sira}
                onChange={(e) =>
                  setFormData({ ...formData, sira: e.target.value })
                }
                required
                className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
              >
                İptal
              </Button>
              <Button type="submit" className="bg-[#4d5deb] hover:bg-[#3a4ad4]">
                {editingItem ? "Güncelle" : "Ekle"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteItem} onOpenChange={() => setDeleteItem(null)}>
        <AlertDialogContent className="dark:bg-gray-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-gray-900 dark:text-white">
              Emin misiniz?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600 dark:text-gray-400">
              "{deleteItem?.deger}" değerini silmek istediğinizden emin misiniz? Bu işlem geri
              alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Ayarlar;
