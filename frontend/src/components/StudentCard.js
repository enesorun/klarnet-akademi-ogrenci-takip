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
      {/* Edit & Delete Buttons - Fixed position top right */}
      {(onEdit || onDelete) && (
        <div className="absolute top-3 right-3 flex items-center space-x-1 z-20 bg-white dark:bg-gray-800 rounded-lg shadow-sm p-1">
          {onEdit && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(student, e);
              }}
              className="hover:bg-blue-50 dark:hover:bg-blue-900/20 p-1.5 h-auto"
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
              className="hover:bg-red-50 dark:hover:bg-red-900/20 p-1.5 h-auto"
            >
              <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
            </Button>
          )}
        </div>
      )}

      {/* Header */}
      <div 
        className="cursor-pointer mb-4"
        onClick={() => navigate(`/students/${student.id}`)}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 pr-16">
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
        </div>
        
        {/* Status Badge */}
        <div className="mb-3">
          {getStatusBadge()}
        </div>
      </div>

      {/* Remaining Lessons */}
      <div 
        className="mb-4 cursor-pointer"
        onClick={() => navigate(`/students/${student.id}`)}
      >
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

      {/* Monthly Payment - Modern Badge Style */}
      {calculations.tariff && (
        <div 
          className="mt-3 cursor-pointer"
          onClick={() => navigate(`/students/${student.id}`)}
        >
          <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 rounded-lg shadow-sm">
            <span className="text-sm font-medium text-white mr-2">Aylık</span>
            <span className="text-lg font-bold text-white">
              {new Intl.NumberFormat('tr-TR', {
                style: 'decimal',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              }).format(calculations.tariff.ucret)}₺
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentCard;