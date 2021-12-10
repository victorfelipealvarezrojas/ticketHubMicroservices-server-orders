import { Message } from 'node-nats-streaming';
import { Subjects, Listener, TicketUpdatedEvent } from '@ticketshub/commun';
import { Ticket } from '../../models/ticket';
import { queueGropuName } from './queue-group-name';



export class TicketUpdatedListener extends Listener<TicketUpdatedEvent> {
    subject: Subjects.TicketUpdate = Subjects.TicketUpdate;//es el canal

    queueGropuName = queueGropuName;//cado los servicios de order  conectaron a este canal y crearon una suscripción, se unieron a este grupo

    //lo del mensaje es algo que nos habla de los datos subyacentes procedentes del servidor de nats
    async onMessage(data: TicketUpdatedEvent['data'], msg: Message) {
        const { id, title, price } = data;

        //maneja la version del registro que llega desde la nats emitida desde ticketpyt
        const ticket = await Ticket.findByEvent(data);

        if (!ticket) throw new Error('Ticket Not Found');

        ticket.set({ title, price });
        await ticket.save();

        msg.ack();
    }
}