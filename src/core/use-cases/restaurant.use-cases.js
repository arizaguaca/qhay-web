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
  const { name, phone, description, address, locationType, cuisineType, mallId, link } = formData;
  if (!name || !phone || !description || !address || !locationType || !cuisineType) {
    throw new Error('Todos los campos del restaurante son obligatorios.');
  }

  const ownerId = formData.owner_id ?? formData.ownerId;
  if (!ownerId) {
    throw new Error('Se requiere el ID del propietario.');
  }

  const logoMode = formData.logoMode ?? 'url';
  /** URL del logo: modo URL usa el campo; modo archivo se rellena tras POST /…/logo. */
  const logoUrlFromForm = (formData.logo_url ?? formData.logoUrl ?? '').trim();
  const logoUrl = logoMode === 'url' ? logoUrlFromForm : '';
  const linkTrimmed = (link || '').trim();

  /** Cuerpo alineado con POST /api/v1/restaurants. */
  const restaurant = await restaurantRepository.create({
    name,
    description,
    address,
    phone,
    locationType,
    cuisineType,
    mallId,
    link: linkTrimmed,
    ownerId,
    logoUrl,
  }, logoMode === 'file' ? logoFile : null); // el repositorio lo incluye en el FormData

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
  return await restaurantRepository.update(restaurantId, data, logoFile);
};
