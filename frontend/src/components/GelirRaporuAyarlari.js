import { useState, useEffect } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const GelirRaporuAyarlari = () => {
  const [baslangicGunu, setBaslangicGunu] = useState(15);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchAyarlar();
  }, []);

  const fetchAyarlar = async () => {
    try {
      const response = await axios.get(`${API}/gelir-raporu-ayarlari`);
      setBaslangicGunu(response.data.baslangic_gunu);
    } catch (error) {
      toast.error("Ayarlar yüklenirken hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (baslangicGunu < 1 || baslangicGunu > 28) {
      toast.error("Başlangıç günü 1-28 arası olmalıdır");
      return;
    }

    setSaving(true);
    try {
      await axios.post(`${API}/gelir-raporu-ayarlari?baslangic_gunu=${baslangicGunu}`);
      toast.success("Ayarlar kaydedildi!");
    } catch (error) {
      toast.error("Ayarlar kaydedilirken hata oluştu");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-gray-500 dark:text-gray-400">Yükleniyor...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Aylık Gelir Raporu Ayarları
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          Aylık gelir raporlarının hangi günden hangi güne kadar hesaplanacağını belirleyin.
          Örneğin, 15 seçerseniz: 15 Ocak - 15 Şubat arası Şubat ayı geliri olarak hesaplanır.
        </p>

        <div className="max-w-md">
          <Label htmlFor="baslangic_gunu" className="text-gray-700 dark:text-gray-300 mb-2 block">
            Aylık Dönem Başlangıç Günü *
          </Label>
          <Input
            id="baslangic_gunu"
            type="number"
            min="1"
            max="28"
            value={baslangicGunu}
            onChange={(e) => setBaslangicGunu(parseInt(e.target.value))}
            className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            1-28 arası bir değer giriniz
          </p>

          <Button
            onClick={handleSave}
            disabled={saving}
            className="mt-4 bg-[#4d5deb] hover:bg-[#3a4ad4]"
          >
            {saving ? "Kaydediliyor..." : "Kaydet"}
          </Button>
        </div>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-300 mb-2">
          Rapor Ayrımı
        </h3>
        <p className="text-sm text-blue-800 dark:text-blue-300">
          Gelir raporlarında "Birebir" ve "Grup Dersleri" gelirleri ayrı ayrı gösterilir.
          Böylece hangi kaynaktan ne kadar gelir elde ettiğinizi kolayca görebilirsiniz.
        </p>
      </div>
    </div>
  );
};

export default GelirRaporuAyarlari;
