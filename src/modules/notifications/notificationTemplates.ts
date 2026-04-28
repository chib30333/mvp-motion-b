import { NotificationType } from "@prisma/client";

export const notificationTemplates: Record<
    NotificationType,
    { title: string; message: (ctx: Record<string, string>) => string }
> = {
    [NotificationType.BOOKING_CREATED]: {
        title: "Бронирование создано",
        message: (ctx) => `Ваше бронирование «${ctx.serviceTitle ?? "услуга"}» создано и ожидает оплаты.`,
    },
    [NotificationType.BOOKING_CONFIRMED]: {
        title: "Бронирование подтверждено",
        message: (ctx) => `Бронирование «${ctx.serviceTitle ?? "услуга"}» подтверждено. До встречи!`,
    },
    [NotificationType.BOOKING_CANCELLED]: {
        title: "Бронирование отменено",
        message: (ctx) => `Бронирование «${ctx.serviceTitle ?? "услуга"}» отменено.`,
    },
    [NotificationType.SLOT_UPDATED]: {
        title: "Слот обновлён",
        message: (ctx) => `Слот для «${ctx.serviceTitle ?? "услуга"}» был обновлён.`,
    },
    [NotificationType.PROVIDER_APPROVED]: {
        title: "Профиль одобрен",
        message: () => "Поздравляем! Ваш профиль провайдера одобрен.",
    },
    [NotificationType.PROVIDER_REJECTED]: {
        title: "Профиль отклонён",
        message: (ctx) => `Профиль отклонён. Причина: ${ctx.reason ?? "не указана"}.`,
    },
    [NotificationType.SUBSCRIPTION_ACTIVATED]: {
        title: "Подписка активирована",
        message: () => "Подписка Joy Map успешно активирована.",
    },
    [NotificationType.PAYMENT_SUCCEEDED]: {
        title: "Оплата прошла",
        message: () => "Спасибо! Платёж успешно обработан.",
    },
    [NotificationType.PAYMENT_FAILED]: {
        title: "Ошибка оплаты",
        message: (ctx) => `Платёж не прошёл. Причина: ${ctx.reason ?? "неизвестна"}.`,
    },
    [NotificationType.PROMOTION]: {
        title: "Новая акция",
        message: (ctx) => ctx.message ?? "Свежая акция уже ждёт вас.",
    },
    [NotificationType.SYSTEM]: {
        title: "Системное уведомление",
        message: (ctx) => ctx.message ?? "Системное сообщение.",
    },
};
