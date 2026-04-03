import { useState, useEffect, useCallback } from 'react';
import { restaurantRepository } from '../../data/repositories/restaurantRepository';

/**
 * useStaff — Manages staff members for a restaurant.
 *
 * @param {string} restaurantId
 */
export const useStaff = (restaurantId) => {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchStaff = useCallback(async () => {
    if (!restaurantId) return;
    setLoading(true);
    try {
      const data = await restaurantRepository.getStaff(restaurantId);
      // Filter to only show staff belonging to this restaurant
      setStaff(data.filter((m) => m.restaurantId === restaurantId));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  const save = useCallback(async (formData, staffId = null) => {
    setSaving(true);
    try {
      if (staffId) {
        await restaurantRepository.updateStaff(staffId, { ...formData, restaurant_id: restaurantId });
      } else {
        await restaurantRepository.createStaff({ ...formData, restaurant_id: restaurantId });
      }
      await fetchStaff();
    } finally {
      setSaving(false);
    }
  }, [restaurantId, fetchStaff]);

  const remove = useCallback(async (staffId) => {
    await restaurantRepository.deleteStaff(staffId);
    setStaff((prev) => prev.filter((m) => m.id !== staffId));
  }, []);

  return { staff, loading, saving, error, save, remove };
};

/**
 * useOperatingHours — Manages operating hours for a restaurant.
 *
 * @param {string} restaurantId
 */
export const useOperatingHours = (restaurantId) => {
  const [hours, setHours] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!restaurantId) return;
    setLoading(true);
    restaurantRepository.getOperatingHours(restaurantId)
      .then(setHours)
      .finally(() => setLoading(false));
  }, [restaurantId]);

  const save = useCallback(async (updatedHours) => {
    setSaving(true);
    try {
      await restaurantRepository.saveOperatingHours(restaurantId, updatedHours);
      setHours(updatedHours);
    } finally {
      setSaving(false);
    }
  }, [restaurantId]);

  return { hours, loading, saving, save };
};
