import mongoose from 'mongoose';
const uri = 'mongodb+srv://rithiha:12345@plant.104scqh.mongodb.net/?appName=plant';
const check = async () => {
    try {
        await mongoose.connect(uri);
        const saplings = await mongoose.connection.db.collection('saplings').find({}).toArray();
        saplings.forEach(s => {
            if (s.owner) {
                console.log(`Sapling: ${s.sapling_id} | Owner: ${s.owner.toString()}`);
            } else {
                console.log(`Sapling: ${s.sapling_id} | Owner: NONE`);
            }
        });
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};
check();
