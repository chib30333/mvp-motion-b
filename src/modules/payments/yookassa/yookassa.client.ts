// src/modules/payments/yookassa/yookassa.client.ts
import axios from 'axios';
import { env } from '../../../config/env.ts';

export const yookassaClient = axios.create({
    baseURL: 'https://api.yookassa.ru/v3',
    auth: {
        username: env.YOOKASSA_SHOP_ID,
        password: env.YOOKASSA_SECRET_KEY,
    },
    headers: {
        'Content-Type': 'application/json',
    },
});