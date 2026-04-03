import { useState, useEffect, useCallback } from 'react';
import {
  getMenuByRestaurant,
  saveMenuItem,
  deleteMenuItem,
} from '../../core/use-cases/menu.use-cases';

/**
 * useMenu — Manages menu items for a restaurant.
 *
 * @param {import('../../core/repositories/IMenuRepository').IMenuRepository} menuRepository
 * @param {string} restaurantId
 */
export const useMenu = (menuRepository, restaurantId) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchItems = useCallback(async () => {
    if (!restaurantId) return;
    setLoading(true);
    setError('');
    try {
      const data = await getMenuByRestaurant(menuRepository, restaurantId);
      setItems(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [menuRepository, restaurantId]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const save = useCallback(async (formData, imageFile) => {
    setSaving(true);
    try {
      await saveMenuItem(menuRepository, formData, imageFile);
      await fetchItems();
    } finally {
      setSaving(false);
    }
  }, [menuRepository, fetchItems]);

  const remove = useCallback(async (itemId) => {
    await deleteMenuItem(menuRepository, itemId);
    setItems((prev) => prev.filter((i) => i.id !== itemId));
  }, [menuRepository]);

  return { items, loading, saving, error, save, remove, refetch: fetchItems };
};
