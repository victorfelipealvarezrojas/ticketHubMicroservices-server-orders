import mongoose from 'mongoose';
import request from 'supertest';
import { app } from '../../app';
import { Order } from '../../models/order';
import { Ticket, ticketDocument, TicketModel } from '../../models/ticket';

class creaTicket {
    private title: string;
    private price: number;
    public res: any;

    constructor(title: string, price: number) {
        this.title = title;
        this.price = price;;
    }

    buildTicket = async (): Promise<ticketDocument> => {
        const ticket = Ticket.buildTicket({
            title: this.title,
            price: this.price
        });
        await ticket.save();
        return ticket;
    }
}

it('fetches ordes for an paricular user', async () => {
    const ticketId = new mongoose.Types.ObjectId();

    //crear 3 boletos
    const ticketOne = new creaTicket('concierto one', 2000);
    const ticketOneResponse = await ticketOne.buildTicket();

    const ticketTwo = new creaTicket('concierto two', 2000);
    const ticketTwoResponse = await ticketTwo.buildTicket();

    const ticketThree = new creaTicket('concierto tree', 2000);
    const ticketThreeResponse = await ticketThree.buildTicket();


    const userOne = global.signin();
    const userTwo = global.signin();

    //crear una orden o pedido como usuario #1
    await request(app)
        .post('/api/orders')
        .set('Cookie', userOne)
        .send({ ticketId: ticketOneResponse.id })
        .expect(201);

    //crear dos ordenes o pedidos como usuario #2
    const { body: orderOne } = await request(app)
        .post('/api/orders')
        .set('Cookie', userTwo)
        .send({ ticketId: ticketTwoResponse.id })
        .expect(201);

    const { body: orderTwo } = await request(app)
        .post('/api/orders')
        .set('Cookie', userTwo)
        .send({ ticketId: ticketThreeResponse.id })
        .expect(201);

    //solicitudes al usuario #2 y luego, cuando obtengamos esa lista de pedidos
    const response = await request(app)
        .get('/api/orders')
        .set('Cookie', userTwo)
        .expect(200)

    //asegurarnos de que solo obtuvimos los pedidos para el usuario #2
    expect(response.body.length).toEqual(2);
    expect(response.body[0].id).toEqual(orderOne.id);
    expect(response.body[1].id).toEqual(orderTwo.id);

});