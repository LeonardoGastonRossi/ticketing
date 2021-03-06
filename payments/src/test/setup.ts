import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';

declare global {
  namespace NodeJS {
    interface Global {
      signin(email: string, password: string, userId?: string): string[];
    }
  }
}

jest.mock('../nats-wrapper');

// This is not good at all, key shouldn't be hardcoded here
process.env.STRIPE_SECRET_KEY = 'sk_test_QsHNPquy1tUh8hbtX5zatKiL00cevBqDLf';

let mongo: any;
beforeAll(async () => {
  process.env.JWT_KEY = 'asdasda';
  mongo = new MongoMemoryServer();
  const mongoUri = await mongo.getUri();

  await mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });
});

beforeEach(async () => {
  jest.clearAllMocks();
  const collections = await mongoose.connection.db.collections();
  for (let collection of collections) {
    await collection.deleteMany({});
  }
});

afterAll(async () => {
  await mongo.stop();
  await mongoose.connection.close();
});

global.signin = (email: string, password: string, userId?: string) => {
  // Build a JWT payload. { id, email }
  const payload = {
    id: userId || mongoose.Types.ObjectId().toHexString(),
    email
  };

  // Create the JWT!
  const token = jwt.sign(payload, process.env.JWT_KEY!);

  // Build a session object
  const session = { jwt: token };

  // Turn that session into JSON
  const sessionJSON = JSON.stringify(session);

  // Take JSON and encode it as base64
  const base64 = Buffer.from(sessionJSON).toString('base64');

  // return a string thats the cookie with the encoded data
  return [`express:sess=${base64}`];
};
