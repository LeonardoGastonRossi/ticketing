import request from 'supertest';
import { app } from '../../app';

const createTicket = (cookie: string[], title: string, price: number) => {
  return request(app)
    .post('/api/tickets')
    .set('Cookie', cookie)
    .send({
      title: 'a title',
      price: 20
    });
};
it('can fetch a list of tickets', async () => {
  const cookie = global.signin('test@Test.com', '1234');

  await createTicket(cookie, 'A title', 20);
  await createTicket(cookie, 'A title', 20);
  await createTicket(cookie, 'A title', 20);

  const response = await request(app)
    .get('/api/tickets')
    .send({})
    .expect(200);

  expect(response.body.length).toEqual(3);
});
