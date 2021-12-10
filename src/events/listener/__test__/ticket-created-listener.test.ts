import { Message } from 'node-nats-streaming';
import moongose from 'mongoose';
import { TicketCreatedEvent } from '@ticketshub/commun';
import { TicketCreatedListener } from "../ticket-created-listener";
import { natsWrapper } from "../../../nats-wrapper";
import { Ticket } from '../../../models/ticket';

const setup = async () => {
    //crear una instancia del oyente
    const listener = new TicketCreatedListener(natsWrapper.getClient);
    //crear datos falsos para el evento
    const data: TicketCreatedEvent['data'] = {
        id: new moongose.Types.ObjectId().toHexString(),
        version: 0,
        title: 'concert',
        price: 2000,
        userId: new moongose.Types.ObjectId().toHexString(),
    }

    //vabricar también un objeto de mensaje falso
    //@ts-ignore
    const msg: Message = {
        ack: jest.fn()
    }

    return { listener, data, msg }
}

it('create and saves a tickets', async () => {
    const { listener, data, msg } = await setup();
    //llamar a la funcioin del mensaje 
    listener.onMessage(data, msg);
    //me aseguro de crear que el ticket exista
    const ticket = await Ticket.findById(data.id);
    expect(ticket).toBeDefined();
    expect(ticket!.title).toEqual(data.title);
    expect(ticket!.price).toEqual(data.price);
});

it('asks the message', async () => {
    //llamar a la funcioin del mensaje 

    //afirmaciones correctas para asegurar que funciona
});