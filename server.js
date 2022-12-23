//! package imports
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

//! Mongoose Model imports
import Message from './Models/message.js';
import User from './Models/user.js';

//! db config
dotenv.config();
const connection_url = process.env.MONGO_URL;
mongoose.set('strictQuery', true);
mongoose.connect(connection_url, () => console.log('connected to Database'));

//! app config
const app = express();

//! middleware
//? This is an important line
app.use(express.json());
app.use(cors());

//! for password hashing
const saltingRounds = 10;
const hashPassword = async (password) => {
    bcrypt.hash(password, saltingRounds, (err, hash) => {
        if (err) {
            console.log(err);
        } else {
            return hash;
        }
    });
};

const checkPassword = (userPassword, dbPassword) => {
    bcrypt.compare(userPassword, dbPassword, (err, result) => {
        if (err) {
            return err;
        }
        return result;
    });
};

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
                password: hash
            });
            newUser.save((err, response) => {
                if (err) {
                    res.status(500).send(err);
                } else {
                    console.log(response);
                    res.status(201).send(response);
                }
            });
        }
    });
});

//* login
app.post('/api/login', (req, res) => {
    const userQuery = User.where({ phone: req.body.phone });
    userQuery.findOne((err, response) => {
        if (err) {
            res.status(500).send(err);
        } else {
            // res.status(200).send(response);
            bcrypt.compare(
                req.body.password,
                response.password,
                (err, result) => {
                    if (err) {
                        res.status(500).send(err);
                    } else {
                        if (result === true) {
                            res.status(200).send(response);
                        } else {
                            res.status(200).send('password not found');
                        }
                    }
                }
            );
        }
    });
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
            res.status(500).send(err);
        } else {
            res.status(201).send(data);
        }
    });
});
