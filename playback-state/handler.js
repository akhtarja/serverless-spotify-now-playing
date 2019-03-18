/* eslint no-console: ["error", { allow: ["log", "warn", "error"] }] */
/* we want to allow console logging in Lambda functions in order to use AWS CloudWatch */

const request = require('request');
const AWS = require('aws-sdk');
const _ = require('lodash');

const dynamodb = new AWS.DynamoDB.DocumentClient();

const getToken = (event) => {
  const params = {
    TableName: process.env.USERS_TABLE
  };

  return dynamodb.scan(params).promise()
    .then(response => Object.assign(event, {
      token: response.Items.find(item => item.apiKey === event.key)
    }))
    .catch((error) => {
      throw new Error(`dynamodb error:, ${JSON.stringify(error)}`);
    });
};

const tokenRefresh = (event) => {
  if (event.token.expires_at <= (Date.now() / 1000)) {
    const params = {
      url: 'https://accounts.spotify.com/api/token',
      form: {
        refresh_token: event.token.refresh_token,
        grant_type: 'refresh_token'
      },
      headers: {
        Authorization: `Basic ${(Buffer.from(`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`).toString('base64'))}`
      },
      json: true
    };

    return new Promise((resolve, reject) => {
      request.post(params, (error, response, body) => {
        if (!error && response.statusCode === 200) {
          const refreshedEvent = _.cloneDeep(event);

          refreshedEvent.token.access_token = body.access_token;
          refreshedEvent.token.refresh_token = body.refresh_token || event.token.refresh_token;
          refreshedEvent.token.expires_in = body.expires_in;
          refreshedEvent.token.expires_at = (Date.now() / 1000) + body.expires_in;
          refreshedEvent.refreshed = true;

          resolve(refreshedEvent);
        } else {
          reject(error || response);
        }
      });
    });
  }

  return event;
};

const writeToDb = (event) => {
  if (!event.refreshed) return event;

  const params = {
    TableName: process.env.USERS_TABLE,
    Item: event.token
  };

  return dynamodb.put(params).promise()
    .then(() => event)
    .catch((error) => {
      throw new Error(`dynamodb error: ${error}`);
    });
};

const getPlaybackState = (event) => {
  const params = {
    url: 'https://api.spotify.com/v1/me/player',
    headers: {
      Authorization: `Bearer ${event.token.access_token}`,
      Accept: 'application/json',
      'Content-Type': 'application/json'
    }
  };

  return new Promise((resolve, reject) => {
    request(params, (error, response, body) => {
      if (!error && response.statusCode === 200) {
        const {
          item,
          is_playing: isPlaying
        } = JSON.parse(body);

        if (!isPlaying) {
          resolve(event);
        } else {
          resolve(Object.assign(event, {
            nowPlaying: {
              songName: item.name,
              albumName: item.album.name,
              artists: item.artists.map(artist => artist.name)
            }
          }));
        }
      } else {
        reject(error || response);
      }
    });
  });
};

const successResponse = (nowPlaying, callback) => {
  callback(null, {
    statusCode: 200,
    body: JSON.stringify(nowPlaying)
  });
};

const errorResponse = (error, callback) => {
  console.error('error:', error);
  callback(null, {
    statusCode: 401
  });
};

const playbackState = async (event, context, callback) => {
  let parsedEvent = event.queryStringParameters;

  try {
    parsedEvent = await getToken(parsedEvent);
    parsedEvent = await tokenRefresh(parsedEvent);
    parsedEvent = await writeToDb(parsedEvent);
    parsedEvent = await getPlaybackState(parsedEvent);
    return successResponse((parsedEvent.nowPlaying || {}), callback);
  } catch (error) {
    return errorResponse(error, callback);
  }
};

module.exports = {
  playbackState
};
