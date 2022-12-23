import mongoose from 'mongoose';

export const messageSchema = mongoose.Schema({
    userId: { type: String },
    message: String,
    name: String,
    timestamp: String,
});

const Message = mongoose.model('message', messageSchema);

export default Message;
