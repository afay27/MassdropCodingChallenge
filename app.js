/*
  Create a job queue whose workers fetch data from a URL and store the results in a database.  The job queue should expose a REST API for adding jobs and checking their status / results.

  Example:

  User submits www.google.com to your endpoint.  The user gets back a job id. Your system fetches www.google.com (the result of which would be HTML) and stores the result.  The user asks for the status of the job id and if the job is complete, he gets a response that includes the HTML for www.google.com
*/
'use strict';

let redisConfig; 

//setup redis-would still work wihtout this probably, but it's good practice
if (process.env.NODE_ENV === 'production') {  
  redisConfig = {
    redis: {
      port: process.env.REDIS_PORT,
      host: process.env.REDIS_HOST,
      auth: process.env.REDIS_PASS,
      options: {
        no_ready_check: false
      }
    }
  };
} else {
  redisConfig = {};
}

//necessary dependencies
var express = require('express')
var bodyParser = require('body-parser')

var app = express(),
    http = require("http"),
    https = require("https"),
    content = "",
    redis = require('redis'),
    client = redis.createClient();
    client.get('id', function(err, reply) {
      if (err || reply === null) {
        client.set('id', '1');
      }
    });
const kue = require('kue'),
      queue = kue.createQueue(redisConfig); 

app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
})); 

//route to accept incoming URL processing requests
var reply1 = "";
client.get('id', function(err, reply) {
      reply1 = reply;
    });

app.post('/makeJob', function (req, res) {
  var job = queue.create('request', req.body.url)
    .priority('critical')
    .save();
  res.send("Thanks! Your job id is " + reply1 + "\n");
  var stringAsInt = parseInt(reply1) + 1;
  var string1 = stringAsInt.toString();
  client.set('id', string1);
  client.get('id', function(err, reply) {
      reply1 = reply;
    });
})

app.post('/jobStatus', function(req, res) {
  client.get(req.body.id, function(err, reply) {
    const respond = {
      url : 'google.com',
      html: reply
    }
    res.send(respond);
  })
})
// listen for incoming connections
app.listen(3000, function () {
  console.log('Listening on port 3000')
})

//job queue created using kue
queue.watchStuckJobs(1000 * 10);

queue.on('ready', () => {  
  console.info('Queue is ready!');
});

queue.on('error', (err) => {  
  console.error('There was an error in the main queue!');
  console.error(err);
  console.error(err.stack);
});


function requestURL(data, done) {  
  queue.create('request', data)
    .priority('critical')
    .save();
}

// Process up to 20 jobs concurrently
queue.process('request', 20, function(request, done){
  if (request.data[4] == "s") {
    fetchHTTPSURLData(request.data);
  } else {
    fetchHTTPURLData(request.data);
  }
  function fetchHTTPSURLData(url) {
    https.get(url, function(res){
        res.on('data', function (chunk) {
              content += chunk;
         });
        res.on('end', function () {
          done && done();
        });

    });
  }
  function fetchHTTPURLData(url) {
    http.get(url, function(res){
        res.on('data', function (chunk) {
              content += chunk;
         });
        res.on('end', function () {
          var curID = parseInt(reply1) - 1;
          var curIDString = curID.toString();
          client.set(curIDString, content);
          done && done();
        });

    });
  }
});

module.exports = {  
  create: (data, done) => {
    requestURL(data, done);
  }
};

/*'use strict';
let redisConfig;  
if (process.env.NODE_ENV === 'production') {  
  redisConfig = {
    redis: {
      port: process.env.REDIS_PORT,
      host: process.env.REDIS_HOST,
      auth: process.env.REDIS_PASS
    }
  };
} else {
  redisConfig = {};
}
var kue = require('kue'), 
    jobs = kue.createQueue();  
var util = require("util"),
    http = require("http"),
    https = require("https");

const router = require('express').Router();

router.post('/', (req, res, next) => {  
  // our future code will go here
});

module.exports = router;  

var url = process.argv[2];
//console.log("got url: " + url);

var job = jobs.create('url_request', {
  name: url
}).priority('high').save();

var content = "";

jobs.process('url_request', function(job, done) {
  if (job.data.name[4] == "s") {
    fetchHTTPSURLData(job.data.name);
  } else {
    fetchHTTPURLData(job.data.name);
  }
  function fetchHTTPSURLData(url) {
    https.get(url, function(res){
       // console.log('Response is ' + res.statusCode);

        res.on('data', function (chunk) {
             // console.log('BODY: ' + chunk);
              content += chunk;
         });

        res.on('end', function () {
           //  console.log(content);
          done && done();
        });

    });
  }
  function fetchHTTPURLData(url) {
    http.get(url, function(res){
       // console.log('Response is ' + res.statusCode);

        res.on('data', function (chunk) {
             // console.log('BODY: ' + chunk);
              content += chunk;
         });

        res.on('end', function () {
           //  console.log(content);
          done && done();
        });

    });
  }
});
job.on('complete', function() {
  console.log("Completed Job:\n\n" + content);
  process.exit(0);
  } 
)
.on('failed', function(errorMessage){
  console.log("job failed");
  }
); */