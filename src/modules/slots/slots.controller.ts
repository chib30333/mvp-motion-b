import type { Request, Response } from "express";
import * as slotsService from "./slots.service.ts";
import { toProviderSlotDto, toPublicSlotDto } from "./slots.mapper.ts";
import { ValidationError } from "../../core/errors/ValidationError.ts";

export async function createSlot(req: Request, res: Response) {
    const slot = await slotsService.createSlot(req.user!.userId, req.body);
    return res.status(201).json({
        success: true,
        data: toProviderSlotDto(slot),
    });
}

export async function updateSlot(req: Request, res: Response) {
    const slotId = req.params.slotId;

    if (typeof slotId !== "string") {
        throw new ValidationError("Invalid slotId");
    }

    const slot = await slotsService.updateSlot(
        req.user!.userId,
        slotId,
        req.body
    );

    return res.status(200).json({
        success: true,
        data: toProviderSlotDto(slot),
    });
}

export async function cancelSlot(req: Request, res: Response) {
    const slotId = req.params.slotId;

    if (typeof slotId !== "string") {
        throw new ValidationError("Invalid slotId");
    }

    const slot = await slotsService.cancelSlot(req.user!.userId, slotId);

    return res.status(200).json({
        success: true,
        data: toProviderSlotDto(slot),
    });
}

export async function getProviderSlots(req: Request, res: Response) {
    const slots = await slotsService.getProviderSlots(req.user!.userId, req.query);

    return res.status(200).json({
        success: true,
        data: slots.map(toProviderSlotDto),
    });
}

export async function getPublicServiceSlots(req: Request, res: Response) {
    const serviceId = req.params.serviceId;

    if (typeof serviceId !== "string") {
        throw new ValidationError("Invalid ServiceId");
    }

    const slots = await slotsService.getPublicServiceSlots(
        serviceId,
        req.query
    );

    return res.status(200).json({
        success: true,
        data: slots.map(toPublicSlotDto),
    });
}