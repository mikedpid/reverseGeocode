const express = require('express');
const config = require('./config');
const app = express();
const port = process.env.PORT || 3000;

let apiRoute = require('./routes/api')
app.use(apiRoute)

app.listen(port, () => console.log(`App listening on port ${port}`))