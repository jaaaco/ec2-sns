'use strict';

const AWS = require('aws-sdk');
const http = require('http');
const S = require('string');
const EventEmitter = require('events');

module.exports.SNS = class SNS extends EventEmitter {
  constructor() {
    super();

    this.subscriptionArn = false;
    this.subscriptionEndpoint = false;

    this.sns = new AWS.SNS({
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'SOME_KEY',
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'SOME_SECRET',
      apiVersion: '2010-03-31',
      region: process.env.AWS_REGION || 'eu-west-1',
    });

    if (!process.env.AWS_TOPIC_ARN) {
      process.env.AWS_TOPIC_ARN = 'SOME_TOPIC_ARN';
    }
    function unsubscribeAndTerminate(exitCode) {
      if (!this.subscriptionArn) {
        process.exit(exitCode || 0);
      }

      this.sns.unsubscribe({
        SubscriptionArn: this.subscriptionArn,
      }, (err) => {
        process.exit(err ? 1 : 0);
      });
    }

    process.on('SIGINT', unsubscribeAndTerminate);
    process.on('uncaughtException', (e) => {
      console.log('uncaughtException', e);
      unsubscribeAndTerminate(1);
    });

    if (!process.env.NO_SUBSCRIPTION) {
      this.getEndpoint(() => {
        this.startServer(() => {
          this.subscribe();
        });
      });
    } else {
      this.emit('ready');
    }
  }

  startServer(done) {
    function endResponse(res, statusCode) {
      res.statusCode = statusCode || 200;
      res.setHeader('Content-Type', 'text/plain');
      res.end();
    }

    this.server = http.createServer((req, res) => {
      let msg = '';
      req.on('data', (chunk) => {
        msg += chunk;
      });

      req.on('end', () => {
        try {
          msg = JSON.parse(msg);
          // TODO: validate message - https://github.com/aws/aws-js-sns-message-validator

          if (msg.TopicArn !== process.env.AWS_TOPIC_ARN) {
            return endResponse(res, 404);
          }

          if (msg.Type === 'SubscriptionConfirmation') {
            this.sns.confirmSubscription({
              Token: msg.Token,
              TopicArn: msg.TopicArn,
            }, (err, subscription) => {
              if (err) {
                return endResponse(res, 500);
              }
              this.subscriptionArn = subscription.SubscriptionArn;
              this.emit('ready');
              return endResponse(res, 200);
            });
          }

          if (msg.Type === 'Notification') {
            try {
              this.emit('message', { subject: msg.Subject, body: JSON.parse(msg.Message) });
              endResponse(res, 200);
            } catch (e) {
              endResponse(res, 400);
            }
          }
        } catch (e) {
          return endResponse(res, 400);
        }
        return false;
      });
    });

    this.server.listen(8081, () => {
      done();
    });
  }

  send(data) {
    this.sns.publish({
      Subject: data.subject,
      Message: JSON.stringify(data.message),
      TopicArn: process.env.AWS_TOPIC_ARN,
    }, (error, result) => {
      console.log('send', error, result);
    });
  }

  getEndpoint(done, ignoreEnv) {
    if (process.env.AWS_SUBSCRIPTION_ENDPOINT && !ignoreEnv) {
      // getting public IP, check http://docs.aws.amazon.co
      // using endpoint from env (testing only)
      this.subscriptionEndpoint = process.env.AWS_SUBSCRIPTION_ENDPOINT;
      done();
    } else {
      // getting public IP, check http://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ec2-instance-metadata.html
      this.getIP((ip) => {
        this.subscriptionEndpoint = `http://${ip}:8081`;
        done();
      });
    }
  }

  subscribe() {
    this.sns.subscribe({
      Protocol: 'http',
      TopicArn: process.env.AWS_TOPIC_ARN,
      Endpoint: this.subscriptionEndpoint,
    }, (error) => {
      if (error) {
        throw error;
      }
    });
  }

  getIP(done, privateIP) {
    // getting public IP, check http://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ec2-instance-metadata.html
    http.get(`http://169.254.169.254/latest/meta-data/${privateIP ? 'local' : 'public'}-ipv4`, (res) => {
      let rawData = '';
      res.on('data', (chunk) => { rawData += chunk; });
      res.on('end', () => {
        done(S(rawData).trim().toString());
      });
    }).on('error', (e) => {
      throw new Error('Unable to get IP', e);
    });
  }

};
