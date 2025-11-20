import { useState, useEffect } from "react";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const useOzelAlanlar = (modelTipi) => {
  const [ozelAlanlar, setOzelAlanlar] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOzelAlanlar = async () => {
      try {
        const response = await axios.get(`${API}/ozel-alanlar`, {
          params: {
            model_tipi: modelTipi,
            aktif: true,
          },
        });
        setOzelAlanlar(response.data);
      } catch (error) {
        console.error("Özel alanlar yüklenirken hata:", error);
        setOzelAlanlar([]);
      } finally {
        setLoading(false);
      }
    };

    if (modelTipi) {
      fetchOzelAlanlar();
    }
  }, [modelTipi]);

  return { ozelAlanlar, loading };
};
