import mongoose from 'mongoose';

const messageSchema = mongoose.Schema({
    userId: Number,
    message: String,
    name: String,
    timestamp: String,
});

export default mongoose.model('message', messageSchema);
