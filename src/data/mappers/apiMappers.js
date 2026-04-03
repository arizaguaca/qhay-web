import { createUser } from '../../core/entities/User';
import { createRestaurant } from '../../core/entities/Restaurant';
import { createMenuItem } from '../../core/entities/MenuItem';
import { createOrder } from '../../core/entities/Order';
import { createCustomer } from '../../core/entities/Customer';
import { createQRCode } from '../../core/entities/QRCode';

/** @param {Object} raw @returns {import('../../core/entities/User').User} */
export const mapUser = (raw) => createUser(raw);

/** @param {Object} raw @returns {import('../../core/entities/Restaurant').Restaurant} */
export const mapRestaurant = (raw) => createRestaurant(raw);

/** @param {Object} raw @returns {import('../../core/entities/MenuItem').MenuItem} */
export const mapMenuItem = (raw) => createMenuItem(raw);

/** @param {Object} raw @returns {import('../../core/entities/Order').Order} */
export const mapOrder = (raw) => createOrder(raw);

/** @param {Object} raw @returns {import('../../core/entities/Customer').Customer} */
export const mapCustomer = (raw) => createCustomer(raw);

/** @param {Object} raw @returns {import('../../core/entities/QRCode').QRCode} */
export const mapQRCode = (raw) => createQRCode(raw);
