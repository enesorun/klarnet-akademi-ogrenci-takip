import { useState, useEffect } from "react";
import axios from "axios";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import StudentCard from "@/components/StudentCard";
import { Users } from "lucide-react";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AllStudents = () => {
  const [aktifStudents, setAktifStudents] = useState([]);
  const [araVerdiStudents, setAraVerdiStudents] = useState([]);
  const [eskiStudents, setEskiStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const [aktif, araVerdi, eski] = await Promise.all([
        axios.get(`${API}/students?status=aktif`),
        axios.get(`${API}/students?status=ara_verdi`),
        axios.get(`${API}/students?status=eski`),
      ]);
      setAktifStudents(aktif.data);
      setAraVerdiStudents(araVerdi.data);
      setEskiStudents(eski.data);
    } catch (error) {
      toast.error("Veriler yüklenirken hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg text-gray-600">Yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900" data-testid="all-students-title">Tüm Öğrenciler</h1>
        <p className="text-gray-600 mt-1">Öğrencileri kategorilere göre görüntüleyin</p>
      </div>

      <Accordion type="multiple" defaultValue={["aktif"]} className="space-y-4">
        {/* Aktif Öğrenciler */}
        <AccordionItem
          value="aktif"
          className="bg-white rounded-xl border border-gray-200 px-6 overflow-hidden"
          data-testid="accordion-active"
        >
          <AccordionTrigger className="hover:no-underline py-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Users className="w-5 h-5 text-green-600" />
              </div>
              <div className="text-left">
                <h3 className="text-lg font-bold text-gray-900">
                  Aktif Öğrenciler
                </h3>
                <p className="text-sm text-gray-600">{aktifStudents.length} öğrenci</p>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-6">
            {aktifStudents.length === 0 ? (
              <p className="text-center text-gray-500 py-8">Aktif öğrenci bulunmuyor</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                {aktifStudents.map((student) => (
                  <StudentCard key={student.id} student={student} onUpdate={fetchStudents} />
                ))}
              </div>
            )}
          </AccordionContent>
        </AccordionItem>

        {/* Ara Verdi */}
        <AccordionItem
          value="ara_verdi"
          className="bg-white rounded-xl border border-gray-200 px-6 overflow-hidden"
          data-testid="accordion-paused"
        >
          <AccordionTrigger className="hover:no-underline py-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Users className="w-5 h-5 text-yellow-600" />
              </div>
              <div className="text-left">
                <h3 className="text-lg font-bold text-gray-900">Ara Verdi</h3>
                <p className="text-sm text-gray-600">{araVerdiStudents.length} öğrenci</p>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-6">
            {araVerdiStudents.length === 0 ? (
              <p className="text-center text-gray-500 py-8">Ara veren öğrenci bulunmuyor</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                {araVerdiStudents.map((student) => (
                  <StudentCard key={student.id} student={student} onUpdate={fetchStudents} />
                ))}
              </div>
            )}
          </AccordionContent>
        </AccordionItem>

        {/* Eski Öğrenci */}
        <AccordionItem
          value="eski"
          className="bg-white rounded-xl border border-gray-200 px-6 overflow-hidden"
          data-testid="accordion-former"
        >
          <AccordionTrigger className="hover:no-underline py-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Users className="w-5 h-5 text-gray-600" />
              </div>
              <div className="text-left">
                <h3 className="text-lg font-bold text-gray-900">Eski Öğrenci</h3>
                <p className="text-sm text-gray-600">{eskiStudents.length} öğrenci</p>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-6">
            {eskiStudents.length === 0 ? (
              <p className="text-center text-gray-500 py-8">Eski öğrenci bulunmuyor</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                {eskiStudents.map((student) => (
                  <StudentCard key={student.id} student={student} onUpdate={fetchStudents} />
                ))}
              </div>
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

export default AllStudents;