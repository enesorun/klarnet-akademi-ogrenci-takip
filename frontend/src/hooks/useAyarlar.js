import { useState, useEffect } from "react";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const useAyarlar = (kategori) => {
  const [ayarlar, setAyarlar] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAyarlar();
  }, [kategori]);

  const fetchAyarlar = async () => {
    try {
      const response = await axios.get(`${API}/ayarlar`, {
        params: { kategori, aktif: true },
      });
      setAyarlar(response.data);
    } catch (error) {
      console.error(`Ayarlar yüklenemedi (${kategori}):`, error);
      setAyarlar([]);
    } finally {
      setLoading(false);
    }
  };

  return { ayarlar, loading, refresh: fetchAyarlar };
};
