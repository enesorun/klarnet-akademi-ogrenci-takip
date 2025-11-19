import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import axios from "axios";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AddStudentModal = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    ad_soyad: "",
    konum: "",
    seviye: "Başlangıç",
    email: "",
    yas: "",
    meslek: "",
    ilk_ders_tarihi: new Date().toISOString().split('T')[0],
    referans: "Diğer",
    notlar: "",
    ucret: "",
    aylik_ders_sayisi: 4,
    tarife_not: "",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(`${API}/students`, {
        ad_soyad: formData.ad_soyad,
        konum: formData.konum,
        seviye: formData.seviye,
        email: formData.email,
        yas: parseInt(formData.yas),
        meslek: formData.meslek,
        ilk_ders_tarihi: formData.ilk_ders_tarihi,
        referans: formData.referans,
        notlar: formData.notlar,
      });

      // Tarife oluştur
      if (formData.ucret && parseFloat(formData.ucret) > 0) {
        await axios.post(`${API}/tariffs`, {
          ogrenci_id: response.data.id,
          baslangic_tarihi: formData.ilk_ders_tarihi,
          ucret: parseFloat(formData.ucret),
          aylik_ders_sayisi: parseInt(formData.aylik_ders_sayisi),
          not_: formData.tarife_not || "İlk tarife",
        });
      }

      toast.success("Öğrenci başarıyla eklendi!");
      onSuccess();
      onClose();
      // Reset form
      setFormData({
        ad_soyad: "",
        konum: "",
        seviye: "Başlangıç",
        email: "",
        yas: "",
        meslek: "",
        ilk_ders_tarihi: new Date().toISOString().split('T')[0],
        referans: "Diğer",
        notlar: "",
        ucret: "",
        aylik_ders_sayisi: 4,
        tarife_not: "",
      });
    } catch (error) {
      toast.error("Öğrenci eklenirken hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="add-student-modal">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Yeni Öğrenci Ekle</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="ad_soyad">Ad Soyad *</Label>
              <Input
                id="ad_soyad"
                value={formData.ad_soyad}
                onChange={(e) => setFormData({ ...formData, ad_soyad: e.target.value })}
                required
                data-testid="student-name-input"
              />
            </div>

            <div>
              <Label htmlFor="konum">Konum *</Label>
              <Input
                id="konum"
                value={formData.konum}
                onChange={(e) => setFormData({ ...formData, konum: e.target.value })}
                required
                data-testid="student-location-input"
              />
            </div>

            <div>
              <Label htmlFor="seviye">Seviye *</Label>
              <Select
                value={formData.seviye}
                onValueChange={(value) => setFormData({ ...formData, seviye: value })}
              >
                <SelectTrigger data-testid="student-level-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Başlangıç">Başlangıç</SelectItem>
                  <SelectItem value="Orta">Orta</SelectItem>
                  <SelectItem value="İleri">ileri</SelectItem>
                  <SelectItem value="Uzman">Uzman</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="email">E-mail *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                data-testid="student-email-input"
              />
            </div>

            <div>
              <Label htmlFor="yas">Yaş *</Label>
              <Input
                id="yas"
                type="number"
                value={formData.yas}
                onChange={(e) => setFormData({ ...formData, yas: e.target.value })}
                required
                data-testid="student-age-input"
              />
            </div>

            <div>
              <Label htmlFor="meslek">Meslek *</Label>
              <Input
                id="meslek"
                value={formData.meslek}
                onChange={(e) => setFormData({ ...formData, meslek: e.target.value })}
                required
                data-testid="student-occupation-input"
              />
            </div>

            <div>
              <Label htmlFor="ilk_ders_tarihi">İlk Ders Tarihi *</Label>
              <Input
                id="ilk_ders_tarihi"
                type="date"
                value={formData.ilk_ders_tarihi}
                onChange={(e) => setFormData({ ...formData, ilk_ders_tarihi: e.target.value })}
                required
                data-testid="student-first-lesson-input"
              />
            </div>

            <div>
              <Label htmlFor="referans">Referans *</Label>
              <Select
                value={formData.referans}
                onValueChange={(value) => setFormData({ ...formData, referans: value })}
              >
                <SelectTrigger data-testid="student-reference-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Tavsiye">Tavsiye</SelectItem>
                  <SelectItem value="Google Arama">Google Arama</SelectItem>
                  <SelectItem value="Sosyal Medya">Sosyal Medya</SelectItem>
                  <SelectItem value="Meta Reklam">Meta Reklam</SelectItem>
                  <SelectItem value="Google Reklam">Google Reklam</SelectItem>
                  <SelectItem value="Diğer">Diğer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tarife Bilgileri */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Tarife Bilgileri</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="ucret">Ücret (4 derslik paket) *</Label>
                <Input
                  id="ucret"
                  type="number"
                  step="0.01"
                  value={formData.ucret}
                  onChange={(e) => setFormData({ ...formData, ucret: e.target.value })}
                  required
                  placeholder="Örn: 6000"
                  data-testid="student-tariff-price-input"
                />
              </div>

              <div>
                <Label htmlFor="aylik_ders_sayisi">Aylık Ders Sayısı *</Label>
                <Input
                  id="aylik_ders_sayisi"
                  type="number"
                  value={formData.aylik_ders_sayisi}
                  onChange={(e) => setFormData({ ...formData, aylik_ders_sayisi: e.target.value })}
                  required
                  data-testid="student-tariff-lessons-input"
                />
              </div>

              <div className="col-span-2">
                <Label htmlFor="tarife_not">Tarife Notu</Label>
                <Input
                  id="tarife_not"
                  value={formData.tarife_not}
                  onChange={(e) => setFormData({ ...formData, tarife_not: e.target.value })}
                  placeholder="Örn: Standart tarife"
                  data-testid="student-tariff-note-input"
                />
              </div>
            </div>
          </div>

          {/* Genel Notlar */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
            <div className="col-span-2">
              <Label htmlFor="notlar">Genel Notlar</Label>
              <Textarea
                id="notlar"
                value={formData.notlar}
                onChange={(e) => setFormData({ ...formData, notlar: e.target.value })}
                rows={3}
                data-testid="student-notes-input"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              data-testid="cancel-button"
            >
              İptal
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-[#4d5deb] hover:bg-[#3a4ad4]"
              data-testid="save-student-button"
            >
              {loading ? "Kaydediliyor..." : "Kaydet"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddStudentModal;