import { Calendar, TrendingUp, UserCheck } from "lucide-react";

const TimelineTab = ({ student, tariffs }) => {
  const events = [];

  // İlk ders
  events.push({
    date: student.ilk_ders_tarihi,
    type: "first_lesson",
    title: "İlk Ders",
    description: `${student.ad_soyad} ile ilk ders gerçekleştirildi`,
    icon: Calendar,
    color: "blue",
  });

  // Tarife değişiklikleri
  tariffs.forEach((tariff, index) => {
    if (index > 0) {
      events.push({
        date: tariff.baslangic_tarihi,
        type: "tariff_change",
        title: "Tarife Güncellendi",
        description: `Yeni tarife: ${tariff.aylik_ders_sayisi} ders - ${new Intl.NumberFormat('tr-TR').format(tariff.ucret)}₺`,
        icon: TrendingUp,
        color: "purple",
      });
    }
  });

  // Durum değişikliklerini simule ediyoruz (gerçek implementasyonda ayrı bir koleksiyon olabilir)
  if (student.genel_durum === "ara_verdi") {
    events.push({
      date: new Date().toISOString(),
      type: "status_change",
      title: "Ara Verdi",
      description: "Öğrenci derslere ara verdi",
      icon: UserCheck,
      color: "yellow",
    });
  } else if (student.genel_durum === "eski") {
    events.push({
      date: new Date().toISOString(),
      type: "status_change",
      title: "Ders Bıraktı",
      description: "Öğrenci dersleri bıraktı",
      icon: UserCheck,
      color: "gray",
    });
  }

  // Tarihe göre sırala
  events.sort((a, b) => new Date(b.date) - new Date(a.date));

  const getColorClasses = (color) => {
    const colors = {
      blue: "bg-blue-100 text-blue-600 border-blue-200",
      purple: "bg-purple-100 text-purple-600 border-purple-200",
      yellow: "bg-yellow-100 text-yellow-600 border-yellow-200",
      gray: "bg-gray-100 text-gray-600 border-gray-200",
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100" data-testid="timeline-tab">
      <h3 className="text-lg font-bold text-gray-900 mb-6">Zaman Çizelgesi</h3>

      <div className="relative">
        {/* Timeline Line */}
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200"></div>

        {/* Events */}
        <div className="space-y-6">
          {events.map((event, index) => (
            <div key={index} className="relative flex items-start space-x-4">
              {/* Icon */}
              <div className={`relative z-10 flex items-center justify-center w-12 h-12 rounded-full border-2 ${getColorClasses(event.color)}`}>
                <event.icon className="w-5 h-5" />
              </div>

              {/* Content */}
              <div className="flex-1 bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold text-gray-900">{event.title}</h4>
                  <span className="text-sm text-gray-500">
                    {new Date(event.date).toLocaleDateString('tr-TR')}
                  </span>
                </div>
                <p className="text-sm text-gray-600">{event.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {events.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600">Henüz olay kaydı bulunmuyor</p>
        </div>
      )}
    </div>
  );
};

export default TimelineTab;