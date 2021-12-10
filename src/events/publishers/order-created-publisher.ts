import { Publisher, Subjects, OrderCreatedEvent } from "@ticketshub/commun";

export class OrderCreatedPublisher extends Publisher<OrderCreatedEvent> {
    subject: Subjects.OrderCreated = Subjects.OrderCreated;
}
