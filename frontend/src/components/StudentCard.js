import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Award, Edit, Trash2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const StudentCard = ({ student, onUpdate, onEdit, onDelete }) => {
  const navigate = useNavigate();
  const [calculations, setCalculations] = useState(null);

  useEffect(() => {
    fetchCalculations();
  }, [student.id]);

  const fetchCalculations = async () => {
    try {
      const response = await axios.get(`${API}/calculate/${student.id}`);
      setCalculations(response.data);
    } catch (error) {
      console.error("Calculation error:", error);
    }
  };

  if (!calculations) return null;

  const getProgressColor = () => {
    if (calculations.kalan_ders === 0) return "bg-red-500";
    if (calculations.kalan_ders === 1) return "bg-yellow-500";
    return "bg-green-500";
  };

  const getStatusBadge = () => {
    if (calculations.kalan_ders === 0) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          Ödeme Bekleniyor
        </span>
      );
    }
    if (calculations.kalan_ders === 1) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          Ödemesi Yaklaşıyor
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        Devam Ediyor
      </span>
    );
  };

  return (
    <div
      className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md dark:hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] card-hover animate-scale-in relative"
      data-testid={`student-card-${student.id}`}
    >
      {/* Edit & Delete Buttons */}
      {(onEdit || onDelete) && (
        <div className="absolute top-4 right-4 flex items-center space-x-2 z-10">
          {onEdit && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(student, e);
              }}
              className="hover:bg-blue-50 dark:hover:bg-blue-900/20 p-2"
            >
              <Edit className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </Button>
          )}
          {onDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(student, e);
              }}
              className="hover:bg-red-50 dark:hover:bg-red-900/20 p-2"
            >
              <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
            </Button>
          )}
        </div>
      )}

      {/* Header */}
      <div 
        className="flex justify-between items-start mb-4 cursor-pointer"
        onClick={() => navigate(`/students/${student.id}`)}
      >
        <div className="pr-20">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white" data-testid="student-name">{student.ad_soyad}</h3>
          <div className="flex items-center space-x-3 mt-2">
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
              <MapPin className="w-4 h-4 mr-1" />
              {student.konum}
            </div>
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
              <Award className="w-4 h-4 mr-1" />
              {student.seviye}
            </div>
          </div>
        </div>
        {getStatusBadge()}
      </div>

      {/* Remaining Lessons */}
      <div className="mb-3">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300" data-testid="remaining-lessons">
            {calculations.kalan_ders} ders kaldı
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {calculations.yapilan_ders} / {calculations.toplam_ders_kredisi} ders
          </span>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className={`h-2 rounded-full progress-bar ${getProgressColor()}`}
            style={{ width: `${calculations.progress_percentage}%` }}
          ></div>
        </div>
      </div>

      {/* Tariff Info */}
      {calculations.tariff && (
        <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-blue-900 dark:text-blue-300">
              Aylık Tarife
            </span>
            <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
              {new Intl.NumberFormat('tr-TR', {
                style: 'decimal',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              }).format(calculations.tariff.ucret)}₺
            </span>
          </div>
          <div className="text-xs text-blue-700 dark:text-blue-400 mt-1">
            Ayda {calculations.tariff.aylik_ders_sayisi} ders
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="text-xs text-gray-500 dark:text-gray-400 pt-3 border-t border-gray-100 dark:border-gray-700">
        İlk Ders: {new Date(student.ilk_ders_tarihi).toLocaleDateString('tr-TR')}
      </div>
    </div>
  );
};

export default StudentCard;