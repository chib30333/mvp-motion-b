import {
  BookingStatus,
  NotificationChannel,
  NotificationStatus,
  PaymentStatus,
  PaymentType,
  ProviderApprovalStatus,
} from "@prisma/client";
import { prisma } from "../../core/db/prisma.ts";
import { PROVIDER_COMMISSION_PERCENT } from "../reference-data/referenceData.data.ts";

const CUSTOMER_ACTIVE_BOOKING_STATUSES: BookingStatus[] = [
  BookingStatus.PENDING_PAYMENT,
  BookingStatus.CONFIRMED,
];

const CUSTOMER_PAST_BOOKING_STATUSES: BookingStatus[] = [
  BookingStatus.CANCELLED,
  BookingStatus.COMPLETED,
  BookingStatus.NO_SHOW,
  BookingStatus.REFUNDED,
];

function startOfDay(date = new Date()) {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
}

function endOfDay(date = new Date()) {
  const value = new Date(date);
  value.setHours(23, 59, 59, 999);
  return value;
}

function addDays(date: Date, days: number) {
  const value = new Date(date);
  value.setDate(value.getDate() + days);
  return value;
}

function toIso(value: Date | null | undefined) {
  return value ? value.toISOString() : null;
}

function sum(values: number[]) {
  return values.reduce((total, item) => total + item, 0);
}

