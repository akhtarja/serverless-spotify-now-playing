/* eslint no-console: ["error", { allow: ["log", "warn", "error"] }] */
/* we want to allow console logging in Lambda functions in order to use AWS CloudWatch */

'use strict';

const request = require('request');
const AWS = require('aws-sdk');
const uuidv4 = require('uuid/v4');

const dynamodb = new AWS.DynamoDB.DocumentClient();

const getCode = event => ({
  code: event.queryStringParameters.code,
  host: event.requestContext.domainName,
  path: event.requestContext.path
});

const getToken = (event) => {
  if (!event.code) {
    throw new Error('no code found');
  }

  const params = {
    url: 'https://accounts.spotify.com/api/token',
    form: {
      code: event.code,
      redirect_uri: `https://${event.host}${event.path}`,
      grant_type: 'authorization_code'
    },
    headers: {
      Authorization: `Basic ${(Buffer.from(`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`).toString('base64'))}`
    },
    json: true
  };

  return new Promise((resolve, reject) => {
    request.post(params, (error, response, body) => {
      if (!error && response.statusCode === 200) {
        resolve(body);
      } else {
        reject(error || response);
      }
    });
  });
};

const getEmailAddress = (event) => {
  const params = {
    url: 'https://api.spotify.com/v1/me',
    headers: {
      Authorization: `Bearer ${event.access_token}`,
      Accept: 'application/json',
      'Content-Type': 'application/json'
    }
  };

  return new Promise((resolve, reject) => {
    request(params, (error, response, body) => {
      if (!error && response.statusCode === 200) {
        resolve(Object.assign(event, { email: JSON.parse(body).email }));
      } else {
        reject(error || response);
      }
    });
  });
};

const writeToDb = (event) => {
  const params = {
    TableName: process.env.USERS_TABLE,
    Item: event
  };

  return dynamodb.put(params).promise()
    .then(() => event)
    .catch((error) => {
      throw new Error(`dynamodb error: ${JSON.stringify(error)}`);
    });
};

const successResponse = (apiKey, callback) => callback(null, {
  statusCode: 302,
  headers: { Location: `${process.env.SUCCESS_URL}?apiKey=${apiKey}` }
});

const errorResponse = (error, callback) => {
  console.error('error:', error);
  return callback(null, {
    statusCode: 302,
    headers: { Location: process.env.ERROR_URL }
  });
};

const redirect = async (event, context, callback) => {
  let parsedEvent = getCode(event);

  try {
    parsedEvent = await getToken(parsedEvent);
    Object.assign(parsedEvent, {
      apiKey: uuidv4(),
      expires_at: ((Date.now() / 1000) + parsedEvent.expires_in)
    });
    parsedEvent = await getEmailAddress(parsedEvent);
    writeToDb(parsedEvent);

    return successResponse(parsedEvent.apiKey, callback);
  } catch (error) {
    return errorResponse(error, callback);
  }
};

module.exports = {
  redirect
};
