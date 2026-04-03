/**
 * getMenuByRestaurant — Use case: fetches all menu items for a restaurant.
 *
 * @param {import('../repositories/IMenuRepository').IMenuRepository} menuRepository
 * @param {string} restaurantId
 * @returns {Promise<import('../entities/MenuItem').MenuItem[]>}
 */
export const getMenuByRestaurant = (menuRepository, restaurantId) => {
  if (!restaurantId) throw new Error('Se requiere el ID del restaurante.');
  return menuRepository.getByRestaurant(restaurantId);
};

/**
 * saveMenuItem — Use case: creates or updates a menu item, optionally uploading an image.
 *
 * @param {import('../repositories/IMenuRepository').IMenuRepository} menuRepository
 * @param {Object} formData
 * @param {File | null} imageFile
 * @returns {Promise<import('../entities/MenuItem').MenuItem>}
 */
export const saveMenuItem = async (menuRepository, formData, imageFile = null) => {
  const isEditing = Boolean(formData.id);

  const payload = {
    ...formData,
    price: formData.price === '' ? 0 : parseFloat(formData.price),
    prep_time: formData.prep_time === '' ? 0 : parseInt(formData.prep_time),
  };

  const item = isEditing
    ? await menuRepository.update(formData.id, payload)
    : await menuRepository.create(payload);

  if (imageFile && item.id) {
    await menuRepository.uploadImage(item.id, imageFile);
  }

  return item;
};

/**
 * deleteMenuItem — Use case: deletes a menu item by ID.
 *
 * @param {import('../repositories/IMenuRepository').IMenuRepository} menuRepository
 * @param {string} itemId
 * @returns {Promise<void>}
 */
export const deleteMenuItem = (menuRepository, itemId) => {
  if (!itemId) throw new Error('Se requiere el ID del plato.');
  return menuRepository.delete(itemId);
};
