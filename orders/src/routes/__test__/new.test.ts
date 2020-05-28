import mongoose from 'mongoose';
import request from 'supertest';
import { app } from '../../app';
import { Ticket } from '../../models/ticket';
import { Order, OrderStatus } from '../../models/order';
import { natsWrapper } from '../../nats-wrapper';

// we are not going to do all kind of tests, like checking user auth or body parsing, just for time saving

it('returns an error if the ticket does not exist', async () => {
  const ticketId = mongoose.Types.ObjectId();
  const cookie = global.signin('test@Test.com', '1234');

  await request(app)
    .post('/api/orders')
    .set('Cookie', cookie)
    .send({
      ticketId
    })
    .expect(404);
});

it('returns an error if the ticket is already reserved', async () => {
  const cookie = global.signin('test@Test.com', '1234');

  const ticket = Ticket.build({
    id: mongoose.Types.ObjectId().toHexString(),
    title: 'Title',
    price: 20
  });
  await ticket.save();
  const order = Order.build({
    ticket,
    userId: '123asdaasd',
    status: OrderStatus.Created,
    expiresAt: new Date()
  });
  await order.save();

  await request(app)
    .post('/api/orders')
    .set('Cookie', cookie)
    .send({
      ticketId: ticket.id
    })
    .expect(400);
});

it('reserves a ticket', async () => {
  const cookie = global.signin('test@Test.com', '1234');

  const title = 'Title';
  const price = 20;
  const ticket = Ticket.build({
    id: mongoose.Types.ObjectId().toHexString(),
    title,
    price
  });
  await ticket.save();

  const response = await request(app)
    .post('/api/orders')
    .set('Cookie', cookie)
    .send({
      ticketId: ticket.id
    })
    .expect(201);

  expect(response.body.ticket.title).toEqual(title);
  expect(response.body.ticket.price).toEqual(price);
});

it('emits an order creatd event', async () => {
  const cookie = global.signin('test@Test.com', '1234');

  const title = 'Title';
  const price = 20;
  const ticket = Ticket.build({
    id: mongoose.Types.ObjectId().toHexString(),
    title,
    price
  });
  await ticket.save();

  const response = await request(app)
    .post('/api/orders')
    .set('Cookie', cookie)
    .send({
      ticketId: ticket.id
    })
    .expect(201);

  expect(natsWrapper.client.publish).toHaveBeenCalled();
});
