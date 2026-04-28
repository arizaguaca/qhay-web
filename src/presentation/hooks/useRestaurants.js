import { useState, useEffect, useCallback } from 'react';
import {
  getRestaurantsByOwner,
  getRestaurantById,
  createRestaurant,
  updateRestaurant,
} from '../../core/use-cases/restaurant.use-cases';

/**
 * useRestaurants — Manages owner's restaurant list and creation.
 *
 * @param {import('../../core/repositories/IRestaurantRepository').IRestaurantRepository} restaurantRepository
 * @param {string | null} userId
 */
export const useRestaurants = (restaurantRepository, userId) => {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchRestaurants = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError('');
    try {
      const data = await getRestaurantsByOwner(restaurantRepository, userId);
      setRestaurants(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [restaurantRepository, userId]);

  useEffect(() => {
    fetchRestaurants();
  }, [fetchRestaurants]);

  const create = useCallback(async (formData, logoFile) => {
    const newRestaurant = await createRestaurant(restaurantRepository, formData, logoFile);
    await fetchRestaurants();
    return newRestaurant;
  }, [restaurantRepository, fetchRestaurants]);

  return { restaurants, loading, error, refetch: fetchRestaurants, create };
};

/**
 * useRestaurant — Loads a single restaurant by ID (for staff auto-redirect).
 *
 * @param {import('../../core/repositories/IRestaurantRepository').IRestaurantRepository} restaurantRepository
 * @param {string | null} restaurantId
 */
export const useRestaurant = (restaurantRepository, restaurantId) => {
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!restaurantId) return;
    setLoading(true);
    getRestaurantById(restaurantRepository, restaurantId)
      .then(setRestaurant)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [restaurantRepository, restaurantId]);

  const update = useCallback(async (data, logoFile) => {
    const updated = await updateRestaurant(restaurantRepository, restaurantId, data, logoFile);
    setRestaurant(updated);
    return updated;
  }, [restaurantRepository, restaurantId]);

  return { restaurant, loading, error, update };
};
