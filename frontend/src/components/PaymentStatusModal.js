import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MapPin, Award } from "lucide-react";

const PaymentStatusModal = ({ isOpen, onClose, students, title, statusColor }) => {
  const navigate = useNavigate();

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('tr-TR').format(amount) + '₺';
  };

  const getStatusBadgeClass = () => {
    if (statusColor === 'red') {
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
    }
    return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto bg-white dark:bg-gray-800" data-testid="payment-status-modal">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-white">{title}</DialogTitle>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {students.length} öğrenci bulundu
          </p>
        </DialogHeader>

        <div className="space-y-3 mt-4">
          {students.map((item) => (
            <div
              key={item.student.id}
              onClick={() => {
                navigate(`/students/${item.student.id}`);
                onClose();
              }}
              className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600 hover:border-[#4d5deb] dark:hover:border-[#4d5deb] cursor-pointer transition-all duration-200 transform hover:scale-[1.01]"
              data-testid={`payment-student-${item.student.id}`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                    {item.student.ad_soyad}
                  </h3>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 mr-1" />
                      {item.student.konum}
                    </div>
                    <div className="flex items-center">
                      <Award className="w-4 h-4 mr-1" />
                      {item.student.seviye}
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass()}`}>
                      Kalan Ders: {item.kalan_ders}
                    </span>
                    <span className="text-sm font-semibold text-[#4d5deb] dark:text-[#6d7dff]">
                      Tarife: {formatCurrency(item.tariff.ucret)}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-sm text-gray-600 dark:text-gray-400">Beklenen Tutar</div>
                  <div className="text-xl font-bold text-gray-900 dark:text-white">
                    {formatCurrency(item.tariff.ucret)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentStatusModal;
