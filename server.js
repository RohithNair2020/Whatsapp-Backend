/* eslint-disable no-console */
/* eslint-disable import/extensions */
//! package imports
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import cors from 'cors';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

//! Mongoose Model imports
import Message from './Models/message.js';
import User from './Models/user.js';

//! db config
dotenv.config();
const connectionUrl = process.env.MONGO_URL;
mongoose.set('strictQuery', true);
mongoose.connect(connectionUrl, () => console.log('connected to Database'));

//! app and socket.io config
const app = express();
const server = http.createServer(app);
// const io = new Server(server, {
//     cors: {
//         origin: 'http://localhost:4000',
//         methods: ['GET', 'POST'],
//     },
// });
const io = new Server(server, {
    cors: {
        origin: 'http://localhost:4000',
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
        console.log('message received');
        io.emit('new_message');
    });
});

//! configure port
const port = process.env.PORT || 8090;
server.listen(port, () => {
    console.log('server up at ', port);
});

//! helper functions
// const getTokenFrom = (request) => {
//     console.log('first', request);
//     const authorization = request.get('authorization');
//     console.log('second', authorization);
// };

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
            console.log(err);
        } else {
            const newUser = new User({
                name: req.body.name,
                phone: req.body.phone,
                password: hash,
            });
            newUser.save((error, response) => {
                if (error) {
                    res.status(500).json(error);
                } else {
                    console.log(response);
                    res.status(201).json(response);
                }
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

// eslint-disable-next-line consistent-return
// app.get('/api/users', async (req, res) => {
//     try {
//         const users = await User.find();
//         users
//             .then((error, response) => {
//                 if (error) {
//                     return res.send(error);
//                 }
//                 return res.status(200).send(response);
//             })
//             .catch((err) => res.send(err));
//     } catch (err) {
//         return res.status(404).json({ err });
//     }
// });

//* fetch messages
app.post('/api/messages', verifyJWT, async (req, res) => {
    const messages = await Message.find({
        sender: {
            $in: [req.body.sender, req.body.receiver],
        },
        receiver: {
            $in: [req.body.sender, req.body.receiver],
        },
    });
    return res.status(200).send(messages);
});

//* send message
app.post('/api/messages/new', (req, res) => {
    const newMessage = req.body;

    Message.create(newMessage, (err, data) => {
        if (err) {
            console.log(err);
            res.status(500).send(err);
        } else {
            res.status(200).send(data);
        }
    });
});

//* get messages
app.get('/api/messages/sync', (req, res) => {
    Message.find((err, data) => {
        if (err) {
            console.log(err);
            return res.status(500).send(err);
        }
        return res.status(201).send(data);
    });
});
