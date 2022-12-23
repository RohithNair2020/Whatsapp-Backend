import mongoose from 'mongoose';
import { messageSchema } from './message';

const chatSchema = mongoose.Schema({
    chatId: { type: String, unique: true },
    messages: [messageSchema],
    lastMessage: messageSchema,
});

const Chat = mongoose.model('chat', chatSchema);

export default Chat;
