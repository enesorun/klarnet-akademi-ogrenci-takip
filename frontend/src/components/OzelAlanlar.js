import { useState, useEffect } from "react";
import axios from "axios";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const MODEL_TIPLERI = [
  { value: "ogrenci", label: "Öğrenci" },
  { value: "grup", label: "Grup" },
  { value: "grup_ogrenci", label: "Grup Öğrencisi" },
];

const ALAN_TIPLERI = [
  { value: "text", label: "Metin" },
  { value: "number", label: "Sayı" },
  { value: "date", label: "Tarih" },
];

const OzelAlanlar = () => {
  const [selectedModel, setSelectedModel] = useState("ogrenci");
  const [ozelAlanlar, setOzelAlanlar] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAlan, setEditingAlan] = useState(null);
  const [deleteAlanId, setDeleteAlanId] = useState(null);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    alan_adi: "",
    alan_tipi: "text",
    aktif: true,
  });

  useEffect(() => {
    fetchOzelAlanlar();
  }, [selectedModel]);

  const fetchOzelAlanlar = async () => {
    try {
      const response = await axios.get(`${API}/ozel-alanlar`, {
        params: { model_tipi: selectedModel },
      });
      setOzelAlanlar(response.data);
    } catch (error) {
      toast.error("Özel alanlar yüklenirken hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (alan = null) => {
    if (alan) {
      setEditingAlan(alan);
      setFormData({
        alan_adi: alan.alan_adi,
        alan_tipi: alan.alan_tipi,
        aktif: alan.aktif,
      });
    } else {
      setEditingAlan(null);
      setFormData({
        alan_adi: "",
        alan_tipi: "text",
        aktif: true,
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        model_tipi: selectedModel,
        ...formData,
      };

      if (editingAlan) {
        await axios.put(`${API}/ozel-alanlar/${editingAlan.id}`, data);
        toast.success("Özel alan güncellendi!");
      } else {
        await axios.post(`${API}/ozel-alanlar`, data);
        toast.success("Özel alan eklendi!");
      }

      setIsModalOpen(false);
      setFormData({ alan_adi: "", alan_tipi: "text", aktif: true });
      fetchOzelAlanlar();
    } catch (error) {
      toast.error("İşlem sırasında hata oluştu");
    }
  };

  const handleDelete = async () => {
    if (!deleteAlanId) return;
    try {
      await axios.delete(`${API}/ozel-alanlar/${deleteAlanId}`);
      toast.success("Özel alan silindi!");
      setDeleteAlanId(null);
      fetchOzelAlanlar();
    } catch (error) {
      toast.error("Silme işlemi başarısız");
    }
  };

  const getModelLabel = (value) => {
    return MODEL_TIPLERI.find(m => m.value === value)?.label || value;
  };

  const getAlanTipiLabel = (value) => {
    return ALAN_TIPLERI.find(t => t.value === value)?.label || value;
  };

  return (
    <div className="space-y-6">
      {/* Model Seçici */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <Label className="text-gray-700 dark:text-gray-300 mb-2 block">Model Seçin</Label>
        <Select value={selectedModel} onValueChange={setSelectedModel}>
          <SelectTrigger className="max-w-md dark:bg-gray-700 dark:border-gray-600 dark:text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="dark:bg-gray-700 dark:border-gray-600">
            {MODEL_TIPLERI.map((model) => (
              <SelectItem
                key={model.value}
                value={model.value}
                className="dark:text-white dark:focus:bg-gray-600"
              >
                {model.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Özel Alanlar Tablosu */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {getModelLabel(selectedModel)} Özel Alanları
          </h2>
          <Button
            onClick={() => handleOpenModal()}
            className="bg-[#4d5deb] hover:bg-[#3a4ad4]"
          >
            <Plus className="w-4 h-4 mr-2" />
            Yeni Alan Ekle
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                  Alan Adı
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                  Alan Tipi
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                  Durum
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {ozelAlanlar.length === 0 ? (
                <tr>
                  <td
                    colSpan="4"
                    className="px-6 py-8 text-center text-gray-500 dark:text-gray-400"
                  >
                    Henüz özel alan eklenmemiş. "Yeni Alan Ekle" butonuna tıklayarak ekleyebilirsiniz.
                  </td>
                </tr>
              ) : (
                ozelAlanlar.map((alan) => (
                  <tr
                    key={alan.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                      {alan.alan_adi}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {getAlanTipiLabel(alan.alan_tipi)}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          alan.aktif
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                            : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                        }`}
                      >
                        {alan.aktif ? "Aktif" : "Pasif"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <Button
                        onClick={() => handleOpenModal(alan)}
                        variant="outline"
                        size="sm"
                        className="dark:border-gray-600 dark:text-white dark:hover:bg-gray-700"
                      >
                        <Pencil className="w-3 h-3" />
                      </Button>
                      <Button
                        onClick={() => setDeleteAlanId(alan.id)}
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 border-red-300 dark:border-red-700"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Özel Alan Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="dark:bg-gray-800">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-white">
              {editingAlan ? "Özel Alan Düzenle" : "Yeni Özel Alan Ekle"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="alan_adi" className="dark:text-gray-300">Alan Adı *</Label>
              <Input
                id="alan_adi"
                value={formData.alan_adi}
                onChange={(e) => setFormData({ ...formData, alan_adi: e.target.value })}
                placeholder="Örn: Doğum Yeri"
                required
                className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>

            <div>
              <Label htmlFor="alan_tipi" className="dark:text-gray-300">Alan Tipi *</Label>
              <Select
                value={formData.alan_tipi}
                onValueChange={(value) => setFormData({ ...formData, alan_tipi: value })}
              >
                <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="dark:bg-gray-700 dark:border-gray-600">
                  {ALAN_TIPLERI.map((tip) => (
                    <SelectItem
                      key={tip.value}
                      value={tip.value}
                      className="dark:text-white dark:focus:bg-gray-600"
                    >
                      {tip.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="aktif"
                checked={formData.aktif}
                onChange={(e) => setFormData({ ...formData, aktif: e.target.checked })}
                className="w-4 h-4 text-[#4d5deb] bg-gray-100 border-gray-300 rounded focus:ring-[#4d5deb]"
              />
              <Label htmlFor="aktif" className="dark:text-gray-300">Aktif</Label>
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
                {editingAlan ? "Güncelle" : "Ekle"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Silme Onay Dialog */}
      <AlertDialog open={!!deleteAlanId} onOpenChange={() => setDeleteAlanId(null)}>
        <AlertDialogContent className="dark:bg-gray-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-gray-900 dark:text-white">
              Özel alanı silmek istediğinize emin misiniz?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600 dark:text-gray-400">
              Bu işlem geri alınamaz. Bu alana ait tüm veriler silinecektir.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="dark:bg-gray-700 dark:text-white">
              İptal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default OzelAlanlar;
