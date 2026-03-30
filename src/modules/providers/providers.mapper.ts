type ProviderProfileEntity = {
    id: string;
    userId: string;
    brandName: string;
    bio: string | null;
    city: { id: string; name: string; slug: string };
    addressLine: string | null;
    latitude: any;
    longitude: any;
    websiteUrl: string | null;
    instagramUrl: string | null;
    approvalStatus: string;
    approvalSubmittedAt: Date | null;
    approvedAt: Date | null;
    rejectedAt: Date | null;
    rejectionReason: string | null;
    includeInJoyMap: boolean;
};

export const mapProviderProfile = (profile: ProviderProfileEntity) => {
    return {
        id: profile.id,
        userId: profile.userId,
        brandName: profile.brandName,
        bio: profile.bio,
        city: profile.city
            ? {
                id: profile.city.id,
                name: profile.city.name,
                slug: profile.city.slug,
            }
            : null,
        addressLine: profile.addressLine,
        latitude: profile.latitude ? Number(profile.latitude) : null,
        longitude: profile.longitude ? Number(profile.longitude) : null,
        websiteUrl: profile.websiteUrl,
        instagramUrl: profile.instagramUrl,
        approvalStatus: profile.approvalStatus,
        approvalSubmittedAt: profile.approvalSubmittedAt,
        approvedAt: profile.approvedAt,
        rejectedAt: profile.rejectedAt,
        rejectionReason: profile.rejectionReason,
        includeInJoyMap: profile.includeInJoyMap,
    };
};