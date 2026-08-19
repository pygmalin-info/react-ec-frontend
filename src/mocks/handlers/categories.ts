import { http, HttpResponse } from 'msw'
import { env } from '@/shared/config/env'
import { db } from '../db'

export const categoryHandlers = [
  http.get(`${env.apiBaseUrl}/categories`, () => HttpResponse.json({ items: db.categories })),
]
