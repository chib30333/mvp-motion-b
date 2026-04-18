import { prisma } from "../../core/db/prisma.ts";
import {
  emotionMetadata,
  referenceCategoryTaxonomy,
  referenceCategories,
  referenceCities,
  referenceSmartFilterCombos,
  referenceSubscriptionPlans,
} from "./referenceData.data.ts";

export const referenceDataService = {
  async getReferenceData() {
    const [categories, cities, subscriptionPlans] = await Promise.all([
      prisma.category.findMany({
        where: { isActive: true },
        orderBy: { name: "asc" },
      }),
      prisma.city.findMany({
        where: { isActive: true },
        orderBy: { name: "asc" },
      }),
      prisma.subscriptionPlan.findMany({
        where: { isActive: true },
        orderBy: { priceAmount: "asc" },
      }),
    ]);

    return {
      categories:
        categories.length > 0 ? categories : referenceCategories.map((category) => ({ ...category })),
      cities: cities.length > 0 ? cities : referenceCities.map((city) => ({ ...city })),
      emotionTags: emotionMetadata,
      categoryTaxonomy: referenceCategoryTaxonomy,
      smartFilterCombos: referenceSmartFilterCombos,
      subscriptionPlans:
        subscriptionPlans.length > 0
          ? subscriptionPlans.map((plan) => ({
              ...plan,
              paymentProviders:
                referenceSubscriptionPlans.find((candidate) => candidate.code === plan.code)
                  ?.paymentProviders ?? [],
            }))
          : referenceSubscriptionPlans.map((plan) => ({ ...plan })),
    };
  },
};
