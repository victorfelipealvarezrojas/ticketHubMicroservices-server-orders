import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';

declare global {
    function signin(): string[];
}

//va el nombre del archivo a falsificar
jest.mock('../../nats-wrapper');

let mongo: MongoMemoryServer;
//se ejecuta antes que todas las pruebas
beforeAll(async () => {
    process.env.JWT_KEY = 'variabledeentornodepruebaylaproductivaestaenunsecretodentrodelpoddek8s';

    mongo = await MongoMemoryServer.create();
    const mongoUri = await mongo.getUri();

    await mongoose.connect(mongoUri, {
        //useNewUrlParser:true
    });
});

//para restablecer la base de datos
beforeEach(async () => {
    jest.clearAllMocks();
    const collections = await mongoose.connection.db.collections();

    for (let item of collections) {
        await item.deleteMany({});
    }
});

//detener ese servidor de memoria Mongo DB y también le vamos a decir a MongoMemoryServer que se desconecte de mongo
afterAll(async () => {
    await mongo.stop();
    await mongoose.connection.close();
});

////@ts-ignor
global.signin = () => {
    // Build a JWT payload.  { id, email }
    const payload = {
        id: new mongoose.Types.ObjectId().toHexString(),
        email: 'test@test.com',
    }



    // Create the JWT!
    const token = jwt.sign(payload, process.env.JWT_KEY!);

    // Build session Object. { jwt: MY_JWT }
    const session = { jwt: token }

    // Turn that session into JSON
    const sessionJSON = JSON.stringify(session);

    // Take JSON and encode it as base64
    const base64 = Buffer.from(sessionJSON).toString('base64');

    // return a string thats the cookie with the encoded data
    return [`express:sess=${base64}`];

};