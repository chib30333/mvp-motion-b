import { UserRole } from "@prisma/client";
import { prisma } from "../../core/db/prisma.ts";
import { BadRequestError } from "../../core/errors/BadRequestError.ts";
import { ForbiddenError } from "../../core/errors/ForbiddenError.ts";
import { NotFoundError } from "../../core/errors/NotFoundError.ts";

type RegisterProviderDocumentInput = {
    userId: string;
    role: UserRole;
    fileUrl: string;
    fileName: string;
    mimeType?: string;
};

export const uploadsService = {
    async registerProviderDocument(input: RegisterProviderDocumentInput) {
        if (input.role !== UserRole.PROVIDER) {
            throw new ForbiddenError("Only providers can upload provider documents");
        }

        const profile = await prisma.providerProfile.findUnique({
            where: { userId: input.userId },
        });

        if (!profile) {
            throw new NotFoundError("Provider profile not found");
        }

        if (!input.fileUrl.startsWith("http")) {
            throw new BadRequestError("fileUrl must be an absolute URL");
        }

        return prisma.providerDocument.create({
            data: {
                providerId: profile.id,
                fileUrl: input.fileUrl,
                fileName: input.fileName,
                mimeType: input.mimeType ?? null,
            },
        });
    },

    async listMyProviderDocuments(userId: string, role: UserRole) {
        if (role !== UserRole.PROVIDER) {
            throw new ForbiddenError("Only providers can view their documents");
        }

        const profile = await prisma.providerProfile.findUnique({
            where: { userId },
        });

        if (!profile) return [];

        return prisma.providerDocument.findMany({
            where: { providerId: profile.id },
            orderBy: { uploadedAt: "desc" },
        });
    },
};
