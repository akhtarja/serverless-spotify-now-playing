const fs = require('fs');
const AWS = require('aws-sdk');
const querystring = require('querystring');
const uuidv4 = require('uuid/v4');

class AuthDeploymentPlugin {
    constructor(serverless) {
        this.hooks = {
            "after:deploy:deploy": this.afterDeploy.bind(null, serverless)
        }
    }

    afterDeploy(serverless) {
      return new Promise(function(resolve, reject) {
        const provider = serverless.service.provider;
        const custom = serverless.service.custom;
        const service = serverless.service.service;

        const credentials = new AWS.SharedIniFileCredentials({ profile: provider.profile });
        const region = provider.region;
        const cloudFormation = new AWS.CloudFormation({ credentials, region });

        const params = {
          StackName: `${service}-${custom.stage}`
        };

        cloudFormation.describeStackResources(params, function(err, response) {
          if (err) {
            console.log(err, err.stack);
            return reject(err);
          } else {
            const apiGatewayRestApi = response.StackResources.find(resource => resource.LogicalResourceId === "ApiGatewayRestApi").PhysicalResourceId;
            const authQueryString = querystring.stringify({
              response_type: 'code',
              client_id: provider.environment.SPOTIFY_CLIENT_ID,
              scope: provider.environment.AUTH_SCOPES,
              redirect_uri: `https://${apiGatewayRestApi}.execute-api.${region}.amazonaws.com/${custom.stage}/redirect`,
              state: uuidv4(),
            });
            const fileContents = `const ${service.replace(/-/g, '_')}_querystring = '${authQueryString}';`;
            const path = custom.config_path;

            if (!fs.existsSync(path)) {
              fs.mkdirSync(path);
            }

            fs.writeFileSync(`${path}/${service}.js`, fileContents);
            return resolve(response);
          }
        });
      });
    }
}

module.exports = AuthDeploymentPlugin;
