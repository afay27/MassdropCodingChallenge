## Massdrop Coding Challenge: Job Queue

This is my submission for the job queue project. I implemented this using Node.js, Express, Redis, and Kue. 

### Prerequisites
Have Node.js installed
Have Redis installed and running
Install Express and Kue dependencies

### Usage
1. Change into the project directory, and in a terminal window `node app.js`
2. To POST a new job, open a new terminal window and submit a POST request in the following format: `curl --data "url=http://www.website.com" http://localhost:3000/makeJob`
3. Following this, you should receive a message with you job id
4. To check job status, submit a POST request in the following format: `curl --data "id=1" http://localhost:3000/jobStatus`, replacing "1" with the job id you were given when the job was submitted. You should receivea JSON in the format `{"url": "www.your_url.com", "status": "Job completed or Job not completed", "html": "html content of url you submitted, if job is finished"}`



