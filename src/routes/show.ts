import express, { Request, Response } from 'express';
import { NotAuthorizedError, NotFounError, RequireAuth } from '@ticketshub/commun';
import { Order } from '../models/order';


const router = express.Router();

router.get("/api/orders/:orderId",
    RequireAuth,
    async (req: Request, res: Response) => {
        const orders = await Order.findById(req.params.orderId).populate('ticket')
        if (!orders) throw new NotFounError();
        if (orders.userId !== req.currentUser!.id) throw new NotAuthorizedError();

        res.send(orders);
    });

export { router as showOrderRouter };