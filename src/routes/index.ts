import express, { Request, Response } from 'express';
import { RequireAuth } from '@ticketshub/commun';
import { Order } from '../models/order';

const router = express.Router();

router.get("/api/orders",
    RequireAuth,
    async (req: Request, res: Response) => {
        const orders = await Order.find({
            userId: req.currentUser!.id
        }).populate('ticket')

        res.send(orders);
    });

export { router as indexOrderRouter };
