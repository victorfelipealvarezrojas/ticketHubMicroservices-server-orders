import { Publisher, Subjects, OrderCancelledEvent } from "@ticketshub/commun";

export class OrderCancelledPublisher extends Publisher<OrderCancelledEvent> {
    subject: Subjects.OrderCancelled = Subjects.OrderCancelled;
}