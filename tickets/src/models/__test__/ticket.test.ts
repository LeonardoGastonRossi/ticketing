import { Ticket } from '../ticket';
import { isUnaryExpression } from '@babel/types';
import { TicketCreatedPublisher } from '../../events/publishers/ticket-created-publisher';

it('implements optimistic currency control', async done => {
  // Create an instance of a ticket
  const ticket = Ticket.build({
    title: 'concert',
    price: 5,
    userId: '123'
  });

  // Save the ticket to the database
  await ticket.save();

  // fetch the ticket twice
  const firstInstance = await Ticket.findById(ticket.id);
  const secondInstnace = await Ticket.findById(ticket.id);

  // make twos eparate changes to the tickets we fetched
  firstInstance!.set({ price: 10 });
  secondInstnace!.set({ price: 15 });

  // save the first fetched ticket
  await firstInstance!.save();

  // save the second fetched ticket
  try {
    await secondInstnace!.save();
  } catch (err) {
    return done();
  }

  throw new Error('Should not reach this point');
});

it('increments the version number on multiple saves', async () => {
  const ticket = Ticket.build({
    title: 'concert',
    price: 5,
    userId: '123'
  });
  await ticket.save();
  expect(ticket.version).toEqual(0);

  await ticket.save();
  expect(ticket.version).toEqual(1);

  await ticket.save();
  expect(ticket.version).toEqual(2);
});
