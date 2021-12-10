import { Message } from 'node-nats-streaming';
import { Subjects, Listener, TicketCreatedEvent } from '@ticketshub/commun';
import { Ticket } from '../../models/ticket';
import { queueGropuName } from './queue-group-name';



export class TicketCreatedListener extends Listener<TicketCreatedEvent> {
    subject: Subjects.TicketCreated = Subjects.TicketCreated;//es el canal

    queueGropuName = queueGropuName;//cado los servicios de order  conectaron a este canal y crearon una suscripción, se unieron a este grupo

    //lo del mensaje es algo que nos habla de los datos subyacentes procedentes del servidor de nats
    async onMessage(data: TicketCreatedEvent['data'], msg: Message) {
        const { id, title, price } = data;
        const ticket = await Ticket.buildTicket({
            id,
            title,
            price
        });
        await ticket.save();

        msg.ack();
    }
}