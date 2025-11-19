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
      await axios.post(`${API}/students`, {
        ...formData,
        yas: parseInt(formData.yas),
      });
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
                  <SelectItem value="Arkadaş Tavsiyesi">Arkadaş Tavsiyesi</SelectItem>
                  <SelectItem value="Sosyal Medya">Sosyal Medya</SelectItem>
                  <SelectItem value="Google">Google</SelectItem>
                  <SelectItem value="Eski Öğrenci">Eski Öğrenci</SelectItem>
                  <SelectItem value="Diğer">Diğer</SelectItem>
                </SelectContent>
              </Select>
            </div>

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