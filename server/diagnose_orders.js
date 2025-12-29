import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/greenmark';

async function diagnose() {
    try {
        await mongoose.connect(MONGO_URI);
        const collection = mongoose.connection.collection('orders');
        const orders = await collection.find({}).toArray();

        console.log('--- ALL ORDERS (Relevant Fields) ---');
        orders.forEach(o => {
            console.log(`ID: ${o.order_id}, Status: ${o.status}, Assigned:`, o.assigned_delivery_person, `Type: ${typeof o.assigned_delivery_person}`);
        });

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.connection.close();
    }
}

diagnose();
