import mongoose from 'mongoose';
// eslint-disable-next-line import/extensions
import { messageSchema } from './message.js';

const chatSchema = mongoose.Schema({
    chatId: { type: String, unique: true },
    messages: [messageSchema],
    lastMessage: String,
});

const Chat = mongoose.model('chat', chatSchema);

export default Chat;
