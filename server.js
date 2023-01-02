/* eslint-disable no-console */
/* eslint-disable import/extensions */
//! package imports
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import asyncHandler from 'express-async-handler';
import mongoose from 'mongoose';
import cors from 'cors';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

//! Mongoose Model imports
import Message from './Models/message.js';
import User from './Models/user.js';
import Chat from './Models/chat.js';
import isUserInContacts from './utils.js';

//! db config
if (process.env.MODE !== 'production') {
    dotenv.config();
}
const connectionUrl = process.env.MONGO_URL;
mongoose.set('strictQuery', true);
mongoose.connect(connectionUrl, () => console.log('connected to Database'));

//! app and socket.io config
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const app = express();
const server = http.createServer(app);
app.use(express.static(`${__dirname}/../../build`));

const io = new Server(server, {
    cors: {
        origin: process.env.CLIENT,
        methods: ['GET', 'POST'],
    },
});

//! middleware
// ? This is an important line
app.use(express.json());
app.use(cors());

//! for password hashing
const saltingRounds = 10;

//! CORS settings - use if you're not using the cors package
// app.use((req, res, next) => {
//     res.setHeader('Access-Control-Allow-Origin', '*');
//     res.setHeader('Access-Control-Allow-Headers', '*');
//     next();
// });

//! socket on connection
io.on('connection', (socket) => {
    console.log('a user connected : ', socket.id);
    socket.on('disconnect', () => {
        console.log('user disconnected');
    });
    socket.on('message_sent', () => {
        io.emit('new_message');
    });
});

//! configure port
const port = process.env.PORT || 8090;
server.listen(port, () => {
    console.log('server up at ', port);
});

const verifyJWT = (req, res, next) => {
    const token = req.headers['x-access-token'];
    if (!token) {
        res.status(401).send('Session timed out');
    } else {
        jwt.verify(token, process.env.JWT_SECRET_KEY, (err, decoded) => {
            if (err) {
                res.status(401).json({
                    auth: true,
                    message: 'authentication failed',
                });
            } else {
                req.userId = decoded.userId;
            }
        });
    }
    next();
};

//! api ////////////////////////////////////////////////////////////////////////////////
//! api ////////////////////////////////////////////////////////////////////////////////
//! api ////////////////////////////////////////////////////////////////////////////////

//* root
app.get('/api/', (req, res) => res.status(200).send('Welcome to Whatsapp'));

//* register user
app.post('/api/register', (req, res) => {
    bcrypt.hash(req.body.password, saltingRounds, (err, hash) => {
        if (err) {
            res.json({ err });
        } else {
            const newUser = new User({
                name: req.body.name,
                phone: req.body.phone,
                password: hash,
            });
            newUser.save((error, response) => {
                if (error) {
                    return res.status(500).json(error);
                }
                return res.status(201).json(response);
            });
        }
    });
});

//* login
app.post('/api/login', async (req, res) => {
    const { phone, password } = req.body;

    const user = await User.findOne({ phone });
    const passwordCorrect =
        user === null ? false : await bcrypt.compare(password, user.password);

    if (!(user && passwordCorrect)) {
        return res.status(401).json({
            error: 'invalid username or password',
        });
    }

    const dataForToken = {
        name: user.name,
        userId: user._id,
        phone: user.phone,
    };
    const jwtSecretKey = process.env.JWT_SECRET_KEY;
    const token = jwt.sign(dataForToken, jwtSecretKey, {
        expiresIn: 60 * 60,
    });

    return res.status(200).send({
        auth: true,
        token,
        name: user.name,
        userId: user._id,
        phone: user.phone,
        contacts: user.contacts,
    });
});

//* fetch users
app.get('/api/users', verifyJWT, async (req, res) => {
    const users = await User.find({}, ['name', 'phone'], {
        skip: 0, // staring row
        limit: 5, // ending row
        sort: {
            phone: -1, // sort by this field
        },
    });
    return res.status(200).send(users);
});

//* fetch single user
app.post('/api/users/user', verifyJWT, async (req, res) => {
    const { phone } = req.body;
    const user = await User.findOne({ phone });
    return res.status(200).json(user);
});

//* fetch contacts
app.post(
    '/api/contacts',
    verifyJWT,
    asyncHandler(async (req, res) => {
        const { contactIDs } = req.body;
        const contacts = await User.find({ _id: { $in: contactIDs } });
        if (contacts) {
            return res.status(200).json(contacts);
        }
        return res.status(500).json({ err: 'could not fetch contacts' });
    }),
);

//* get existing chat
app.get('/api/chat', verifyJWT, async (req, res) => {
    const { senderId, receiverId } = req.body;
    const comparison = senderId.localeCompare(receiverId);
    let chatId;
    if (comparison === 1) {
        chatId = senderId + receiverId;
    } else {
        chatId = receiverId + senderId;
    }
    const chat = await Chat.find({ chatId });
    return res.json(chat);
});

//* fetch messages
app.post('/api/messages', verifyJWT, async (req, res) => {
    const { sender, receiver } = req.body;
    const comparison = sender.localeCompare(receiver);
    let chatId;
    if (comparison === 1) {
        chatId = sender + receiver;
    } else {
        chatId = receiver + sender;
    }
    const chat = await Chat.findOne({ chatId });
    if (chat) {
        return res.status(200).send(chat.messages);
    }
    return res.status(401).send('messages empty');
});

//* send message
app.post(
    '/api/messages/new',
    asyncHandler(async (req, res) => {
        const { sender, receiver, message } = req.body;

        const newMessage = new Message({ sender, receiver, message });

        // construct chatId for query
        const comparison = sender.localeCompare(receiver);
        let chatId;
        if (comparison === 1) {
            chatId = sender + receiver;
        } else {
            chatId = receiver + sender;
        }
        const chat = await Chat.findOne({ chatId });

        // if chat exists already
        if (chat) {
            chat.messages.push(newMessage);
            chat.lastMessage = message;
            chat.save((err, response) => {
                if (err) {
                    return res.status(500).json(err);
                }
                return res.status(201).json({ response });
            });
            // if chat doesn't exist, create new and save message into it
        } else {
            const newChat = new Chat({
                chatId,
                messages: [newMessage],
                lastMessage: newMessage.message,
            });
            newChat.save(async (err, response) => {
                if (err) {
                    return res.status(500).json(err);
                }
                const currentUser = await User.findOne({ _id: sender });
                if (currentUser) {
                    console.log(currentUser.contacts);
                    if (!isUserInContacts(receiver, currentUser.contacts)) {
                        console.log('no error');
                        currentUser.contacts.push(receiver);
                        currentUser.save((error, resp) => {
                            console.log('error');
                            if (err) {
                                return res.send(`contact save error ${error}`);
                            }
                            return res.send(resp);
                        });
                    }
                }
                return res.status(201).json({ response });
            });
        }
    }),
);

//* get messages
app.get('/api/messages/sync', verifyJWT, (req, res) => {
    Message.find((err, data) => {
        if (err) {
            return res.status(500).send(err);
        }
        return res.status(201).send(data);
    });
});
