import express, { Request, Response } from 'express';
import {
    RequireAuth,
    NotFounError,
    NotAuthorizedError,
} from '@ticketshub/commun';
import { Order, OrderStatus } from '../models/order';
import { OrderCancelledPublisher } from '../events/publishers/order-cancelled-publisher';
import { natsWrapper } from '../../nats-wrapper';

const router = express.Router();

router.delete(
    '/api/orders/:orderId',
    RequireAuth,
    async (req: Request, res: Response) => {
        const { orderId } = req.params;

        const order = await Order.findById(orderId).populate('ticket');

        if (!order) {
            throw new NotFounError();
        }
        if (order.userId !== req.currentUser!.id) {
            throw new NotAuthorizedError();
        }
        order.status = OrderStatus.Cancelled;
        await order.save();

        //emitir evento 
        await new OrderCancelledPublisher(natsWrapper.getClient).publish({
            id: order.id,
            version: order.version,
            ticket: {
                id: order.ticket.id
            }
        });

        res.status(204).send(order);
    }
);

export { router as deleteOrderRouter };