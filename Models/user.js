import mongoose from 'mongoose';

const userSchema = mongoose.Schema({
    // name: String,
    phone: String,
    password: String,
    online: { type: Boolean, default: false },
    stories: { type: [String], default: [] }
});

const User = mongoose.model('user', userSchema);

export default User;
