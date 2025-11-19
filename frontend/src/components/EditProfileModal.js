import { useState, useEffect } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import axios from "axios";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const EditProfileModal = ({ isOpen, onClose, student, currentTariff, onSuccess }) => {
  const [profileData, setProfileData] = useState({});
  const [tariffData, setTariffData] = useState({
    ucret: "",
    aylik_ders_sayisi: 4,
    not_: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (student) {
      setProfileData({
        ad_soyad: student.ad_soyad,
        konum: student.konum,
        seviye: student.seviye,
        email: student.email,
        yas: student.yas,
        meslek: student.meslek,
        referans: student.referans,
        notlar: student.notlar,
      });
    }
    if (currentTariff) {
      setTariffData({
        ucret: currentTariff.ucret,
        aylik_ders_sayisi: currentTariff.aylik_ders_sayisi,
        not_: currentTariff.not_ || "",
      });
    }
  }, [student, currentTariff]);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await axios.put(`${API}/students/${student.id}`, profileData);
      toast.success("Profil güncellendi!");
      onSuccess();
      onClose();
    } catch (error) {
      toast.error("Profil güncellenirken hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const handleTariffSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await axios.post(`${API}/tariffs`, {
        ogrenci_id: student.id,
        baslangic_tarihi: new Date().toISOString(),
        ucret: parseFloat(tariffData.ucret),
        aylik_ders_sayisi: parseInt(tariffData.aylik_ders_sayisi),
        not_: tariffData.not_,
      });
      toast.success("Tarife güncellendi!");
      onSuccess();
      onClose();
    } catch (error) {
      toast.error("Tarife güncellenirken hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="edit-profile-modal">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Profil Düzenle</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="profile" className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="profile">Profil Bilgileri</TabsTrigger>
            <TabsTrigger value="tariff">Tarife Güncelle</TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <form onSubmit={handleProfileSubmit} className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="ad_soyad">Ad Soyad *</Label>
                  <Input
                    id="ad_soyad"
                    value={profileData.ad_soyad || ""}
                    onChange={(e) => setProfileData({ ...profileData, ad_soyad: e.target.value })}
                    required
                    data-testid="edit-name-input"
                  />
                </div>

                <div>
                  <Label htmlFor="konum">Konum *</Label>
                  <Input
                    id="konum"
                    value={profileData.konum || ""}
                    onChange={(e) => setProfileData({ ...profileData, konum: e.target.value })}
                    required
                    data-testid="edit-location-input"
                  />
                </div>

                <div>
                  <Label htmlFor="seviye">Seviye *</Label>
                  <Select
                    value={profileData.seviye || ""}
                    onValueChange={(value) => setProfileData({ ...profileData, seviye: value })}
                  >
                    <SelectTrigger data-testid="edit-level-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Başlangıç">Başlangıç</SelectItem>
                      <SelectItem value="Orta">Orta</SelectItem>
                      <SelectItem value="İleri">İleri</SelectItem>
                      <SelectItem value="Uzman">Uzman</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="email">E-mail *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profileData.email || ""}
                    onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                    required
                    data-testid="edit-email-input"
                  />
                </div>

                <div>
                  <Label htmlFor="yas">Yaş *</Label>
                  <Input
                    id="yas"
                    type="number"
                    value={profileData.yas || ""}
                    onChange={(e) => setProfileData({ ...profileData, yas: parseInt(e.target.value) })}
                    required
                    data-testid="edit-age-input"
                  />
                </div>

                <div>
                  <Label htmlFor="meslek">Meslek *</Label>
                  <Input
                    id="meslek"
                    value={profileData.meslek || ""}
                    onChange={(e) => setProfileData({ ...profileData, meslek: e.target.value })}
                    required
                    data-testid="edit-occupation-input"
                  />
                </div>

                <div>
                  <Label htmlFor="referans">Referans *</Label>
                  <Select
                    value={profileData.referans || ""}
                    onValueChange={(value) => setProfileData({ ...profileData, referans: value })}
                  >
                    <SelectTrigger data-testid="edit-reference-select">
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
                    value={profileData.notlar || ""}
                    onChange={(e) => setProfileData({ ...profileData, notlar: e.target.value })}
                    rows={3}
                    data-testid="edit-notes-input"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  data-testid="cancel-edit-button"
                >
                  İptal
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-[#4d5deb] hover:bg-[#3a4ad4]"
                  data-testid="save-profile-button"
                >
                  {loading ? "Kaydediliyor..." : "Kaydet"}
                </Button>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="tariff">
            <form onSubmit={handleTariffSubmit} className="space-y-4 mt-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-yellow-800">
                  Tarife güncellendiğinde eski tarife otomatik olarak kapatılır ve yeni tarife bugünden itibaren geçerli olur.
                </p>
              </div>

              <div>
                <Label htmlFor="ucret">Üret (4 derslik paket) *</Label>
                <Input
                  id="ucret"
                  type="number"
                  step="0.01"
                  value={tariffData.ucret}
                  onChange={(e) => setTariffData({ ...tariffData, ucret: e.target.value })}
                  required
                  data-testid="tariff-price-input"
                />
              </div>

              <div>
                <Label htmlFor="aylik_ders_sayisi">Aylık Ders Sayısı *</Label>
                <Input
                  id="aylik_ders_sayisi"
                  type="number"
                  value={tariffData.aylik_ders_sayisi}
                  onChange={(e) => setTariffData({ ...tariffData, aylik_ders_sayisi: e.target.value })}
                  required
                  data-testid="tariff-lessons-input"
                />
              </div>

              <div>
                <Label htmlFor="not_">Not</Label>
                <Textarea
                  id="not_"
                  value={tariffData.not_}
                  onChange={(e) => setTariffData({ ...tariffData, not_: e.target.value })}
                  rows={2}
                  placeholder="Örn: Yaz tatili indirimi"
                  data-testid="tariff-note-input"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  data-testid="cancel-tariff-button"
                >
                  İptal
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-[#4d5deb] hover:bg-[#3a4ad4]"
                  data-testid="save-tariff-button"
                >
                  {loading ? "Güncelleniyor..." : "Tarifeyi Güncelle"}
                </Button>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default EditProfileModal;