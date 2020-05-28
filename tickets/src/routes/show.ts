import mongoose from 'mongoose';
import express, { Request, Response } from 'express';
import { param } from 'express-validator';
import { Ticket } from '../models/ticket';
import { NotFoundError, validateRequest } from '@lrtickets/common';

const router = express.Router();

router.get(
  '/api/tickets/:id',
  [
    param('id')
      .custom((input: string) => mongoose.Types.ObjectId.isValid(input))
      .withMessage('Id must be valid')
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    let ticket = null;
    ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      throw new NotFoundError();
    }
    res.status(200).send(ticket);
  }
);

export { router as showTicketRouter };
