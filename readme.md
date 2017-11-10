## Job Queue

This was my submission for a job queue coding challenge. Implemented using Node.js, Express, Redis, and Kue. 

### Prerequisites
1. Have Node.js installed
2. Have Redis installed and running
3. Install Express and Kue dependencies

### Usage
1. Change into the project directory, and in a terminal window `node app.js`
2. To POST a new job, open a new terminal window and submit a POST request in the following format: `curl --data "url=http://www.website.com" http://localhost:3000/makeJob`, replacing `http://www.website.com` with the url you actually want to pull from
3. Following this, you should receive a message with your job id.
4. To check job status, submit a POST request in the following format: `curl --data "id=1" http://localhost:3000/jobStatus`, replacing "1" with the job id you were given when the job was submitted. You should receive a JSON in the format: `{"url": "www.your_url.com", "status": "Job completed or Job not completed", "html": "html content of url you submitted, if job is finished"}`

### Note
* Make sure that urls submitted in the POST request are in the form `http://www.your_url.com` or `https://www.your_url.com`; failing to provide the http(s) or www can lead to erroring
