/**
 * getRestaurantsByOwner — Use case: loads all restaurants for a given owner.
 *
 * @param {import('../repositories/IRestaurantRepository').IRestaurantRepository} restaurantRepository
 * @param {string} ownerId
 * @returns {Promise<import('../entities/Restaurant').Restaurant[]>}
 */
export const getRestaurantsByOwner = (restaurantRepository, ownerId) => {
  if (!ownerId) throw new Error('Se requiere el ID del propietario.');
  return restaurantRepository.getByOwner(ownerId);
};

/**
 * getRestaurantById — Use case: loads a single restaurant.
 *
 * @param {import('../repositories/IRestaurantRepository').IRestaurantRepository} restaurantRepository
 * @param {string} restaurantId
 * @returns {Promise<import('../entities/Restaurant').Restaurant>}
 */
export const getRestaurantById = (restaurantRepository, restaurantId) => {
  if (!restaurantId) throw new Error('Se requiere el ID del restaurante.');
  return restaurantRepository.getById(restaurantId);
};

/**
 * createRestaurant — Use case: registers a new restaurant, optionally uploading a logo file.
 *
 * @param {import('../repositories/IRestaurantRepository').IRestaurantRepository} restaurantRepository
 * @param {Object} formData
 * @param {File | null} logoFile
 * @returns {Promise<import('../entities/Restaurant').Restaurant>}
 */
export const createRestaurant = async (restaurantRepository, formData, logoFile = null) => {
  const { name, phone, description, address } = formData;
  if (!name || !phone || !description || !address) {
    throw new Error('Todos los campos del restaurante son obligatorios.');
  }

  const restaurant = await restaurantRepository.create({
    ...formData,
    logo_url: formData.logoMode === 'url' ? formData.logo_url : '',
  });

  if (formData.logoMode === 'file' && logoFile && restaurant.id) {
    await restaurantRepository.uploadLogo(restaurant.id, logoFile);
  }

  return restaurant;
};

/**
 * updateRestaurant — Use case: updates restaurant info and optionally re-uploads logo.
 *
 * @param {import('../repositories/IRestaurantRepository').IRestaurantRepository} restaurantRepository
 * @param {string} restaurantId
 * @param {Object} data
 * @param {File | null} logoFile
 * @returns {Promise<import('../entities/Restaurant').Restaurant>}
 */
export const updateRestaurant = async (restaurantRepository, restaurantId, data, logoFile = null) => {
  const updated = await restaurantRepository.update(restaurantId, data);
  if (logoFile) {
    await restaurantRepository.uploadLogo(restaurantId, logoFile);
  }
  return updated;
};
