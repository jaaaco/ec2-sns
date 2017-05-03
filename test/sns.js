/* eslint-disable no-unused-vars */
/* eslint-env node, mocha */


const SNS = require('../index.js').SNS;
const fs = require('fs');
const assert = require('assert');
const sinon = require('sinon');
const should = require('should');

require('should-sinon');
require('should-http');

const nock = require('nock');
const http = require('http');

//nock.recorder.rec();

describe('SNS Class', function () {
  before(function (done) {

    nock('http://169.254.169.254')
      .get('/latest/meta-data/public-ipv4')
      .reply(200, '\n127.0.0.1\n');

    nock('https://sns.eu-west-1.amazonaws.com:443', { encodedQueryParams: true })
      .post('/', (body) => {
        return body.Action === 'Subscribe';
      })
      .reply(function(uri, requestBody) {
        const body = `{
          "Type" : "SubscriptionConfirmation",
          "MessageId" : "d0921e62-3d44-436c-8322-0c2928e1a03f",
          "Token" : "2336412f37fb687f5d51e6e241d59b68c9f41a4971023cb232e5a6e90948523edfb9b184d4dfa8d44a1cf3873e6acb0bf3d848cba4fd1c3cb0548ad51ca751aea7b488afbed765dd0b2cdc9485df3cac85f5b04ce0f19d0dc4ff3cb2df01a76cbd56b25c0ee7054720f81bf653377948",
          "TopicArn" : "${process.env.AWS_TOPIC_ARN}",
          "Message" : "You have chosen to subscribe to the topic arn:aws:sns:eu-west-1:251215665158:cms. To confirm the subscription, visit the SubscribeURL included in this message.",
          "SubscribeURL" : "https://sns.eu-west-1.amazonaws.com/?Action=ConfirmSubscription&TopicArn=arn:aws:sns:eu-west-1:123123123:xxx&Token=2336412f37fb687f5d51e6e241d59b68c9f41a4971023cb232e5a6e90948523edfb9b184d4dfa8d44a1cf3873e6acb0bf3d848cba4fd1c3cb0548ad51ca751aea7b488afbed765dd0b2cdc9485df3cac85f5b04ce0f19d0dc4ff3cb2df01a76cbd56b25c0ee7054720f81bf653377948",
          "Timestamp" : "2017-04-29T10:15:04.627Z",
          "SignatureVersion" : "1",
          "Signature" : "M+e+2rmZIgUDkCcnFZsjjaOK9BbMALaEjOk3j7GrygC3lts1Y3OPo23+82bQfo4nyQB+gULGEfjd1k8VV1Fj7x/hLBxksMcsKeQv6/VJ7U3XnigFO9MqJS6OOvte7PUgVvjzVpYhskVhoGlX+ibk+sz0UgZdN2gk05ckL0lxUuBaNiMZlEyAdzaFJRh7vYjm1NKPP4OwsXZX5NNaYEyBNiAufzQuBCphdy+7u5VSsWy6C6qMIFfmpCHbfSXlcscIFGhxGwP5g85Surq26+QcwHEkBYBZrNRDYgRUd1urxDhnW/ewoF+rPS4j4qEvKk1lLT8L3ibjI4QiJsu394awfQ==",
          "SigningCertURL" : "https://sns.eu-west-1.amazonaws.com/SimpleNotificationService-b95095beb82e8f6a046b3aafc7f4149a.pem"
        }`;
        const req = http.request({
          host: '127.0.0.1',
          port: 8081,
          method: 'POST',
          headers: {
            'Content-Length': body.length,
            'Content-Type': 'text/plain; charset=UTF-8',
            'User-Agent': 'Amazon Simple Notification Service Agent',
            'X-Amz-Sns-Message-Id': 'd0921e62-3d44-436c-8322-0c2928e1a03f',
            'X-Amz-Sns-Message-Type': 'SubscriptionConfirmation',
            'X-Amz-Sns-Topic-Arn': process.env.AWS_TOPIC_ARN,
            'X-Forwarded-For': '54.240.197.8',
          },
        });
        req.on('error', (e) => {
          done(`problem with request: ${e.message}`);
        });
        req.write(body);
        req.end();
        return [
          200,
          "<SubscribeResponse xmlns=\"http://sns.amazonaws.com/doc/2010-03-31/\">\n  <SubscribeResult>\n    <SubscriptionArn>pending confirmation</SubscriptionArn>\n  </SubscribeResult>\n  <ResponseMetadata>\n    <RequestId>e6dafcfc-f533-55dd-8e02-ad829cdb66b9</RequestId>\n  </ResponseMetadata>\n</SubscribeResponse>\n",
        ];
      });

    nock('https://sns.eu-west-1.amazonaws.com:443', { encodedQueryParams: true })
      .post('/', (body) => {
        return body.Action === 'ConfirmSubscription';
      })
      .reply(200, "<ConfirmSubscriptionResponse xmlns=\"http://sns.amazonaws.com/doc/2010-03-31/\">\n  <ConfirmSubscriptionResult>\n    <SubscriptionArn>arn:aws:sns:eu-west-1:123123123:xxx:2aa27442-a9b1-40dc-b4cd-932470eeaafd</SubscriptionArn>\n  </ConfirmSubscriptionResult>\n  <ResponseMetadata>\n    <RequestId>0f106784-211f-5d37-8087-36fa48f62973</RequestId>\n  </ResponseMetadata>\n</ConfirmSubscriptionResponse>\n", [ 'x-amzn-RequestId',
        '0f106784-211f-5d37-8087-36fa48f62973',
        'Content-Type',
        'text/xml',
        'Content-Length',
        '393',
        'Date',
        'Sat, 29 Apr 2017 10:15:05 GMT' ]);

    nock('https://sns.eu-west-1.amazonaws.com:443', {"encodedQueryParams":true})
      .post('/', (body) => {
        return body.Action === 'Publish';
      })
      .reply(200, "<ErrorResponse xmlns=\"http://sns.amazonaws.com/doc/2010-03-31/\">\n  <Error>\n    <Type>Sender</Type>\n    <Code>InvalidClientTokenId</Code>\n    <Message>The security token included in the request is invalid.</Message>\n  </Error>\n  <RequestId>7adbdc24-77a1-5fe2-ac17-8da048e15fa4</RequestId>\n</ErrorResponse>\n", [ 'x-amzn-RequestId',
        '7adbdc24-77a1-5fe2-ac17-8da048e15fa4',
        'Content-Type',
        'text/xml',
        'Content-Length',
        '305',
        'Date',
        'Wed, 03 May 2017 20:26:40 GMT' ]);


    this.sns = new SNS();
    this.sns.on('ready', done);
  });

  it('ARN endpoint should be set', function () {
    this.sns.subscriptionEndpoint.should.equal('http://127.0.0.1:8081');
  });

  it('should have subscription arn set', function () {
    this.sns.subscriptionArn.should.not.be.false()
  });

  it('is http server running', function (done) {
    http.get('http://localhost:8081', (res) => {
      res.should.have.status(400);
      done();
    });
  });

  it('servers rejects malformed messages', function (done) {
    const body = `{
      "Type" : "SubscriptionConfirmation",
        "MessageId" : "d0921e62-3d44-MALFORMED
      }`;
    const req = http.request({
      host: '127.0.0.1',
      port: 8081,
      method: 'POST',
      headers: {
        'Content-Length': body.length,
        'Content-Type': 'text/plain; charset=UTF-8',
        'User-Agent': 'Amazon Simple Notification Service Agent',
        'X-Amz-Sns-Message-Id': 'd0921e62-3d44-436c-8322-0c2928e1a03f',
        'X-Amz-Sns-Message-Type': 'SubscriptionConfirmation',
        'X-Amz-Sns-Topic-Arn': process.env.AWS_TOPIC_ARN,
        'X-Forwarded-For': '54.240.197.8',
      },
    }, (res) => {
      res.should.have.status(400);
      done();
    });
    req.on('error', (e) => {
      console.error(`problem with request: ${e.message}`);
    });
    req.write(body);
    req.end();
  });

  it('servers rejects invalid ARN', function (done) {
    const body = `{
      "Type" : "SubscriptionConfirmation",
        "MessageId" : "d0921e62-3d44-436c-8322-0c2928e1a03f",
        "Token" : "2336412f37fb687f5d51e6e241d59b68c9f41a4971023cb232e5a6e90948523edfb9b184d4dfa8d44a1cf3873e6acb0bf3d848cba4fd1c3cb0548ad51ca751aea7b488afbed765dd0b2cdc9485df3cac85f5b04ce0f19d0dc4ff3cb2df01a76cbd56b25c0ee7054720f81bf653377948",
        "TopicArn" : "INVALID ARN",
        "Message" : "You have chosen to subscribe to the topic arn:aws:sns:eu-west-1:251215665158:cms. To confirm the subscription, visit the SubscribeURL included in this message.",
        "SubscribeURL" : "https://sns.eu-west-1.amazonaws.com/?Action=ConfirmSubscription&TopicArn=arn:aws:sns:eu-west-1:XXXXXXX58:xxx&Token=2336412f37fb687f5d51e6e241d59b68c9f41a4971023cb232e5a6e90948523edfb9b184d4dfa8d44a1cf3873e6acb0bf3d848cba4fd1c3cb0548ad51ca751aea7b488afbed765dd0b2cdc9485df3cac85f5b04ce0f19d0dc4ff3cb2df01a76cbd56b25c0ee7054720f81bf653377948",
        "Timestamp" : "2017-04-29T10:15:04.627Z",
        "SignatureVersion" : "1",
        "Signature" : "M+e+2rmZIgUDkCcnFZsjjaOK9BbMALaEjOk3j7GrygC3lts1Y3OPo23+82bQfo4nyQB+gULGEfjd1k8VV1Fj7x/hLBxksMcsKeQv6/VJ7U3XnigFO9MqJS6OOvte7PUgVvjzVpYhskVhoGlX+ibk+sz0UgZdN2gk05ckL0lxUuBaNiMZlEyAdzaFJRh7vYjm1NKPP4OwsXZX5NNaYEyBNiAufzQuBCphdy+7u5VSsWy6C6qMIFfmpCHbfSXlcscIFGhxGwP5g85Surq26+QcwHEkBYBZrNRDYgRUd1urxDhnW/ewoF+rPS4j4qEvKk1lLT8L3ibjI4QiJsu394awfQ==",
        "SigningCertURL" : "https://sns.eu-west-1.amazonaws.com/SimpleNotificationService-b95095beb82e8f6a046b3aafc7f4149a.pem"
    }`;
    const req = http.request({
      host: '127.0.0.1',
      port: 8081,
      method: 'POST',
      headers: {
        'Content-Length': body.length,
        'Content-Type': 'text/plain; charset=UTF-8',
        'User-Agent': 'Amazon Simple Notification Service Agent',
        'X-Amz-Sns-Message-Id': 'd0921e62-3d44-436c-8322-0c2928e1a03f',
        'X-Amz-Sns-Message-Type': 'SubscriptionConfirmation',
        'X-Amz-Sns-Topic-Arn': 'INVALID ARN',
        'X-Forwarded-For': '54.240.197.8',
      },
    }, (res) => {
      res.should.have.status(404);
      done();
    });
    req.on('error', (e) => {
      console.error(`problem with request: ${e.message}`);
    });
    req.write(body);
    req.end();
  });

  it('emits message event when message arrives', function (done) {
    this.timeout(5000);
    this.sns.on('message', () => {
      done();
    });
    const body = `{
        "Type" : "Notification",
        "MessageId" : "5b71b1b0-ec27-51ff-959e-e0cfe8f04bd8",
        "TopicArn" : "${process.env.AWS_TOPIC_ARN}",
        "Subject" : "test-subject",
        "Message" : "{\\"foo\\":\\"bar\\"}",
        "Timestamp" : "2017-04-29T21:16:07.497Z",
        "SignatureVersion" : "1",
        "Signature" : "XXXXXXXXXb/rbyRv1RhASutTwKz0/TULNCTKwtqRn8zS1tZl2D5+rvl1ofXxaXOAIJMfgWfgA3KWIHeY2KpinBiOpfMo4scLYn+Jx7YTxPgKy4qRmnfPTPEWgEUAb65KOPiga3VVmpDWu4OZddA58i41dbPpYwhFKgrr1hTu+K3a4D0tmigG/aCDDVT0nJYVxB37Ep9uDYLQ9VDKl5/jbrogSiIYnX+vwFVWspDAlXUo70lPJVRSrxFvOH8cKLhOpAq505BaUWyS2p1son9nBE+Gir9MudodkalTSInOyM/B9mrQOyxaeQi3mgB4/aonmuCkKDFXZVasTG4ggQ==",
        "SigningCertURL" : "https://sns.eu-west-1.amazonaws.com/SimpleNotificationService-b95095beb82e8f6a046b3aafc7f4149a.pem",
        "UnsubscribeURL" : "https://sns.eu-west-1.amazonaws.com/?Action=Unsubscribe&SubscriptionArn=arn:aws:sns:eu-west-1:7777777777:xxx:2aa27442-a9b1-40dc-b4cd-932470eeaafd"
      }`;
    const req = http.request({
      host: '127.0.0.1',
      port: 8081,
      method: 'POST',
      headers: {
        'Content-Length': body.length,
        'Content-Type': 'text/plain; charset=UTF-8',
        'User-Agent': 'Amazon Simple Notification Service Agent',
        'X-Amz-Sns-Message-Id': 'd0921e62-3d44-436c-8322-0c2928e1a03f',
        'X-Amz-Sns-Message-Type': 'SubscriptionConfirmation',
        'X-Amz-Sns-Topic-Arn': 'INVALID ARN',
        'X-Forwarded-For': '54.240.197.8',
      },
    }, (res) => {
      res.should.have.status(200);
    });
    req.on('error', (e) => {
      console.error(`problem with request: ${e.message}`);
    });
    req.write(body);
    req.end();
  });

  describe('#getEndpoint', function() {
    before(function() {
      nock('http://169.254.169.254')
        .get('/latest/meta-data/public-ipv4')
        .reply(500);
    });
    it('should throw error one network problems', function() {
      const doneCB = sinon.spy();
      (function(){this.sns.getEndpoint(doneCB)}).should.throw();
      doneCB.should.not.be.called();
    });
    it('should return ednpoint from env if defined', function() {
      process.env.AWS_SUBSCRIPTION_ENDPOINT = 'test-env';
      const doneCB = sinon.spy();
      this.sns.getEndpoint(doneCB);
      this.sns.subscriptionEndpoint.should.equal('test-env');
      doneCB.should.be.calledOnce();
    });
    it('get private IP', function(done) {
      nock('http://169.254.169.254')
        .get('/latest/meta-data/local-ipv4')
        .reply(200, '\n178.0.0.1\n');
      this.sns.getIP((ip) => {
        ip.should.equal('178.0.0.1');
        done();
      }, true);
    });
  });

  describe('#send', function() {
    it ('throws error on invalid data', function(){
      (function(){
        this.sns.send({ subject: 'testSubject', _message: { foo: 'bar' } });
      }).should.throw();
    });
    it ('sends request to SNS', function(){
      this.sns.send({ subject: 'testSubject', message: { foo: 'bar' } });
    });
  });
});
