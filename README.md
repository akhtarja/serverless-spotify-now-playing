# Spotify Now Playing

**This project is under development**

This is an API wrapper for Spotify that allows users to get their currently playing track with an API call.

This application uses Bootstrap for the front end, and NodeJS running on AWS Lambda on the back end. Deployment is done using Serverless.

## Deploying the Back End
1. Clone this repo.

2. Create an AWS IAM user with programmatic access. Add the keys to your local AWS credential files using the name `spotify-now-playing-[dev|staging|prod]`.

3. Create a Spotify integration in the Spotify Developers dashboard at https://developer.spotify.com/dashboard/. After you create the app, Spotify will provide a Client ID and Client Secret. Save these for the next step.

4. The application expects the following environment variables:

| Variable name | Description |
| :--- | :--- |
| `SPOTIFY_NOW_PLAYING_CLIENT_ID_[dev/staging/prod]` | Spotify Client ID provided in the Spotify Developer Dashboard |
| `SPOTIFY_NOW_PLAYING_CLIENT_SECRET_[dev/staging/prod]` | Spotify Client Secret provided in the Spotify Developer Dashboard |
| `SPOTIFY_NOW_PLAYING_SUCCESS_URL_[dev/staging/prod]` | The URL of the page to redirect the user to on successful login |
| `SPOTIFY_NOW_PLAYING_ERROR_URL_[dev/staging/prod]` | The URL of the page to redirect the user to on unsuccessful login |

5. Deploy the `auth` service. From the project's root:
```
cd auth
npm install
serverless deploy [--stage dev|staging|prod]
```

6. Once deployment is complete, Serverless will provide a URL for the newly created `redirect` API endpoint. Copy this URL.

7. In the Spotify Developer Dashboard, edit the settings for your integration. In the section titled **Redirect URIs**, add the URL you copied in the previous step.

## Building the Front End
Build the application front end. Go back to the project's root and do the following for a **development environment**:
```
cd app
npm install
npm run start
```
This will run the application in a local development server at `localhost:3000`. To create an optimized production build, run `npm run build`. The compiled assets will be created in the `build` folder.