'use strict';

const express           = require('express');
const bodyParser        = require('body-parser');
const expect            = require('chai').expect;
const cors              = require('cors');
const helmet            = require('helmet');
const apiRoutes         = require('./routes/api.js');
const fccTestingRoutes  = require('./routes/fcctesting.js');
const runner            = require('./test-runner');
const mongoose          = require('mongoose');
const mongo             = require('mongodb').MongoClient;
require("dotenv").config({ path: "./.env" });
const app = express();

app.use('/public', express.static(process.cwd() + '/public'));
app.use(cors({origin: '*'})); //For FCC testing purposes only
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
/*app.use(helmet.frameguard({action: 'deny'}));
app.use(helmet.dnsPrefetchControl());
app.use(helmet.xssFilter({}));
app.use(helmet.noSniff());
app.use(helmet.contentSecurityPolicy({ directives: { defaultSrc: ["'self'"], scriptSrc: ["'self'"] }} ))
*/

//Connect to mongo with mongoose
mongoose.Promise = global.Promise
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true })
  .catch(({ message }) => {
    console.error(`Unable to connect to the mongodb instance: ${message}`)
  }
)

const db = mongoose.connection
db.on("error", ({ message }) => {
  console.error(`Mongoose default connection error: ${message}`)
})
db.once("open", () => {
  console.info(`Mongoose default connection opened`)
})


//Sample front-end
app.get('/b/:board/', (req, res) => {
  res.sendFile(process.cwd() + '/views/board.html');
});

app.get('/b/:board/:threadid', (req, res) => {
  res.sendFile(process.cwd() + '/views/thread.html');
});

//Index page (static HTML)
app.get('/', (req, res) => {
  res.sendFile(process.cwd() + '/views/index.html');
});

//For FCC testing purposes
fccTestingRoutes(app);

//Routing for API
apiRoutes(app);

//404 Not Found Middleware
app.use(function(req, res, next) {
  res.status(404)
    .type('text')
    .send('Not Found');
});

//Start our server and tests!
app.listen(process.env.PORT || 3000, function () {
  console.log("Listening on port " + process.env.PORT);
  if(process.env.NODE_ENV==='test') {
    console.log('Running Tests...');
    setTimeout(function () {
      try {
        runner.run();
      } catch(e) {
        var error = e;
          console.log('Tests are not valid:');
          console.log(error);
      }
    }, 1500);
  }
});

module.exports = app; //for testing
