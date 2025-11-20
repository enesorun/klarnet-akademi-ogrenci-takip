import { useState, useEffect } from "react";
import axios from "axios";
import { Plus, DollarSign, Calendar, Trash2 } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const PaymentsTab = ({ studentId, onUpdate }) => {
  const [payments, setPayments] = useState([]);
  const [calculations, setCalculations] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [deletePaymentId, setDeletePaymentId] = useState(null);
  const [formData, setFormData] = useState({
    tarih: new Date().toISOString().split('T')[0],
    tutar: "",
    ders_sayisi: 4,
    not_: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, [studentId]);

  const fetchData = async () => {
    try {
      const [paymentsRes, calcRes] = await Promise.all([
        axios.get(`${API}/payments/${studentId}`),
        axios.get(`${API}/calculate/${studentId}`),
      ]);
      setPayments(paymentsRes.data);
      setCalculations(calcRes.data);
    } catch (error) {
      toast.error("Ödemeler yüklenirken hata oluştu");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await axios.post(`${API}/payments`, {
        ...formData,
        ogrenci_id: studentId,
        tutar: parseFloat(formData.tutar),
      });
      toast.success("Ödeme başarıyla eklendi!");
      setIsAddModalOpen(false);
      setFormData({
        tarih: new Date().toISOString().split('T')[0],
        tutar: "",
        ders_sayisi: 4,
        not_: "",
      });
      fetchData();
      onUpdate();
    } catch (error) {
      toast.error("Ödeme eklenirken hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`${API}/payments/${deletePaymentId}`);
      toast.success("Ödeme silindi");
      setDeletePaymentId(null);
      fetchData();
      onUpdate();
    } catch (error) {
      toast.error("Ödeme silinirken hata oluştu");
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('tr-TR').format(amount) + '₺';
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100" data-testid="payments-tab">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-gray-900">Ödemeler</h3>
        <Button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-[#4d5deb] hover:bg-[#3a4ad4]"
          data-testid="add-payment-button"
        >
          <Plus className="w-4 h-4 mr-2" />
          Ödeme Ekle
        </Button>
      </div>

      {/* Summary */}
      {calculations && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Toplam Ödenen</p>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(calculations.toplam_odenen)}</p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Toplam Ders Kredisi</p>
            <p className="text-2xl font-bold text-gray-900">{calculations.toplam_ders_kredisi}</p>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Kalan Ders</p>
            <p className="text-2xl font-bold text-gray-900">{calculations.kalan_ders}</p>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-1">Son Ödeme</p>
            <p className="text-lg font-bold text-gray-900">
              {calculations.son_odeme ? new Date(calculations.son_odeme.tarih).toLocaleDateString('tr-TR') : '-'}
            </p>
          </div>
        </div>
      )}

      {/* Payments List */}
      {payments.length === 0 ? (
        <div className="text-center py-12">
          <DollarSign className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600">Henüz ödeme kaydı bulunmuyor</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Ödeme Tarihi</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Tutar</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Ders Sayısı</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Not</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Açıklamalar</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr key={payment.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="flex items-center text-sm text-gray-900">
                      <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                      {new Date(payment.tarih).toLocaleDateString('tr-TR')}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm font-semibold text-gray-900">
                    {formatCurrency(payment.tutar)}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-900">{payment.ders_sayisi} ders</td>
                  <td className="py-3 px-4 text-sm text-gray-600">{payment.not_ || '-'}</td>
                  <td className="py-3 px-4 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeletePaymentId(payment.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      data-testid={`delete-payment-${payment.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Payment Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent data-testid="add-payment-modal" className="bg-white dark:bg-gray-800">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-white">Yeni Ödeme Ekle</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div>
              <Label htmlFor="tarih" className="text-gray-700 dark:text-gray-300">Ödeme Tarihi *</Label>
              <Input
                id="tarih"
                type="date"
                value={formData.tarih}
                onChange={(e) => setFormData({ ...formData, tarih: e.target.value })}
                required
                data-testid="payment-date-input"
                className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>

            <div>
              <Label htmlFor="tutar" className="text-gray-700 dark:text-gray-300">Tutar *</Label>
              <Input
                id="tutar"
                type="number"
                step="0.01"
                value={formData.tutar}
                onChange={(e) => setFormData({ ...formData, tutar: e.target.value })}
                required
                data-testid="payment-amount-input"
                className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>

            <div>
              <Label htmlFor="ders_sayisi" className="text-gray-700 dark:text-gray-300">Ders Sayısı *</Label>
              <Input
                id="ders_sayisi"
                type="number"
                value={formData.ders_sayisi}
                onChange={(e) => setFormData({ ...formData, ders_sayisi: parseInt(e.target.value) })}
                required
                data-testid="payment-lessons-input"
                className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>

            <div>
              <Label htmlFor="not_" className="text-gray-700 dark:text-gray-300">Not</Label>
              <Textarea
                id="not_"
                value={formData.not_}
                onChange={(e) => setFormData({ ...formData, not_: e.target.value })}
                rows={2}
                data-testid="payment-note-input"
                className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddModalOpen(false)}
                data-testid="cancel-payment-button"
              >
                İptal
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-[#4d5deb] hover:bg-[#3a4ad4]"
                data-testid="save-payment-button"
              >
                {loading ? "Kaydediliyor..." : "Kaydet"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletePaymentId} onOpenChange={() => setDeletePaymentId(null)}>
        <AlertDialogContent className="dark:bg-gray-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-gray-900 dark:text-white">Ödeme silinsin mi?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600 dark:text-gray-400">
              Bu işlem geri alınamaz. Ödeme kaydı kalıcı olarak silinecektir.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="dark:bg-gray-700 dark:text-white">Vazgeç</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PaymentsTab;