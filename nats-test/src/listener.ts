import nats, { Message, Stan } from 'node-nats-streaming';
import { randomBytes } from 'crypto';

console.clear();
const client = nats.connect('ticketing', randomBytes(4).toString('hex'), {
  url: 'http://localhost:4222'
});

client.on('connect', () => {
  console.log('Listener connected to NATS');

  client.on('close', () => {
    console.log('NATS connection closed');
    process.exit();
  });

  const options = client
    .subscriptionOptions()
    .setManualAckMode(true)
    .setDeliverAllAvailable() // very first time of the microservice I need to get all of them
    .setDurableName('order-service'); // if the durable name already exists, it's gonna emmit the all available and returns only the not processed

  const subscription = client.subscribe(
    'ticket:created',
    'order-service-queue-group', // we need a queue name to have durable name working (if not, every time I restarts the listener, I still will get all the messages again)
    options
  );
  subscription.on('message', (msg: Message) => {
    const data = msg.getData();

    if (typeof data === 'string') {
      console.log(`Receive event #${msg.getSequence()}, with data ${data}`);
    }

    msg.ack();
  });
});

process.on('SIGINT', () => client.close());
process.on('SIGTERM', () => client.close());
