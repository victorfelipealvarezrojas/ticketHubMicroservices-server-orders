import mongoose from 'mongoose';
import { updateIfCurrentPlugin } from 'mongoose-update-if-current';
import { Order, OrderStatus } from './order';

//defino la estructura que tendra el esquema del modelo de ticket
interface TicketAttrs {
    id: string;
    title: string;
    price: number;
}

//interface que describe las propiedades que tendra un documento, es decir un registro de ticket
export interface ticketDocument extends mongoose.Document {
    title: string;
    price: number;
    version: number;
    isReserved(): Promise<Boolean>;
}

//interface que define las propiedades que tiene un modelo de ticket,
//un pequeño método adicional llamado build, que va a tomar un argumento llamado attrs Y de eso, obtendremos un documento de ticket.
export interface TicketModel extends mongoose.Model<ticketDocument> {
    buildTicket(attrs: TicketAttrs): ticketDocument;
    findByEvent(event: { id: string, version: number }): Promise<ticketDocument | null>
}



//defino el esquema que tendra la entidad del ticket
const ticketShema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
}, {
    toJSON: {
        //elimino propiedades que trae por defecto el modelo que maneja mongoose
        transform(doc, ret,) {
            ret.id = ret._id;//elimino _ del id
            delete ret._id;
            //delete ret.__v;
        }
    }
});

ticketShema.set('versionKey', 'version');
ticketShema.plugin(updateIfCurrentPlugin);

ticketShema.statics.findByEvent = (event: { id: string, version: number }) => {
    return Ticket.findOne({
        _id: event.id,
        version: event.version - 1
    });
};

//agrego una nueva funcuin por medio del static al esquema de usuario al cual definire el typado
//Así que esto es lo que nos va a dar el método de construcción en el modelo de orden real
ticketShema.statics.buildTicket = (attrs: TicketAttrs) => {
    //actualizo los datos del esquema asi me aseguro de asignar yo el ID y no moongose de forma automatica
    return new Ticket({
        _id: attrs.id,
        title: attrs.title,
        price: attrs.price
    });
};

//metodo que me permitira definir si el ticket se encuentra reservado o no
ticketShema.methods.isReserved = async function () {
    //El documento que acabamos de llamar está reservado.
    const existingOrder = await Order.findOne({
        ticket: this as any,
        status: {
            $in: [
                //@ts-ignore
                OrderStatus.Created,
                //@ts-ignore
                OrderStatus.AwaitingPayment,
                //@ts-ignore
                OrderStatus.Complete,
            ]
        }
    });
    //Eso esencialmente va a tomar el orden existente, si esa cosa es igual a nula, se volteará a true yb luego false por !!
    return !!existingOrder;
}

//creo el modelo que es lo que me permitira acceder al conjunto de los datos, representa la coleccion de usuarios y me eprmite realizar (CRUD).
const Ticket = mongoose.model<ticketDocument, TicketModel>('Ticket', ticketShema);

export { Ticket };