import mongoose from 'mongoose';
import { updateIfCurrentPlugin } from 'mongoose-update-if-current'
import { OrderStatus } from '@ticketshub/commun';
import { ticketDocument } from './ticket';

export { OrderStatus };

//defino la estructura que tendra el esquema del modelo de Order
interface OrderAttrs {
    userId: string;
    status: OrderStatus;
    expiresAt: Date;
    ticket: ticketDocument;
}

//interface que describe las propiedades que tendra un documento, es decir un registro de usuario
interface orderDocument extends mongoose.Document {
    userId: string;
    status: OrderStatus;
    expiresAt: Date;
    ticket: ticketDocument;
    version: number;
}

//interface que define las propiedades que tiene un modelo de usuario,
//un pequeño método adicional que llamare build que me permitira manejar el tipado en tyupescript.
interface OrderModel extends mongoose.Model<orderDocument> {
    buildOrder(attrs: OrderAttrs): orderDocument;
}

//defino el esquema que tendra la entidad de usuario
const orderShema = new mongoose.Schema({
    userId: {
        type: String,
        required: true
    },
    status: {
        type: String,
        required: true,
        enum: Object.values(OrderStatus),
        default: OrderStatus.Created
    },
    expiresAt: {
        type: mongoose.Schema.Types.Date
    },
    ticket: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Ticket'
    }
}, {
    toJSON: {
        //elimino propiedades que trae por defecto el modelo que maneja mongoose
        transform(doc, ret,) {
            ret.id = ret._id;//elimino _ del id
            delete ret._id;
            delete ret.__v;
        }
    }
});

//para controlar la version del registro
orderShema.set('versionKey', 'version');
orderShema.plugin(updateIfCurrentPlugin);

//agrego una nueva funcion por medio del static al esquema de usuario al cual definire el typado
//Así que esto es lo que nos va a dar el método de construcción en el modelo de orden real
orderShema.statics.buildOrder = (attrs: OrderAttrs) => {
    return new Order(attrs);
};

//creo el modelo que es lo que me permitira acceder al conjunto de los datos, representa la coleccion de usuarios y me eprmite realizar (CRUD).
const Order = mongoose.model<orderDocument, OrderModel>('Order', orderShema);

export { Order };