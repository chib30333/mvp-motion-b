export function mapProviderServiceListItem(service: any) {
    return {
        id: service.id,
        slug: service.slug,
        title: service.title,
        description: service.description,
        status: service.status,
        emotionTag: service.emotionTag,
        priceAmount: service.priceAmount,
        currency: service.currency,
        durationMinutes: service.durationMinutes,
        capacityDefault: service.capacityDefault,
        coverImageUrl: service.coverImageUrl,
        isFeatured: service.isFeatured,
        category: {
            id: service.category.id,
            name: service.category.name,
            slug: service.category.slug,
        },
        city: {
            id: service.city.id,
            name: service.city.name,
            slug: service.city.slug,
        },
        createdAt: service.createdAt.toISOString(),
        updatedAt: service.updatedAt.toISOString(),
    };
}

export function mapProviderServiceDetail(service: any) {
    return {
        id: service.id,
        slug: service.slug,
        title: service.title,
        description: service.description,
        status: service.status,
        emotionTag: service.emotionTag,
        priceAmount: service.priceAmount,
        currency: service.currency,
        durationMinutes: service.durationMinutes,
        capacityDefault: service.capacityDefault,
        coverImageUrl: service.coverImageUrl,
        isFeatured: service.isFeatured,
        category: {
            id: service.category.id,
            name: service.category.name,
            slug: service.category.slug,
        },
        city: {
            id: service.city.id,
            name: service.city.name,
            slug: service.city.slug,
        },
        images: (service.images ?? []).map((image: any) => ({
            id: image.id,
            imageUrl: image.imageUrl,
            sortOrder: image.sortOrder,
        })),
        createdAt: service.createdAt.toISOString(),
        updatedAt: service.updatedAt.toISOString(),
    };
}

export function mapPublicServiceCard(service: any) {
    return {
        id: service.id,
        slug: service.slug,
        title: service.title,
        description: service.description,
        emotionTag: service.emotionTag,
        priceAmount: service.priceAmount,
        currency: service.currency,
        durationMinutes: service.durationMinutes,
        coverImageUrl: service.coverImageUrl,
        category: {
            id: service.category.id,
            name: service.category.name,
            slug: service.category.slug,
        },
        city: {
            id: service.city.id,
            name: service.city.name,
            slug: service.city.slug,
        },
        provider: {
            id: service.provider.id,
            brandName: service.provider.brandName,
            averageRating: Number(service.provider.averageRating),
            totalReviews: service.provider.totalReviews,
        },
    };
}

export function mapPublicServiceDetail(service: any) {
    return {
        id: service.id,
        slug: service.slug,
        title: service.title,
        description: service.description,
        emotionTag: service.emotionTag,
        priceAmount: service.priceAmount,
        currency: service.currency,
        durationMinutes: service.durationMinutes,
        capacityDefault: service.capacityDefault,
        coverImageUrl: service.coverImageUrl,
        category: {
            id: service.category.id,
            name: service.category.name,
            slug: service.category.slug,
        },
        city: {
            id: service.city.id,
            name: service.city.name,
            slug: service.city.slug,
        },
        provider: {
            id: service.provider.id,
            brandName: service.provider.brandName,
            bio: service.provider.bio,
            averageRating: Number(service.provider.averageRating),
            totalReviews: service.provider.totalReviews,
        },
        images: (service.images ?? []).map((image: any) => ({
            id: image.id,
            imageUrl: image.imageUrl,
            sortOrder: image.sortOrder,
        })),
    };
}