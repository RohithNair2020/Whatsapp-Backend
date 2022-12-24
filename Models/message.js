import mongoose from 'mongoose';

export const messageSchema = mongoose.Schema({
    userId: { type: String },
    message: String,
    timestamp: String,
});

const Message = mongoose.model('message', messageSchema);

export default Message;
