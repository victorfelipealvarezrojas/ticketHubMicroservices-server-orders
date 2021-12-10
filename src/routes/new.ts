import moongose from 'mongoose';
import express, { Request, Response } from 'express';
import { body } from 'express-validator';
import { NotFounError, RequireAuth, ValidateRequest, BadRequestError } from "@ticketshub/commun";
import { Ticket } from '../models/ticket';
import { Order } from '../models/order';
import { OrderStatus } from '@ticketshub/commun/build/events/types/order-status';
import { natsWrapper } from "../../nats-wrapper";
import { OrderCreatedPublisher } from '../events/publishers/order-created-publisher';

const router = express.Router();

const EPIRATION_WINDOWS_SECOND = 15 * 60;

router.post("/api/orders",
    RequireAuth,
    [
        body('ticketId')
            .not()
            .isEmpty()
            .custom((input: string) => moongose.Types.ObjectId.isValid(input))
            .withMessage('ticketId is required'),
    ],
    ValidateRequest, async (req: Request, res: Response) => {
        const { ticketId } = req.body;

        //encontrar el ticket que el usuario está tratando de ordenar en la base de datos
        const ticket = await Ticket.findById(ticketId);

        if (!ticket) throw new NotFounError();

        //ticket.isReserved() verificar que el ticket no se encuentra reservado
        //ticket.isReserved() realizar consulta para encoentrar el ticket dentyro de las orders y que el estado no sea cancelado y si se encuentra una order con este ticket es xq esta reservado
        //y no se puede volver a comprar
        const isReserver = await ticket.isReserved();
        if (isReserver) throw new BadRequestError('Ticket is already reserved');

        //Calcule una fecha de vencimiento para este pedido
        const expiration = new Date();
        expiration.setSeconds(expiration.getSeconds() + EPIRATION_WINDOWS_SECOND);

        //finalmente continúe y construya el pedido y guárdelo en la base de datos
        //buildOrder dentro del essquema me permite tener al ayuda del tipado aqui
        const order = Order.buildOrder({
            userId: req.currentUser!.id, //Ya estamos haciendo una comprobación para asegurarnos de que el usuario actual está definido dentro de RequireAuth
            status: OrderStatus.Created,
            expiresAt: expiration,
            ticket: ticket,
        });
        await order.save();

        //publicar un evento diciendo que se creó un pedido y recordar la publicación de un evento o la creación de un nuevo evento
        await new OrderCreatedPublisher(natsWrapper.getClient).publish({
            id: order.id,
            version: order.version,
            status: order.status,
            userId: order.userId,
            expirateAt: order.expiresAt.toISOString(),
            ticket: {
                id: ticket.id,
                price: ticket.price,
            },
        });

        res.status(201).send(order);

    });

export { router as newOrderRouter };