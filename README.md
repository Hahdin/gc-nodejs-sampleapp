# [Widgets](https://sampleapp-nodejs.appspot.com/)

## Installing this app locally

This app is currently hosted [here](https://sampleapp-nodejs.appspot.com),  but if you did wish to run this app locally there is some setup involved.

- You will need a google cloud account, and install the gcloud sdk.

- Then create an empty project and create an empty datastore.

- From your app folder root, run the following command to obtain authorization:
```
gcloud auth application-default login
```

- In the app directory, create a config.json file with this content:
```
{
  "OAUTH2_CLIENT_ID": [YOUR_CLIENT_ID],
  "OAUTH2_CLIENT_SECRET": [YOUR_SECRET],
  "OAUTH2_CALLBACK": "http://localhost:8080/auth/google/callback",
  "GCLOUD_PROJECT": "[YOUR_PROJECT_ID]",
  "DATA_BACKEND": "datastore",
  "CLOUD_BUCKET": [YOUR_BUCKET_NAME]
}

// the above is for running locally, if you run it from the app engine change the following:
  "OAUTH2_CALLBACK": "https://[YOUR_PROJECT_ID].appspot.com/auth/google/callback",


```
> Set up the OAuth2 credentials and bucket on your google cloud account, replacing the placeholders with your information.

- Finally, you should be ready to run :
```
npm install
npm start
```

Your app should be running at http://localhost:8080

> If you wish to use a different port for local testing, edit the following entries in the config.js file:

```js

    OAUTH2_CALLBACK: 'http://localhost:8080/auth/google/callback',

    PORT: 8080,
```

# Uploading the data to the datastore
in the app.js file there is a variable
```js
let upload = false;//set to true to run the upload method for the json data
```
It is set to false by default. If you wish to do a one time upload of the json data, make it true.
> Note: this upload assumed the graphics are uploaded to your bucket.