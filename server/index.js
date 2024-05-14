const express = require('express');
const { client,
        createTables
 } = require('./db');
const app = express();
app.use(express.json());
app.use(require('morgan')('dev'))
require('dotenv').config

const init = async () => {
    await client.connect()
    console.log("connected");
    createTables()
    app.listen(process.env.PORT, console.log(`liseting on port ${process.env.PORT}`))
}

init()