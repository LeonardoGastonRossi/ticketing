import mongoose from 'mongoose';
import request from 'supertest';
import { app } from '../../app';
import { Ticket } from '../../models/ticket';

it('fetches de order', async () => {
  const cookie = global.signin('test@Test.com', '1234');

  // Create a ticket
  const ticket = Ticket.build({
    id: mongoose.Types.ObjectId().toHexString(),
    title: 'Concert',
    price: 20
  });
  await ticket.save();

  // make a request to build an order with this ticket
  const { body: order } = await request(app)
    .post('/api/orders')
    .set('Cookie', cookie)
    .send({
      ticketId: ticket.id
    })
    .expect(201);

  // make request to fetch the order
  const response = await request(app)
    .get(`/api/orders/${order.id}`)
    .set('Cookie', cookie)
    .expect(200);

  expect(response.body.id).toEqual(order.id);
});

it('returns an error if one user tries to fetch another users order', async () => {
  const cookieOne = global.signin('test@Test.com', '1234');
  const cookieTwo = global.signin('test2@Test.com', '1234');

  // Create a ticket
  const ticket = Ticket.build({
    id: mongoose.Types.ObjectId().toHexString(),
    title: 'Concert',
    price: 20
  });
  await ticket.save();

  // make a request to build an order with this ticket
  const { body: order } = await request(app)
    .post('/api/orders')
    .set('Cookie', cookieOne)
    .send({
      ticketId: ticket.id
    })
    .expect(201);

  // make request to fetch the order
  await request(app)
    .get(`/api/orders/${order.id}`)
    .set('Cookie', cookieTwo)
    .expect(401);
});
