import request from 'supertest';
import mongoose from 'mongoose';
import { app } from '../../app';
import { natsWrapper } from '../../nats-wrapper';
import { Ticket } from '../../models/ticket';

it('returns a 404 if the provided id does not exist', async () => {
  const cookie = global.signin('test@Test.com', '1234');

  const id = mongoose.Types.ObjectId().toHexString();
  await request(app)
    .put(`/api/tickets/${id}`)
    .set('Cookie', cookie)
    .send({
      title: 'asdasd',
      price: 20
    })
    .expect(404);
});

it('returns a 401 if the user is not authenticated', async () => {
  const id = mongoose.Types.ObjectId().toHexString();
  await request(app)
    .put(`/api/tickets/${id}`)
    .send({
      title: 'asdasd',
      price: 20
    })
    .expect(401);
});

it('returns a 401 if the user does not the own the ticket', async () => {
  const cookie1 = global.signin('test@Test.com', '1234');

  const response = await request(app)
    .post(`/api/tickets`)
    .set('Cookie', cookie1)
    .send({
      title: 'title',
      price: 20
    });
  const ticketId = response.body.id;

  const cookie2 = global.signin('test2@Test.com', '1234');
  await request(app)
    .put(`/api/tickets/${ticketId}`)
    .set('Cookie', cookie2)
    .send({
      title: 'asdasd',
      price: 20
    })
    .expect(401);
});

it('returns a 400 if the user provides an invalid title or price', async () => {
  const cookie = global.signin('test@Test.com', '1234');

  const response = await request(app)
    .post(`/api/tickets`)
    .set('Cookie', cookie)
    .send({
      title: 'title',
      price: 20
    });
  const ticketId = response.body.id;

  await request(app)
    .put(`/api/tickets/${ticketId}`)
    .set('Cookie', cookie)
    .send({
      title: '',
      price: 20
    })
    .expect(400);

  await request(app)
    .put(`/api/tickets/${ticketId}`)
    .set('Cookie', cookie)
    .send({
      title: 'asdasdasd',
      price: -2
    })
    .expect(400);
});

it('updates the ticket provided valid inputs', async () => {
  const cookie = global.signin('test@Test.com', '1234');

  const response = await request(app)
    .post(`/api/tickets`)
    .set('Cookie', cookie)
    .send({
      title: 'title',
      price: 20
    });
  const ticketId = response.body.id;

  await request(app)
    .put(`/api/tickets/${ticketId}`)
    .set('Cookie', cookie)
    .send({
      title: 'new Title',
      price: 10
    })
    .expect(200);

  const ticketResponse = await request(app)
    .get(`/api/tickets/${ticketId}`)
    .set('Cookie', cookie)
    .expect(200);

  expect(ticketResponse.body.title).toEqual('new Title');
  expect(ticketResponse.body.price).toEqual(10);
});

it('publishes an event', async () => {
  const cookie = global.signin('test@Test.com', '1234');

  const response = await request(app)
    .post(`/api/tickets`)
    .set('Cookie', cookie)
    .send({
      title: 'title',
      price: 20
    });
  const ticketId = response.body.id;

  jest.clearAllMocks();
  await request(app)
    .put(`/api/tickets/${ticketId}`)
    .set('Cookie', cookie)
    .send({
      title: 'new Title',
      price: 10
    })
    .expect(200);

  expect(natsWrapper.client.publish).toHaveBeenCalled();
});

it('rejects updates if the ticket is reserved', async () => {
  const cookie = global.signin('test@Test.com', '1234');

  const response = await request(app)
    .post(`/api/tickets`)
    .set('Cookie', cookie)
    .send({
      title: 'title',
      price: 20
    });
  const ticketId = response.body.id;

  const createdTicket = await Ticket.findById(ticketId);
  createdTicket!.set({ orderId: mongoose.Types.ObjectId().toHexString() });
  createdTicket!.save();

  await request(app)
    .put(`/api/tickets/${ticketId}`)
    .set('Cookie', cookie)
    .send({
      title: 'new Title',
      price: 10
    })
    .expect(400);
});
