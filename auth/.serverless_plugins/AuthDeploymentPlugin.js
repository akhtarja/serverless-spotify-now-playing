const fs = require("fs");
const AWS = require('aws-sdk');

class AuthDeploymentPlugin {
    constructor(serverless, options) {
        this.serverless = serverless;
        this.options = options;
        this.hooks = {
            "after:deploy:deploy": this.afterDeploy.bind(this)
        }
    }

    getResourceId(data, resourceName) {
        return data.find(resource => {
            return resource.LogicalResourceId === resourceName
        }).PhysicalResourceId
    }

    afterDeploy() {
        console.log('AuthDeploymentPlugin start');
        this.writeConfig();
        console.log('AuthDeploymentPlugin end');
    }

    writeConfig() {
        const provider = this.serverless.service.provider;
        const custom = this.serverless.service.custom;
        const service = this.serverless.service.service;

        const credentials = new AWS.SharedIniFileCredentials({ profile: provider.profile });
        const region = provider.region;
        const cloudFormation = new AWS.CloudFormation({ credentials, region });

        cloudFormation.describeStackResources({ StackName: `${service}-${custom.stage}` }).promise()
            .then((data) => {

                const config = {
                    clientID: provider.environment.SPOTIFY_CLIENT_ID,
                    scope: provider.environment.AUTH_SCOPES,
                    region: region,
                    stage: custom.stage,
                    apiGatewayRestApi: this.getResourceId(data.StackResources, "ApiGatewayRestApi")
                };
                const fileContents = `export default ${JSON.stringify(config)}`;

                const path = custom.config_path;

                if (!fs.existsSync(path)) {
                    fs.mkdirSync(path);
                }

                console.log("debug", fileContents);

                fs.writeFile(`${path}/${service}.js`, fileContents, (err) => {
                    if (err) return console.log(err);
                });
            });
    }
}

module.exports = AuthDeploymentPlugin;
