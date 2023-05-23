require('dotenv').config();
const PORT = 3000;
const express = require('express');
const server = express();
const apiRouter = require('./api');
const morgan = require('morgan');
server.use(morgan('dev'));

server.use(express.json())

server.use((req, res, next) => {
  console.log("<____Body Logger START____>");
  console.log(req.body);
  console.log("<_____Body Logger END_____>");

  next();
});

server.use('/api', apiRouter);

server.get('/', (req, res, next) => {
  res.send('Hello, Welcome to our API!');
});

server.get('/background/:color', (req, res, next) => {
  res.send(`
    <body style="background: ${ req.params.color };">
      <h1>Hello World</h1>
    </body>
  `);
});

server.use((error, req, res, next) => {
  console.error(error);
  res.status(error.status || 500).send(error.message || "Internal server error.");
  next();
});

server.listen(PORT, () => {
  console.log('The server is up on port', PORT)
});
