
'use strict'
const express = require('express');
const cors = require('cors');

const port = 5000;

const app = express();
app.use(cors());

app.use(require('./routes'));

app.use(express.static(__dirname + '/public'));

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`)
});

