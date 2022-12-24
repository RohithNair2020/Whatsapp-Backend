/* eslint-disable import/extensions */
//! package imports
import express from 'express';
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

//! app config
const app = express();

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

//! configure port
const port = process.env.PORT || 8090;
app.listen(port, () => {
    console.log('server up at ', port);
});

//! helper functions
// const getTokenFrom = (request) => {
//     console.log('first', request);
//     const authorization = request.get('authorization');
//     console.log('second', authorization);
// };

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
        userId: user._id,
        phone: user.phone,
    };
    const jwtSecretKey = process.env.JWT_SECRET_KEY;
    const token = jwt.sign(dataForToken, jwtSecretKey, {
        expiresIn: 60 * 60,
    });

    return res
        .status(200)
        .send({ token, userId: user.user_id, phone: user.phone });
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
