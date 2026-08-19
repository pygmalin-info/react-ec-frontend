import { authHandlers } from './auth'
import { cartHandlers } from './cart'
import { categoryHandlers } from './categories'
import { productHandlers } from './products'

export const handlers = [...authHandlers, ...productHandlers, ...categoryHandlers, ...cartHandlers]
