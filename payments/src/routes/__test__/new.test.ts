import request from 'supertest';
import mongoose from 'mongoose';
import { app } from '../../app';
import { Order } from '../../models/order';
import { OrderStatus } from '@lrtickets/common';
import { stripe } from '../../stripe';
import { Payment } from '../../models/payment';

// jest.mock('../stripe');

it('returns a 404 when purchasing an order that does not exist', async () => {
  const cookie = global.signin('test@test.com', 'password123');
  await request(app)
    .post('/api/payments')
    .set('Cookie', cookie)
    .send({
      token: 'asdasd',
      orderId: mongoose.Types.ObjectId().toHexString()
    })
    .expect(404);
});

it('returns a 401 when purchasing an order that doesnt belong to the user', async () => {
  const cookie = global.signin('test@test.com', 'password123');

  const order = Order.build({
    id: mongoose.Types.ObjectId().toHexString(),
    userId: mongoose.Types.ObjectId().toHexString(),
    price: 20,
    status: OrderStatus.Created,
    version: 0
  });
  await order.save();

  await request(app)
    .post('/api/payments')
    .set('Cookie', cookie)
    .send({
      token: 'asdasd',
      orderId: order.id
    })
    .expect(401);
});

it('returns 400 when purchasing a cancelled order', async () => {
  const userId = mongoose.Types.ObjectId().toHexString();
  const cookie = global.signin('test@test.com', 'password123', userId);

  const order = Order.build({
    id: mongoose.Types.ObjectId().toHexString(),
    userId: userId,
    price: 20,
    status: OrderStatus.Cancelled,
    version: 0
  });
  await order.save();

  await request(app)
    .post('/api/payments')
    .set('Cookie', cookie)
    .send({
      token: 'asdasd',
      orderId: order.id
    })
    .expect(400);
});

it('returns a 204 with valid inputs', async () => {
  const userId = mongoose.Types.ObjectId().toHexString();
  const cookie = global.signin('test@test.com', 'password123', userId);

  const price = Math.floor(Math.random() * 100000);
  const order = Order.build({
    id: mongoose.Types.ObjectId().toHexString(),
    userId,
    price,
    status: OrderStatus.Created,
    version: 0
  });
  await order.save();

  await request(app)
    .post('/api/payments')
    .set('Cookie', cookie)
    .send({
      token: 'tok_visa',
      orderId: order.id
    })
    .expect(201);

  const stripeCharges = await stripe.charges.list({
    limit: 50
  });
  const stripeCharge = stripeCharges.data.find(
    charge => charge.amount === price * 100
  );

  expect(stripeCharge).toBeDefined();
  expect(stripeCharge!.currency).toEqual('usd');

  const payment = await Payment.findOne({
    orderId: order.id,
    stripeId: stripeCharge!.id
  });

  expect(payment).not.toBeNull();

  /*
  expect(stripe.charges.create).toHaveBeenCalled();

  const chargeOptions = (stripe.charges.create as jest.Mock).mock.calls[0][0];
  expect(chargeOptions.source).toEqual('tok_visa');
  expect(chargeOptions.amount).toEqual(20 * 100);
  expect(chargeOptions.currency).toEqual('usd');
  */
});
