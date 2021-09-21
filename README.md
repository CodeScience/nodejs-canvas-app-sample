## Salesforce Canvas Demo

Before deploying this NodeJS canvas app to Heroku, make sure you deploy the connected apps and VF pages available in this [repo](https://github.com/CodeScience/canvas-demo)

1. Click in the button below to deploy this app to Heroku:

[![Deploy](https://www.herokucdn.com/deploy/button.png)](https://heroku.com/deploy)

2. Change the environment variables in Heroku. Note these values will be provided in the corresponding connected apps in Salesforce (go to Setup > App Manager > canvas demo XYZ - view)

* canvas_demo_signed_request: SIGNED_REQUEST_CONSUMER_SECRET
* canvas_demo_oauth_uaf: OAUTH_UAF_CONSUMER_KEY
* canvas_demo_oauth_wsf: OAUTH_WSF_CONSUMER_KEY, OAUTH_WSF_CONSUMER_SECRET and OAUTH_WSF_CALLBACK_URL