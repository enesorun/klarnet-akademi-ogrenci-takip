import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Download, Database, Calendar, HardDrive, Upload, FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const VeriYonetimi = () => {
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchBackups();
  }, []);

  const fetchBackups = async () => {
    try {
      const response = await axios.get(`${API}/backup/list`);
      setBackups(response.data.backups);
    } catch (error) {
      toast.error("Yedek listesi yüklenirken hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBackup = async () => {
    setCreating(true);
    try {
      const response = await axios.post(`${API}/backup/create`);
      toast.success(`Yedekleme başarılı! ${response.data.total_documents} kayıt yedeklendi.`);
      fetchBackups(); // Listeyi yenile
    } catch (error) {
      toast.error("Yedekleme sırasında hata oluştu");
    } finally {
      setCreating(false);
    }
  };

  const handleExport = async () => {
    try {
      toast.info("Veriler indiriliyor...");
      
      // Dosyayı indir
      const response = await axios.get(`${API}/export/data`, {
        responseType: 'blob'
      });
      
      // Blob oluştur ve indir
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      // Dosya adını header'dan al veya varsayılan kullan
      const contentDisposition = response.headers['content-disposition'];
      const filename = contentDisposition 
        ? contentDisposition.split('filename=')[1].replace(/"/g, '')
        : `klarnet_akademi_export_${new Date().getTime()}.json`;
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success("Veriler başarıyla indirildi!");
    } catch (error) {
      toast.error("Export sırasında hata oluştu");
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // JSON kontrolü
    if (!file.name.endsWith('.json')) {
      toast.error("Lütfen geçerli bir JSON dosyası seçin");
      return;
    }

    setImporting(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post(`${API}/import/data`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      const stats = response.data.stats;
      toast.success(
        `Import başarılı! ${stats.total_imported} kayıt eklendi, ${stats.total_skipped} kayıt atlandı (duplicate).`
      );
      
      // Input'u temizle
      e.target.value = '';
    } catch (error) {
      toast.error(error.response?.data?.detail || "Import sırasında hata oluştu");
    } finally {
      setImporting(false);
    }
  };

  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Electron yedekleme fonksiyonları
  const isElectron = window.electronAPI !== undefined;
  
  const handleElectronBackup = async () => {
    try {
      toast.info("Yedek dosyası kaydediliyor...");
      const result = await window.electronAPI.backupDatabase();
      
      if (result.success) {
        toast.success(result.message);
      } else {
        if (result.message !== 'İptal edildi') {
          toast.error(result.message);
        }
      }
    } catch (error) {
      toast.error("Yedekleme hatası!");
    }
  };
  
  const handleElectronRestore = async () => {
    try {
      toast.info("Yedek dosyası seçiliyor...");
      const result = await window.electronAPI.restoreDatabase();
      
      if (result.success) {
        toast.success(result.message);
      } else {
        if (result.message !== 'İptal edildi') {
          toast.error(result.message);
        }
      }
    } catch (error) {
      toast.error("Geri yükleme hatası!");
    }
  };

  return (
    <div className="space-y-6">
      {/* Electron Desktop Yedekleme (Manuel) */}
      {isElectron && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 shadow-sm border-2 border-blue-200 dark:border-blue-800">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-blue-900 dark:text-blue-100 mb-2">
                💾 Manuel Yedekleme (Desktop)
              </h2>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Database dosyasını bilgisayarınıza yedekleyin veya önceki bir yedekten geri yükleyin.
                Otomatik yedekler uygulama kapatılırken backups/ klasörüne alınır.
              </p>
            </div>
            <HardDrive className="w-12 h-12 text-blue-600" />
          </div>
          
          <div className="flex gap-3">
            <Button
              onClick={handleElectronBackup}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Download className="w-4 h-4 mr-2" />
              Manuel Yedek Al
            </Button>
            
            <Button
              onClick={handleElectronRestore}
              variant="outline"
              className="border-blue-600 text-blue-600 hover:bg-blue-50 dark:border-blue-400 dark:text-blue-400 dark:hover:bg-blue-900/20"
            >
              <Upload className="w-4 h-4 mr-2" />
              Yedekten Geri Yükle
            </Button>
          </div>
        </div>
      )}
      
      {/* Server Yedekleme (Web) */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {isElectron ? "📦 Server Yedekleme (JSON)" : "Veri Yedekleme"}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {isElectron 
                ? "JSON formatında yedek oluşturun. Bu yöntem veri aktarımı için uygundur."
                : "Tüm verilerinizi güvenli bir şekilde yedekleyin. Yedekler otomatik olarak /data/backup/YYYY-MM/ klasörüne kaydedilir."}
            </p>
          </div>
          <Database className="w-12 h-12 text-blue-500" />
        </div>

        <Button
          onClick={handleCreateBackup}
          disabled={creating}
          className="bg-[#4d5deb] hover:bg-[#3a4ad4]"
        >
          {creating ? "Yedekleniyor..." : "Anlık Yedek Al"}
        </Button>
      </div>

      {/* Export/Import */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Veri Dışa/İçe Aktarma
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Verilerinizi tek bir JSON dosyası olarak dışa aktarın veya başka bir yerden veri içe aktarın.
        </p>

        <div className="flex gap-3">
          <Button
            onClick={handleExport}
            variant="outline"
            className="border-green-500 text-green-600 hover:bg-green-50 dark:border-green-600 dark:text-green-400 dark:hover:bg-green-900/20"
          >
            <FileDown className="w-4 h-4 mr-2" />
            Dışa Aktar (Export)
          </Button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileChange}
            className="hidden"
          />
          
          <Button
            onClick={handleImportClick}
            disabled={importing}
            variant="outline"
            className="border-orange-500 text-orange-600 hover:bg-orange-50 dark:border-orange-600 dark:text-orange-400 dark:hover:bg-orange-900/20"
          >
            <Upload className="w-4 h-4 mr-2" />
            {importing ? "İçe Aktarılıyor..." : "İçe Aktar (Import)"}
          </Button>
        </div>
      </div>

      {/* Yedek Listesi */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Yedek Geçmişi
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {backups.length} adet yedek bulundu
          </p>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              Yükleniyor...
            </div>
          ) : backups.length === 0 ? (
            <div className="text-center py-8">
              <HardDrive className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                Henüz yedek bulunmuyor. "Anlık Yedek Al" butonuna tıklayarak ilk yedeğinizi oluşturun.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {backups.map((backup, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Download className="w-5 h-5 text-green-600 dark:text-green-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {backup.filename}
                      </p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(backup.created_at)}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {backup.size_mb} MB
                        </span>
                        <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 rounded">
                          {backup.year_month}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bilgilendirme */}
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-amber-900 dark:text-amber-300 mb-2">
          Veri Yönetimi Hakkında
        </h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-semibold text-amber-900 dark:text-amber-300 mb-2">Yedekleme:</h4>
            <ul className="text-sm text-amber-800 dark:text-amber-300 space-y-1">
              <li>• Yedekler JSON formatında saklanır</li>
              <li>• YYYY-MM klasör yapısı kullanılır</li>
              <li>• Sunucu üzerinde /app/data/backup/ dizininde</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-amber-900 dark:text-amber-300 mb-2">Export/Import:</h4>
            <ul className="text-sm text-amber-800 dark:text-amber-300 space-y-1">
              <li>• Export: Tüm veriyi bilgisayarınıza indirin</li>
              <li>• Import: Başka yerden veri yükleyin</li>
              <li>• Deduplication: Aynı ID'li kayıtlar atlanır</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VeriYonetimi;
