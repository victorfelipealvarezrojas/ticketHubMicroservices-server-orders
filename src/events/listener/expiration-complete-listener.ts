import { Message } from 'node-nats-streaming';
import { Subjects, Listener, ExpirationCompleteEvent, OrderStatus } from '@ticketshub/commun';
import { queueGropuName } from './queue-group-name';
import { Order } from '../../models/order';
import { OrderCancelledPublisher } from '../publishers/order-cancelled-publisher';

export class ExpirationCompleteListener extends Listener<ExpirationCompleteEvent> {
    subject: Subjects.ExpirationComplete = Subjects.ExpirationComplete;//es el canal

    queueGropuName = queueGropuName;//cado los servicios de order  conectaron a este canal y crearon una suscripción, se unieron a este grupo

    //lo del mensaje es algo que nos habla de los datos subyacentes procedentes del servidor de nats
    async onMessage(data: ExpirationCompleteEvent['data'], msg: Message) {
        const { orderId } = data;
        const order = await Order.findById(orderId);

        if (!order) throw new Error('Order not found');

        //al momento de expirar si se encuentra completado no emite evento de cancelacion
        if (order.status === OrderStatus.Complete) return msg.ack();

        order.set({
            status: OrderStatus.Cancelled,
            //ticket: null, no es necesario xq lo restablezco desde el modelo
        });

        await order.save();

        //emitir evento de cancelacion de orden
        await new OrderCancelledPublisher(this.client).publish({
            id: order.id,
            version: order.version,
            ticket: {
                id: order.ticket.id
            }
        });

        msg.ack();
    }
}