import express, { Request, Response } from 'express';
import { body } from 'express-validator';
import {
  requireAuth,
  validateRequest,
  NotFoundError,
  NotAuthorizedError,
  OrderStatus,
  BadRequestError
} from '@lrtickets/common';
import { Order } from '../models/order';
import { stripe } from '../stripe';
import Stripe from 'stripe';
import { Payment } from '../models/payment';
import { PaymentCreatedPublisher } from '../events/publishers/payment-created-publisher';
import { natsWrapper } from '../nats-wrapper';

const router = express.Router();

router.post(
  '/api/payments',
  requireAuth,
  [
    body('token')
      .not()
      .isEmpty()
      .withMessage('Token must be provided'),
    body('orderId')
      .not()
      .isEmpty()
      .withMessage('orderId must be provided')
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    const { token, orderId } = req.body;

    const order = await Order.findById(orderId);

    if (!order) {
      throw new NotFoundError();
    }

    if (order.userId !== req.currentUser!.id) {
      throw new NotAuthorizedError();
    }

    if (order.status === OrderStatus.Cancelled) {
      throw new BadRequestError('Cannot pay for a cancelled order');
    }

    let charge;
    try {
      charge = await stripe.charges.create({
        currency: 'usd',
        amount: order.price * 100, // convert to cents
        source: token
      });
    } catch (err) {
      if (err instanceof Stripe.errors.StripeInvalidRequestError) {
        throw new BadRequestError(err.message);
      }
      throw new Error('Error trying to pay');
    }

    const payment = Payment.build({
      orderId,
      stripeId: charge.id
    });
    await payment.save();
    await new PaymentCreatedPublisher(natsWrapper.client).publish({
      id: payment.id,
      orderId: payment.orderId,
      stripeId: payment.stripeId
    });

    res.status(201).send({ id: payment.id });
  }
);

export { router as createChargeRouter };
