# Spotify Now Playing

[![Dependabot Status](https://api.dependabot.com/badges/status?host=github&repo=akhtarja/serverless-spotify-now-playing)](https://dependabot.com)

This application is running and publicly available at https://nowplaying.tinyrobot.co/.

This is an API wrapper for Spotify that allows users to get their currently playing track with an API call.

This application uses Bootstrap for the front end, and NodeJS running on AWS Lambda on the back end. Deployment is done using Serverless.

## ESLint Configuration
This step is only needed if you're doing dev work on the project and want to use ESLint (recommended). From the project's root:
```
npm ci
```

## Serverless Framework Dashboard setup
### Creating the app
1. Log into the Serverless Framework Dashboard at https://dashboard.serverless.com and create an app called `spotify-now-playing`. If you need to create a new org to do this, create one now and name it anything you like.
2. If this is your first time using the Serverless Framework Dashboard, run the following command and follow the prompts to complete the initial setup of the command line tool:
```
serverless login
```
### Profile setup
The project uses the safeguard policies outlined below. Failure to configure these policies will not prevent you from deploying the app's services, but you will receive warnings when deploying to your dev environment. These safeguard can be configured in profiles names for each stage (`dev`, `staging`, `prod`), or under the `default` profile, which will be used as a fallback in case stage-specific profile don't exist.

|Policy|Safeguard config|Enforcement level|
|---|---|---|
|`allowed-stages`|`- dev`<br>`-staging`<br>`- prod`|error: block the deploy from continuing|
|`framework-version`|`>=1.39.1 <2.0.0`|warning: allow the deploy to continue, but warn the user|
|`runtimes`|`nodejs10.x`|error: block the deploy from continuing|
|`no-secret-env-vars`||error: block the deploy from continuing|
|`allowed-regions`|`- us-east-1`|error: block the deploy from continuing|
|`no-wild-iam-role-statements`||warning: allow the deploy to continue, but warn the user|

## Deploying the Back End
1. Clone this repo.

2. Create an AWS IAM user with programmatic access. Add the keys to your local AWS credential files using the name `spotify-now-playing-[dev|staging|prod]`.

3. Create a Spotify integration in the Spotify Developers dashboard at https://developer.spotify.com/dashboard/. After you create the app, Spotify will provide a Client ID and Client Secret. Save these for the next step.

4. The application expects the following environment variables:

| Variable name | Description |
| :--- | :--- |
| `SPOTIFY_NOW_PLAYING_CLIENT_ID_[dev/staging/prod]` | Spotify Client ID provided in the Spotify Developer Dashboard |
| `SPOTIFY_NOW_PLAYING_CLIENT_SECRET_[dev/staging/prod]` | Spotify Client Secret provided in the Spotify Developer Dashboard |
| `SPOTIFY_NOW_PLAYING_SUCCESS_URL_[dev/staging/prod]` | The absolute URL of the page to redirect the user to on successful login |
| `SPOTIFY_NOW_PLAYING_ERROR_URL_[dev/staging/prod]` | The absolute URL of the page to redirect the user to on unsuccessful login |
| `SPOTIFY_NOW_PLAYING_CUSTOM_ENDPOINT_URL` | The absolute URL of a custom endpoint URL, if desired. If this is left blank, the API endpoint URL will be generated automatically by AWS |

5. Deploy the `dlq` (dead letter queue) service. From the project's root:
```
cd dlq
```

The next command can be skipped if you are not deploying from a freshly cloned instance of the project:
```
serverless --org [your serverless org name] --app spotify-now-playing
```

To install the dependencies and deploy the service to AWS:
```
npm ci
serverless deploy [--stage dev|staging|prod]
```

6. Deploy the `auth` service. From the project's root:
```
cd auth
```

The next command can be skipped if you are not deploying from a freshly cloned instance of the project:
```
serverless --org [your serverless org name] --app spotify-now-playing
```

To install the dependencies and deploy the service to AWS:
```
npm ci
serverless deploy [--stage dev|staging|prod]
```

7. Once deployment is complete, Serverless will provide a URL for the newly created `redirect` API endpoint. Copy this URL.

8. In the Spotify Developer Dashboard, edit the settings for your integration. In the section titled **Redirect URIs**, add the URL you copied in the previous step.

9. Deploy the `playback-state` service. From the project's root:
```
cd playback-state
```

The next command can be skipped if you are not deploying from a freshly cloned instance of the project:
```
serverless --org [your serverless org name] --app spotify-now-playing
```

To install the dependencies and deploy the service to AWS:
```
npm ci
serverless deploy [--stage dev|staging|prod]
```

## Building the Front End
Build the application front end. Go back to the project's root and do the following for a **development environment**:
```
cd app
npm ci
npm run start
```
This will run the application in a local development server at `localhost:3000`. To create an optimized production build, run `npm run build`. The compiled assets will be created in the `build` folder.
