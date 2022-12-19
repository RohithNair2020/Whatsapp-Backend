//! package imports
import express from 'express';
import mongoose from 'mongoose';

//! Mongoose Model imports
import Messages from './dbMessages.js';

//! db config
const connection_url =
    'mongodb+srv://rohith_nair:whatsapp2022@cluster0.ayl1psy.mongodb.net/?retryWrites=true&w=majority';
mongoose.set('strictQuery', true);
mongoose.connect(connection_url, () => {
    console.log('connected to mongoDB');
});

//! app config
const app = express();

//! middleware
//? This is an important line
app.use(express.json());

//! configure port
const port = process.env.PORT || 8090;
app.listen(port, () => {
    console.log('server up at ', port);
});

//! api ////////////////////////////////////////////////////////////////////////////////
//! api ////////////////////////////////////////////////////////////////////////////////
//! api ////////////////////////////////////////////////////////////////////////////////

//* root
app.get('/', (req, res) => res.status(200).send('Welcome to Whatsapp'));

//* send message
app.post('/api/messages/new', (req, res) => {
    const newMessage = req.body;

    Messages.create(newMessage, (err, data) => {
        if (err) {
            console.log(err);
            res.status(500).send(err);
        } else {
            res.status(201).send(`New message created ${data}`);
        }
    });
});
