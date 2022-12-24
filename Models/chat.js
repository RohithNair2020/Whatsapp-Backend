import mongoose from 'mongoose';
import { messageSchema } from './message';

const chatSchema = mongoose.Schema({
    chatId: { type: String, unique: true },
    messages: [messageSchema],
    lastMessage: String
});

const Chat = mongoose.model('chat', chatSchema);

export default Chat;
