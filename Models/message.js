import mongoose from 'mongoose';

export const messageSchema = mongoose.Schema(
    {
        sender: { type: String },
        receiver: { type: String },
        message: String,
    },
    {
        timestamps: true,
    },
);

const Message = mongoose.model('message', messageSchema);

export default Message;
