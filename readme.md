[![npm](https://img.shields.io/npm/v/ec2-sns.svg)](https://www.npmjs.com/package/ec2-sns)
[![Travis build status](https://travis-ci.org/jaaaco/ec2-sns.svg?branch=master)](https://travis-ci.org/jaaaco/ec2-sns/) 
[![Coveralls](https://img.shields.io/coveralls/jaaaco/ec2-sns.svg)](https://coveralls.io/github/jaaaco/ec2-sns)

# EC2 SNS Client

AWS SNS Client that:
* automatically subscribes to SNS topic, 
* gets endpoint URL from EC2 instance public IP

Designed to run in AWS ECS / Docker environment.

## Usage

```
const SNS = require('ec2-sns');
const sns = new SNS({
  port: 8081 // default port
});

// receive messages from SNS Topic
sns.on('message', message => {
  console.log('Subject', message.subject);
  console.log('Body', message.body); // must be JSON
});

// send message to SNS Topic
sns.on('ready', () => {
  sns.send({
    subject: 'my-subject',
    message: {foo: 'bar'}
  });
});

```

## Environment variables 

* AWS_ACCESS_KEY_ID
* AWS_SECRET_ACCESS_KEY
* AWS_TOPIC_ARN (SNS topic has to be created first)
* AWS_REGION (optional, defaults to eu-west-1)
* AWS_SUBSCRIPTION_ENDPOINT (optional, overrides automatic one)
* NO_SUBSCRIPTION (optional) if set it won't subscribe, but still can send messages to SNS Topic

