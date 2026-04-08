import { useState, useEffect, useCallback } from 'react';
import { qrRepository } from '../../data/repositories/qrRepository';

/**
 * useQRCodes — Manages QR code generation and listing for a restaurant.
 *
 * @param {string} restaurantId
 */
export const useQRCodes = (restaurantId) => {
  const [qrs, setQrs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  const fetchQRs = useCallback(async () => {
    if (!restaurantId) return;
    setLoading(true);
    try {
      const data = await qrRepository.getByRestaurant(restaurantId);
      setQrs(data);
    } catch (err) {
      console.error('Error al cargar QRs:', err);
    } finally {
      setLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => {
    fetchQRs();
  }, [fetchQRs]);

  const generate = useCallback(async (tableNumber, label = '') => {
    if (!tableNumber) return;
    setGenerating(true);
    try {
      const newQr = await qrRepository.generate(restaurantId, tableNumber, label);
      setQrs((prev) => [...prev, newQr]);
    } catch (err) {
      console.error('Error al generar QR:', err);
    } finally {
      setGenerating(false);
    }
  }, [restaurantId]);

  const generateBulk = useCallback(async (quantity) => {
    if (!quantity || quantity <= 0) return;
    setGenerating(true);
    try {
      await qrRepository.generateBulk(restaurantId, quantity);
      await fetchQRs(); // Re-cargamos para ver todos los nuevos
    } catch (err) {
      console.error('Error al generar QRs en bloque:', err);
    } finally {
      setGenerating(false);
    }
  }, [restaurantId, fetchQRs]);

  const getImageUrl = useCallback((qrId) => qrRepository.getImageUrl(qrId), []);

  return { qrs, loading, generating, generate, generateBulk, getImageUrl };
};
