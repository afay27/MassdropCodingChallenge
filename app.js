// boilerplate
var express = require('express'),
    app = express(), // express setup
    bodyParser = require('body-parser'),
    http = require("http"),
    https = require("https"), // allows for pulling of webpage data
    redis = require('redis'),
    client = redis.createClient(), // allow access to redis server
    kue = require('kue'), // job queue utility
    queue = kue.createQueue(); 

// allows routes to accept json body text
app.use( bodyParser.json() );       
app.use(bodyParser.urlencoded({     
  extended: true
})); 


// gets current id, a.k.a. number of jobs processed thus far
var reply1 = "";
client.get('id', function(err, reply) {
  if(err || reply === null) { 
    client.set('id', "1");
    reply1 = "1";
  } else {
    reply1 = reply;
  }
})

//**API ROUTES**

//route to accept incoming URL processing requests
app.post('/makeJob', function (req, res) {
  // let user know the job is being processed
  if (req.body.url != null && req.body.url != "") {
    queue.create('request', req.body.url)
    .priority('critical')
    .save();
    
    // associated url with its unique id
    client.set(req.body.url, reply1);
    
    res.send("Thanks! Your job ID is " + reply1 + "\n");
    
    // takes current id (stored as a string), converts to int, appends, and sets id to that new value (sorry this is a bit hacky, but it seemed like an effective method)
    var stringAsInt = parseInt(reply1) + 1;
    reply1 = stringAsInt.toString();
    client.set('id', reply1);
  } else {
    res.send("Sorry, that is not a valid query. Please try again.\n");
  }
})

// route to get current status of job
app.post('/jobStatus', function(req, res) {
  // if job id not in db, return error message and exit
  client.lrange(req.body.id, 0, -1, function(err, reply) {
    if (reply == null || reply == "") {
      res.send("Sorry, that job ID is not in our database. Please try again.\n");
    }
    // if job still processing, return response with processing message
    else if(reply[1] === null) {
      var respond = {
        url : reply[0],
        status: "Job still processing",
        html: "..."
      }
      res.send(respond)
    } 
    // else, return a json with url, status of job (completed), and the html pulled from url
    else {
      var respond = {
        url : reply[0],
        status: "Job completed",
        html: reply[1]
      }
      res.send(respond);
    }
});
})

// **END API ROUTES**

// listen for incoming connections
app.listen(3000, function () {
  console.log('Listening on port 3000')
})

// processes up to 10 jobs as they come in
queue.process('request', 10, function(request, done){
  // stores chunked html data from url
  var htmlContent = "";
  
  // checks whether url is http or https and directs to respective function
  if (request.data[4] == "s") {
    fetchHTTPSURLData(request.data);
  } else {
    fetchHTTPURLData(request.data);
  }
  // standard http(s) request (Note: these probably could be combined into one function)
  function fetchHTTPSURLData(url) {
    https.get(url, function(res){
        res.on('data', function (chunk) {
              htmlContent += chunk;
         });
        res.on('end', function () {
          // pushes a list containing relevant url info into redis db
          client.get(url, function(err, reply) {
            client.rpush([reply, url, htmlContent]);
          });
          done && done();
        });

    });
  }
  function fetchHTTPURLData(url) {
    http.get(url, function(res){
        res.on('data', function (chunk) {
              htmlContent += chunk;
         });
        res.on('end', function () {
          // pushes a list containing relevant info into redis db
          client.get(url, function(err, reply) {
            client.rpush([reply, url, htmlContent]);
          });
          done && done();
        });

    });
  }
});