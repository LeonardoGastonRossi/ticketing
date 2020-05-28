import nats from 'node-nats-streaming';

console.clear();

const client = nats.connect('ticketing', 'abcaaa', {
  url: 'http://localhost:4222'
});

client.on('connect', () => {
  console.log('Publisher connected to NATS');

  const message = JSON.stringify({
    id: '123',
    title: 'concert',
    price: 20
  });

  client.publish('ticket:created', message, () => {
    console.log('Event published');
  });
});
