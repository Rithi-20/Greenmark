import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const uri = 'mongodb+srv://rithiha:12345@plant.104scqh.mongodb.net/?appName=plant';

const test = async () => {
    try {
        await mongoose.connect(uri);
        const mobileInput = 'prakash@gmail.com';
        const passwordInput = '123456';

        const staff = await mongoose.connection.db.collection('deliveryusers').findOne({
            $or: [{ mobile: mobileInput }, { email: mobileInput }]
        });

        if (!staff) {
            console.log('❌ Staff not found');
        } else {
            const isMatch = await bcrypt.compare(passwordInput, staff.password);
            console.log(`✅ Staff found: ${staff.name}`);
            console.log(`🔑 Password match: ${isMatch}`);
            console.log(`📱 Mobile in DB: ${staff.mobile}`);
            console.log(`📧 Email in DB: ${staff.email}`);
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

test();
