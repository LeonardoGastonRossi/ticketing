import mongoose from 'mongoose';
import express, { Request, Response } from 'express';
import {
  requireAuth,
  NotFoundError,
  NotAuthorizedError
} from '@lrtickets/common';
import { param } from 'express-validator';
import { Order } from '../models/order';
const router = express.Router();

router.get(
  '/api/orders/:orderId',
  requireAuth,
  [
    param('orderId')
      .custom((input: string) => mongoose.Types.ObjectId.isValid(input))
      .withMessage('OrderId must be valid')
  ],
  async (req: Request, res: Response) => {
    const { orderId } = req.params;
    const order = await Order.findById(orderId).populate('ticket');
    if (!order) {
      throw new NotFoundError();
    }
    if (order.userId !== req.currentUser!.id) {
      throw new NotAuthorizedError();
    }
    res.send(order);
  }
);

export { router as showOrderRouter };
