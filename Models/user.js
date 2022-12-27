import mongoose from 'mongoose';

const userSchema = mongoose.Schema({
    phone: { type: String, unique: true, required: true },
    name: { type: String, required: true },
    password: { type: String, required: true },
    contacts: { type: Array, default: [] },
    online: { type: Boolean, default: false },
    stories: { type: [String], default: [] },
});

const User = mongoose.model('user', userSchema);

export default User;
