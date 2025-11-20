import { useState, useEffect } from "react";
import axios from "axios";
import { Plus, Star, Calendar, Clock, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const LessonsTab = ({ studentId, onUpdate }) => {
  const [lessons, setLessons] = useState([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    tarih: new Date().toISOString().split('T')[0],
    sure: 50,
    islenen_konu: "",
    odev_not: "",
    onemli: false,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchLessons();
  }, [studentId]);

  const fetchLessons = async () => {
    try {
      const response = await axios.get(`${API}/lessons/${studentId}`);
      setLessons(response.data);
    } catch (error) {
      toast.error("Dersler yüklenirken hata oluştu");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await axios.post(`${API}/lessons`, {
        ...formData,
        ogrenci_id: studentId,
      });
      toast.success("Ders başarıyla eklendi!");
      setIsAddModalOpen(false);
      setFormData({
        tarih: new Date().toISOString().split('T')[0],
        sure: 50,
        islenen_konu: "",
        odev_not: "",
        onemli: false,
      });
      fetchLessons();
      onUpdate();
    } catch (error) {
      toast.error("Ders eklenirken hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  // Group lessons in 4s
  const groupLessons = () => {
    const groups = [];
    for (let i = 0; i < lessons.length; i += 4) {
      groups.push(lessons.slice(i, i + 4));
    }
    return groups;
  };

  const groupedLessons = groupLessons();

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100" data-testid="lessons-tab">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-gray-900">Dersler</h3>
        <Button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-[#4d5deb] hover:bg-[#3a4ad4]"
          data-testid="add-lesson-button"
        >
          <Plus className="w-4 h-4 mr-2" />
          Ders Ekle
        </Button>
      </div>

      {lessons.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600">Henüz ders kaydı bulunmuyor</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Son Ders */}
          {lessons.length > 0 && (
            <div className="border border-gray-200 rounded-lg p-4 bg-blue-50" data-testid="last-lesson">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-gray-600" />
                  <span className="font-semibold text-gray-900">
                    {new Date(lessons[0].tarih).toLocaleDateString('tr-TR')}
                  </span>
                  {lessons[0].onemli && <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Clock className="w-4 h-4 mr-1" />
                  {lessons[0].sure} dk
                </div>
              </div>
              <div className="text-sm text-gray-900 mb-2">
                <span className="font-medium">İşlenen Konu:</span> {lessons[0].islenen_konu}
              </div>
              {lessons[0].odev_not && (
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Ödev/Not:</span> {lessons[0].odev_not}
                </div>
              )}
            </div>
          )}

          {/* Grouped Lessons */}
          <Accordion type="single" collapsible className="space-y-2">
            {groupedLessons.map((group, groupIndex) => {
              if (groupIndex === 0 && group.length === 1) return null; // Skip if first group is just last lesson
              
              const startIndex = groupIndex === 0 ? 1 : groupIndex * 4;
              const actualGroup = groupIndex === 0 ? group.slice(1) : group;
              
              if (actualGroup.length === 0) return null;

              return (
                <AccordionItem
                  key={groupIndex}
                  value={`group-${groupIndex}`}
                  className="border border-gray-200 rounded-lg px-4"
                >
                  <AccordionTrigger className="hover:no-underline">
                    <span className="font-medium text-gray-900">
                      {groupIndex === 0 ? "Son 4 Ders" : `Önceki 4 Ders (${startIndex + 1}-${startIndex + actualGroup.length})`}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3 pt-2">
                      {actualGroup.map((lesson) => (
                        <div key={lesson.id} className="border-l-2 border-gray-300 pl-4 py-2">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <Calendar className="w-4 h-4 text-gray-600" />
                              <span className="font-medium text-gray-900">
                                {new Date(lesson.tarih).toLocaleDateString('tr-TR')}
                              </span>
                              {lesson.onemli && <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />}
                            </div>
                            <div className="flex items-center text-sm text-gray-600">
                              <Clock className="w-4 h-4 mr-1" />
                              {lesson.sure} dk
                            </div>
                          </div>
                          <div className="text-sm text-gray-900 mb-1">
                            <span className="font-medium">İşlenen Konu:</span> {lesson.islenen_konu}
                          </div>
                          {lesson.odev_not && (
                            <div className="text-sm text-gray-600">
                              <span className="font-medium">Ödev/Not:</span> {lesson.odev_not}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </div>
      )}

      {/* Add Lesson Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent data-testid="add-lesson-modal" className="bg-white dark:bg-gray-800">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-white">Yeni Ders Ekle</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div>
              <Label htmlFor="tarih" className="text-gray-700 dark:text-gray-300">Tarih *</Label>
              <Input
                id="tarih"
                type="date"
                value={formData.tarih}
                onChange={(e) => setFormData({ ...formData, tarih: e.target.value })}
                required
                data-testid="lesson-date-input"
                className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>

            <div>
              <Label htmlFor="sure" className="text-gray-700 dark:text-gray-300">Süre (dakika) *</Label>
              <Input
                id="sure"
                type="number"
                value={formData.sure}
                onChange={(e) => setFormData({ ...formData, sure: parseInt(e.target.value) })}
                required
                data-testid="lesson-duration-input"
                className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>

            <div>
              <Label htmlFor="islenen_konu" className="text-gray-700 dark:text-gray-300">Bu derste ne işlendi? *</Label>
              <Textarea
                id="islenen_konu"
                value={formData.islenen_konu}
                onChange={(e) => setFormData({ ...formData, islenen_konu: e.target.value })}
                required
                rows={3}
                data-testid="lesson-topic-input"
                className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>

            <div>
              <Label htmlFor="odev_not" className="text-gray-700 dark:text-gray-300">Ödev / Not</Label>
              <Textarea
                id="odev_not"
                value={formData.odev_not}
                onChange={(e) => setFormData({ ...formData, odev_not: e.target.value })}
                rows={2}
                data-testid="lesson-homework-input"
                className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="onemli"
                checked={formData.onemli}
                onCheckedChange={(checked) => setFormData({ ...formData, onemli: checked })}
                data-testid="lesson-important-checkbox"
              />
              <Label htmlFor="onemli" className="cursor-pointer text-gray-700 dark:text-gray-300">Önemli Ders</Label>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddModalOpen(false)}
                data-testid="cancel-lesson-button"
              >
                İptal
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-[#4d5deb] hover:bg-[#3a4ad4]"
                data-testid="save-lesson-button"
              >
                {loading ? "Kaydediliyor..." : "Kaydet"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LessonsTab;