function groupCount<T>(items: T[], getKey: (item: T) => string) {
  const counts = new Map<string, number>();

  for (const item of items) {
    const key = getKey(item);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return [...counts.entries()].map(([key, count]) => ({ key, count }));
}

function toTimelineBooking(booking: any) {
  return {
    id: booking.id,
    status: booking.status,
    createdAt: booking.createdAt.toISOString(),
    startsAt: booking.slot.startsAt.toISOString(),
    endsAt: booking.slot.endsAt.toISOString(),
    location:
      booking.slot.provider.addressLine ??
      booking.slot.provider.city?.name ??
      booking.slot.service.city?.name ??
      null,
    service: {
      id: booking.slot.service.id,
      title: booking.slot.service.title,
      coverImageUrl: booking.slot.service.coverImageUrl ?? null,
      category: booking.slot.service.category?.name ?? null,
    },
    provider: {
      id: booking.slot.provider.id,
      brandName: booking.slot.provider.brandName,
    },
    customer: booking.user
      ? {
          id: booking.user.id,
          name:
            booking.user.fullName ||
            [booking.user.firstName, booking.user.lastName].filter(Boolean).join(" ") ||
            booking.user.email,
          email: booking.user.email,
          phone: booking.user.phone ?? null,
        }
      : null,
    payment: booking.payment
      ? {
          id: booking.payment.id,
          status: booking.payment.status,
          amount: booking.payment.amount,
          currency: booking.payment.currency,
          paidAt: toIso(booking.payment.paidAt),
        }
      : null,
    review: booking.review
      ? {
          rating: booking.review.rating,
          comment: booking.review.comment ?? null,
          createdAt: booking.review.createdAt.toISOString(),
        }
      : null,
  };
}

export const dashboardsService = {
  async getCustomerDashboard(userId: string) {
    const now = new Date();

    const [user, bookings, payments, notifications, currentJoyMap, joyMapHistory] =
      await Promise.all([
        prisma.user.findUnique({
          where: { id: userId },
          include: {
            customerProfile: {
              include: {
                city: true,
                preferences: true,
              },
            },
          },
        }),
        prisma.booking.findMany({
          where: { userId },
          include: {
            slot: {
              include: {
                provider: {
                  include: {
                    city: true,
                  },
                },
                service: {
                  include: {
                    category: true,
                    city: true,
                  },
                },
              },
            },
            payment: true,
            review: true,
          },
          orderBy: { slot: { startsAt: "asc" } },
        }),
        prisma.payment.findMany({
          where: { userId },
          orderBy: { createdAt: "desc" },
          take: 20,
        }),
        prisma.notification.findMany({
          where: { userId },
          orderBy: { createdAt: "desc" },
          take: 10,
        }),
        prisma.joyMap.findFirst({
          where: {
            userId,
            status: "ACTIVE",
          },
          include: {
            items: {
              include: {
                category: true,
                suggestedService: true,
              },
              orderBy: [{ dayOfWeek: "asc" }, { sortOrder: "asc" }],
            },
          },
          orderBy: { weekStart: "desc" },
        }),
        prisma.joyMap.findMany({
          where: { userId },
          include: {
            items: {
              include: {
                category: true,
                suggestedService: true,
              },
              orderBy: [{ dayOfWeek: "asc" }, { sortOrder: "asc" }],
            },
          },
          orderBy: { weekStart: "desc" },
          take: 6,
        }),
      ]);

    const displayName =
      user?.fullName ||
      [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
      user?.email ||
      "Customer";

    const activeBookings = bookings.filter(
      (booking) =>
        CUSTOMER_ACTIVE_BOOKING_STATUSES.includes(booking.status) &&
        booking.slot.startsAt >= now
    );
    const pastBookings = bookings.filter(
      (booking) =>
        CUSTOMER_PAST_BOOKING_STATUSES.includes(booking.status) ||
        booking.slot.startsAt < now
    );
    const upcomingBookings = bookings.filter((booking) => booking.slot.startsAt >= now);
    const walletTransactions = payments.map((payment) => ({
      id: payment.id,
      type: payment.type,
      provider: payment.provider,
      status: payment.status,
      amount: payment.amount,
      currency: payment.currency,
      createdAt: payment.createdAt.toISOString(),
      paidAt: toIso(payment.paidAt),
      refundedAt: toIso(payment.refundedAt),
      failureReason: payment.failureReason ?? null,
    }));
    const walletBalance = sum(
      payments.map((payment) => {
        if (payment.status === PaymentStatus.REFUNDED) return -payment.amount;
        if (payment.status === PaymentStatus.SUCCEEDED && payment.type === PaymentType.BOOKING) {
          return 0;
        }
        return 0;
      })
    );

    return {
      role: "CUSTOMER",
      profile: {
        personalData: {
          id: user?.id ?? userId,
          name: displayName,
          phone: user?.phone ?? null,
          email: user?.email ?? null,
          photo: user?.avatarUrl ?? null,
          city: user?.customerProfile?.city
            ? {
                id: user.customerProfile.city.id,
                name: user.customerProfile.city.name,
                slug: user.customerProfile.city.slug,
              }
            : null,
        },
        activitiesHistory: {
          list: pastBookings.map(toTimelineBooking),
          calendarView: bookings.map((booking) => ({
            bookingId: booking.id,
            status: booking.status,
            startsAt: booking.slot.startsAt.toISOString(),
            endsAt: booking.slot.endsAt.toISOString(),
            title: booking.slot.service.title,
          })),
        },
        wallet: {
          balance: walletBalance,
          currency: payments[0]?.currency ?? "RUB",
          transactionHistory: walletTransactions,
        },
        favorites: {
          savedServices: [],
          savedProviders: [],
          supported: false,
          message: "Favorites storage is not modeled yet. This section is prepared for frontend integration.",
        },
        personalRoadMap: {
          current: currentJoyMap
            ? {
                id: currentJoyMap.id,
                weekStart: currentJoyMap.weekStart.toISOString(),
                generatedAt: currentJoyMap.generatedAt.toISOString(),
                items: currentJoyMap.items.map((item) => ({
                  id: item.id,
                  dayOfWeek: item.dayOfWeek,
                  title: item.title,
                  reason: item.reason,
                  emotionTag: item.emotionTag,
                  category: item.category?.name ?? null,
                  suggestedService: item.suggestedService?.title ?? null,
                })),
              }
            : null,
          history: joyMapHistory.map((map) => ({
            id: map.id,
            weekStart: map.weekStart.toISOString(),
            generatedAt: map.generatedAt.toISOString(),
            itemsCount: map.items.length,
          })),
        },
      },
      bookingsDashboard: {
        activeBookings: activeBookings.map(toTimelineBooking),
        pastBookings: pastBookings.map(toTimelineBooking),
        upcomingBookings: upcomingBookings.map((booking) => ({
          id: booking.id,
          status: booking.status,
          startsAt: booking.slot.startsAt.toISOString(),
          endsAt: booking.slot.endsAt.toISOString(),
          title: booking.slot.service.title,
          provider: booking.slot.provider.brandName,
        })),
      },
      walletAndPayments: {
        topUpMethods: [
          { code: "CARD", label: "Cards", enabled: true },
          { code: "SBER", label: "Sber", enabled: false },
          { code: "WILDBERRIES_PAY", label: "Wildberries Pay", enabled: false },
        ],
        refundRequests: bookings
          .filter((booking) => booking.refundAmount || booking.status === BookingStatus.REFUNDED)
          .map((booking) => ({
            bookingId: booking.id,
            status: booking.status,
            amount: booking.refundAmount ?? booking.payment?.amount ?? 0,
            requestedAt: booking.updatedAt.toISOString(),
            reason: booking.cancellationReason ?? null,
          })),
        transactionHistory: walletTransactions,
      },
      notifications: {
        push: {
          supportedChannels: ["Telegram", "App"],
          enabled: notifications.some(
            (notification) => notification.channel === NotificationChannel.PUSH
          ),
        },
        inAppMessages: notifications.map((notification) => ({
          id: notification.id,
          type: notification.type,
          status: notification.status,
          title: notification.title,
          message: notification.message,
          createdAt: notification.createdAt.toISOString(),
          readAt: toIso(notification.readAt),
        })),
      },
    };
  },

  async getProviderDashboard(userId: string) {
    const todayStart = startOfDay();
    const todayEnd = endOfDay();

    const provider = await prisma.providerProfile.findUnique({
      where: { userId },
      include: {
        user: true,
        city: true,
        services: {
          include: {
            category: true,
            images: {
              orderBy: { sortOrder: "asc" },
            },
            slots: {
              where: {
                startsAt: {
                  gte: todayStart,
                  lte: addDays(todayEnd, 30),
                },
              },
              orderBy: { startsAt: "asc" },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!provider) {
      throw new Error("Provider profile not found");
    }

    const [bookings, reviews, campaigns] = await Promise.all([
      prisma.booking.findMany({
        where: {
          slot: {
            providerId: provider.id,
          },
        },
        include: {
          user: true,
          slot: {
            include: {
              service: {
                include: {
                  category: true,
                },
              },
              provider: {
                include: {
                  city: true,
                },
              },
            },
          },
          payment: true,
          review: true,
        },
        orderBy: { slot: { startsAt: "asc" } },
      }),
      prisma.review.findMany({
        where: { providerId: provider.id },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      prisma.promotionCampaign.findMany({
        where: { createdByUserId: userId },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
    ]);

    const todayBookings = bookings.filter(
      (booking) => booking.slot.startsAt >= todayStart && booking.slot.startsAt <= todayEnd
    );
    const succeededPayments = bookings
      .map((booking) => booking.payment)
      .filter((payment): payment is NonNullable<typeof payment> => Boolean(payment))
      .filter((payment) => payment.status === PaymentStatus.SUCCEEDED);
    const grossRevenue = sum(succeededPayments.map((payment) => payment.amount));
    const commissionAmount = Math.round((grossRevenue * PROVIDER_COMMISSION_PERCENT) / 100);
    const payoutBalance = grossRevenue - commissionAmount;
    const confirmedBookings = bookings.filter(
      (booking) => booking.status === BookingStatus.CONFIRMED || booking.status === BookingStatus.COMPLETED
    );
    const conversionPercent =
      bookings.length > 0 ? Number(((confirmedBookings.length / bookings.length) * 100).toFixed(2)) : 0;
    const topServices = groupCount(
      confirmedBookings,
      (booking) => booking.slot.service.title
    )
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    const peakHours = groupCount(
      confirmedBookings,
      (booking) => booking.slot.startsAt.getHours().toString().padStart(2, "0") + ":00"
    ).sort((a, b) => b.count - a.count);
    const revenueByDay = groupCount(
      succeededPayments,
      (payment) => payment.createdAt.toISOString().slice(0, 10)
    ).map(({ key, count }) => ({
      date: key,
      paymentsCount: count,
      revenueMinor: sum(
        succeededPayments
          .filter((payment) => payment.createdAt.toISOString().slice(0, 10) === key)
          .map((payment) => payment.amount)
      ),
    }));
    const revenueByWeek = groupCount(
      succeededPayments,
      (payment) => {
        const date = payment.createdAt;
        const weekStart = startOfDay(addDays(date, -(date.getDay() || 7) + 1));
        return weekStart.toISOString().slice(0, 10);
      }
    ).map(({ key }) => ({
      periodStart: key,
      revenueMinor: sum(
        succeededPayments
          .filter((payment) => {
            const date = payment.createdAt;
            const weekStart = startOfDay(addDays(date, -(date.getDay() || 7) + 1));
            return weekStart.toISOString().slice(0, 10) === key;
          })
          .map((payment) => payment.amount)
      ),
    }));
    const revenueByMonth = groupCount(
      succeededPayments,
      (payment) => payment.createdAt.toISOString().slice(0, 7)
    ).map(({ key }) => ({
      month: key,
      revenueMinor: sum(
        succeededPayments
          .filter((payment) => payment.createdAt.toISOString().slice(0, 7) === key)
          .map((payment) => payment.amount)
      ),
    }));
    const customerSpend = new Map<string, number>();
    for (const booking of confirmedBookings) {
      if (!booking.userId || !booking.payment || booking.payment.status !== PaymentStatus.SUCCEEDED) {
        continue;
      }

      customerSpend.set(
        booking.userId,
        (customerSpend.get(booking.userId) ?? 0) + booking.payment.amount
      );
    }

    return {
      role: "PROVIDER",
      businessProfile: {
        companyDetails: {
          id: provider.id,
          name: provider.brandName,
          logo: provider.user.avatarUrl ?? null,
          description: provider.bio ?? null,
          address: provider.addressLine ?? null,
          city: provider.city.name,
          websiteUrl: provider.websiteUrl ?? null,
          instagramUrl: provider.instagramUrl ?? null,
          approvalStatus: provider.approvalStatus,
        },
        servicesCatalog: provider.services.map((service) => ({
          id: service.id,
          title: service.title,
          status: service.status,
          category: service.category.name,
          priceAmount: service.priceAmount,
          currency: service.currency,
          durationMinutes: service.durationMinutes,
          imageCount: service.images.length,
        })),
        scheduleAndAvailability: provider.services.flatMap((service) =>
          service.slots.map((slot) => ({
            id: slot.id,
            serviceId: service.id,
            serviceTitle: service.title,
            startsAt: slot.startsAt.toISOString(),
            endsAt: slot.endsAt.toISOString(),
            status: slot.status,
            capacity: slot.capacity,
            bookedCount: slot.bookedCount,
            availableCount: slot.availableCount,
          }))
        ),
        pricing: {
          dynamicPricingRules: {
            supported: false,
            message: "Rule authoring is not modeled yet. Current payload exposes live slot and service prices.",
          },
          priceRange: {
            min:
              provider.services.length > 0
                ? Math.min(...provider.services.map((service) => service.priceAmount))
                : 0,
            max:
              provider.services.length > 0
                ? Math.max(...provider.services.map((service) => service.priceAmount))
                : 0,
            currency: provider.services[0]?.currency ?? "RUB",
          },
        },
        gallery: provider.services.flatMap((service) =>
          service.images.map((image) => ({
            serviceId: service.id,
            serviceTitle: service.title,
            type: "image",
            url: image.imageUrl,
          }))
        ),
        chat: {
          supported: false,
          message: "Post-booking chat is planned in this dashboard contract but not yet backed by a chat module.",
        },
      },
      ordersAndBookings: {
        todayBookings: todayBookings.map(toTimelineBooking),
        calendar: bookings.map((booking) => ({
          bookingId: booking.id,
          startsAt: booking.slot.startsAt.toISOString(),
          endsAt: booking.slot.endsAt.toISOString(),
          status: booking.status,
          customerName:
            booking.user.fullName ||
            [booking.user.firstName, booking.user.lastName].filter(Boolean).join(" ") ||
            booking.user.email,
          serviceTitle: booking.slot.service.title,
        })),
        statusBuckets: {
          confirmed: bookings.filter((booking) => booking.status === BookingStatus.CONFIRMED).length,
          pending: bookings.filter((booking) => booking.status === BookingStatus.PENDING_PAYMENT).length,
          cancelled: bookings.filter((booking) => booking.status === BookingStatus.CANCELLED).length,
        },
        customerDetailsPerBooking: bookings.map((booking) => ({
          bookingId: booking.id,
          customer: {
            id: booking.user.id,
            name:
              booking.user.fullName ||
              [booking.user.firstName, booking.user.lastName].filter(Boolean).join(" ") ||
              booking.user.email,
            email: booking.user.email,
            phone: booking.user.phone ?? null,
          },
          notes: booking.notes ?? null,
          bookingStatus: booking.status,
        })),
      },
      analyticsDashboard: {
        revenueChart: {
          day: revenueByDay,
          week: revenueByWeek,
          month: revenueByMonth,
        },
        bookingsCountAndConversion: {
          bookingsCount: bookings.length,
          confirmedBookingsCount: confirmedBookings.length,
          conversionPercent,
        },
        topServicesAndPeakHours: {
          topServices,
          peakHours,
        },
        customerRetention: {
          repeatCustomersCount: [...customerSpend.values()].filter((amount) => amount > 0).length,
          estimatedLtvMinor:
            customerSpend.size > 0
              ? Math.round(sum([...customerSpend.values()]) / customerSpend.size)
              : 0,
        },
      },
      payouts: {
        balance: payoutBalance,
        withdrawalRequests: [],
        commissionBreakdown: {
          percentage: PROVIDER_COMMISSION_PERCENT,
          grossRevenue,
          commissionAmount,
          netPayoutBalance: payoutBalance,
        },
        paymentHistory: succeededPayments.map((payment) => ({
          id: payment.id,
          amount: payment.amount,
          currency: payment.currency,
          paidAt: toIso(payment.paidAt),
          createdAt: payment.createdAt.toISOString(),
          provider: payment.provider,
        })),
      },
      marketing: {
        promoCodes: campaigns.map((campaign) => ({
          id: campaign.id,
          title: campaign.title,
          audience: campaign.audience,
          isActive: campaign.isActive,
          scheduledAt: toIso(campaign.scheduledAt),
          sentAt: toIso(campaign.sentAt),
        })),
        ratingAndReviews: {
          averageRating: Number(provider.averageRating),
          totalReviews: provider.totalReviews,
          latestReviews: reviews.map((review) => ({
            id: review.id,
            rating: review.rating,
            comment: review.comment ?? null,
            createdAt: review.createdAt.toISOString(),
          })),
        },
      },
    };
  },

  async getAdminDashboard() {
    const today = startOfDay();
    const tomorrow = startOfDay(addDays(today, 1));
    const dayAfterTomorrow = startOfDay(addDays(today, 2));

    const [
      succeededPayments,
      providers,
      bookings,
      customers,
      reviews,
      campaigns,
    ] = await Promise.all([
      prisma.payment.findMany({
        where: { status: PaymentStatus.SUCCEEDED },
        orderBy: { createdAt: "desc" },
      }),
      prisma.providerProfile.findMany({
        include: {
          user: true,
          city: true,
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
      prisma.booking.findMany({
        include: {
          user: true,
          slot: {
            include: {
              provider: true,
              service: true,
            },
          },
          payment: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.user.findMany({
        where: { role: "CUSTOMER" },
        include: {
          payments: true,
          bookings: true,
        },
      }),
      prisma.review.findMany({
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
      prisma.promotionCampaign.findMany({
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
    ]);

    const totalRevenue = sum(succeededPayments.map((payment) => payment.amount));
    const commissionCollected = Math.round((totalRevenue * PROVIDER_COMMISSION_PERCENT) / 100);
    const bookingsToday = bookings.filter(
      (booking) => booking.slot.startsAt >= today && booking.slot.startsAt < tomorrow
    ).length;
    const bookingsTomorrow = bookings.filter(
      (booking) => booking.slot.startsAt >= tomorrow && booking.slot.startsAt < dayAfterTomorrow
    ).length;
    const customerLtv = customers.map((customer) => ({
      id: customer.id,
      name:
        customer.fullName ||
        [customer.firstName, customer.lastName].filter(Boolean).join(" ") ||
        customer.email,
      email: customer.email,
      ltvMinor: sum(
        customer.payments
          .filter((payment) => payment.status === PaymentStatus.SUCCEEDED)
          .map((payment) => payment.amount)
      ),
      refundsCount: customer.payments.filter(
        (payment) => payment.status === PaymentStatus.REFUNDED
      ).length,
    }));
    const vipCustomers = [...customerLtv]
      .sort((a, b) => b.ltvMinor - a.ltvMinor)
      .slice(0, 10);
    const problemCustomers = customerLtv
      .filter((customer) => customer.refundsCount > 0)
      .sort((a, b) => b.refundsCount - a.refundsCount)
      .slice(0, 10);
    const providerFinancials = providers.map((provider) => {
      const providerPayments = bookings
        .filter((booking) => booking.slot.providerId === provider.id)
        .map((booking) => booking.payment)
        .filter((payment): payment is NonNullable<typeof payment> => Boolean(payment))
        .filter((payment) => payment.status === PaymentStatus.SUCCEEDED);

      const gross = sum(providerPayments.map((payment) => payment.amount));
      const commission = Math.round((gross * PROVIDER_COMMISSION_PERCENT) / 100);

      return {
        providerId: provider.id,
        brandName: provider.brandName,
        grossRevenue: gross,
        commission,
        netPayout: gross - commission,
      };
    });

    return {
      role: "ADMIN",
      dashboardOverview: {
        totalRevenue,
        commissionCollected,
        activeProvidersCount: providers.filter(
          (provider) => provider.approvalStatus === ProviderApprovalStatus.APPROVED
        ).length,
        bookingsToday,
        bookingsTomorrow,
        gmv: totalRevenue,
      },
      providersManagement: {
        list: providers.map((provider) => ({
          id: provider.id,
          brandName: provider.brandName,
          status: provider.approvalStatus,
          city: provider.city.name,
          email: provider.user.email,
          rating: Number(provider.averageRating),
          totalBookings: provider.totalBookings,
        })),
        moderation: providers
          .filter((provider) => provider.approvalStatus === ProviderApprovalStatus.PENDING)
          .map((provider) => ({
            id: provider.id,
            brandName: provider.brandName,
            submittedAt: toIso(provider.approvalSubmittedAt),
            city: provider.city.name,
          })),
        financials: providerFinancials,
        ratingAndComplaints: providers.map((provider) => ({
          providerId: provider.id,
          brandName: provider.brandName,
          rating: Number(provider.averageRating),
          complaintsCount: 0,
        })),
      },
      customersManagement: {
        vipCustomers,
        problemCustomers,
        analytics: {
          cacMinor: null,
          averageLtvMinor:
            customerLtv.length > 0
              ? Math.round(sum(customerLtv.map((customer) => customer.ltvMinor)) / customerLtv.length)
              : 0,
        },
      },
      financials: {
        revenueReport: {
          exportFormat: "csv",
          endpoint: "/api/v1/manager/analytics/export/bookings.csv",
        },
        commissionCollected,
        payoutsQueue: providerFinancials
          .filter((provider) => provider.netPayout > 0)
          .sort((a, b) => b.netPayout - a.netPayout),
      },
      contentModeration: {
        reviewsAndPhotos: reviews.map((review) => ({
          id: review.id,
          rating: review.rating,
          comment: review.comment ?? null,
          createdAt: review.createdAt.toISOString(),
        })),
        promoMaterials: campaigns.map((campaign) => ({
          id: campaign.id,
          title: campaign.title,
          audience: campaign.audience,
          isActive: campaign.isActive,
          createdAt: campaign.createdAt.toISOString(),
        })),
      },
      marketingTools: {
        pushCampaigns: campaigns.map((campaign) => ({
          id: campaign.id,
          title: campaign.title,
          audience: campaign.audience,
          sentAt: toIso(campaign.sentAt),
        })),
        promoCodesMassCreation: {
          supported: true,
          source: "promotionCampaigns",
        },
        abTests: {
          supported: false,
          message: "A/B test management is not modeled yet.",
        },
      },
      notificationsQueue: {
        pending: await prisma.notification.count({
          where: { status: NotificationStatus.PENDING },
        }),
        failed: await prisma.notification.count({
          where: { status: NotificationStatus.FAILED },
        }),
      },
    };
  },
};
