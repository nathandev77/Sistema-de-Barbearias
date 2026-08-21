import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AppointmentService } from '../services/appointmentService';

const appointmentSchema = z.object({
  clientId: z.string(),
  barberId: z.string(),
  serviceIds: z.array(z.string()).min(1),
  date: z.string(), // YYYY-MM-DD
  time: z.string(), // HH:MM
  price: z.number().min(0),
  status: z.enum(['agendado', 'confirmado', 'concluido', 'cancelado']).default('agendado'),
  notes: z.string().optional()
});

const appointmentUpdateSchema = appointmentSchema.partial();

export const createAppointment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = appointmentSchema.parse(req.body);
    const tenantId = req.user!.tenantId;
    
    const appointment = await AppointmentService.createAppointment(data, tenantId);
    res.status(201).json(appointment);
  } catch (error) { 
    next(error); 
  }
};

export const listAppointments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.user!.tenantId;
    const formatted = await AppointmentService.listAppointments(tenantId);
    res.json(formatted);
  } catch (error) { 
    next(error); 
  }
};

export const updateAppointment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params as { id: string };
    const data = appointmentUpdateSchema.parse(req.body);
    const tenantId = req.user!.tenantId;

    const appointment = await AppointmentService.updateAppointment(id, data, tenantId);
    return res.json(appointment);
  } catch (error) { 
    next(error); 
  }
};

export const deleteAppointment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params as { id: string };
    const tenantId = req.user!.tenantId;
    
    const result = await AppointmentService.deleteAppointment(id, tenantId);
    res.json(result);
  } catch (error) { 
    next(error); 
  }
};

export const getAvailableSlots = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { barberId, date } = req.query;
    if (!barberId || typeof barberId !== 'string' || !date || typeof date !== 'string') {
      return res.status(400).json({ error: 'barberId e date são obrigatórios.' });
    }
    
    const tenantId = req.user!.tenantId;

    const availableSlots = await AppointmentService.getAvailableSlots(barberId, date, tenantId);
    res.json(availableSlots);
  } catch (error) {
    next(error);
  }
};
