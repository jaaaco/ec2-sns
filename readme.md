[![Travis build status](https://travis-ci.org/jaaaco/ec2-sns.svg?branch=master)](https://travis-ci.org/jaaaco/ec2-sns/) 
[![Coverage Status](https://coveralls.io/repos/github/jaaaco/ec2-sns/badge.svg)](https://coveralls.io/github/jaaaco/ec2-sns)

# EC2 SNS Client

AWS SNS Client that:
* automatically subscribes to SNS topic, 
* gets endpoint URL from EC2 instance public IP
* terminates subscribtion on app exit

Designed to run in AWS ECS / Docker environment.

## Usage

```
const SNS = require('ec2-sns');
const sns = new SNS();

sns.on('message', message => {
  console.log('Topic', message.topic);
  console.log('Body', message.body); // must be JSON
});
```

## Environment variables 

* AWS_ACCESS_KEY_ID
* AWS_SECRET_ACCESS_KEY
* AWS_TOPIC_ARN (SNS topic has to be created first)
* AWS_REGION (optional, defaults to eu-west-1)
* AWS_SUBSCRIPTION_ENDPOINT (optional, overrides automatic one)


