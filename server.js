var express = require("express"),
  request = require("request"),
  compression = require('compression'),
  QRCode = require("qrcode"),
  properties = require('./server/properties'),
  contacts = require('./server/contacts'),
  activities = require('./server/activities'),
  brokers = require('./server/brokers'),
  activityTypes = require('./server/activitytypes'),
  sqlinit = require('./server/sqlinit'),
  decode = require("salesforce-signed-request"),
  oAuthUAFConsumerKey = process.env.OAUTH_UAF_CONSUMER_KEY,
  oAuthWSFConsumerKey = process.env.OAUTH_WSF_CONSUMER_KEY,
  oAuthWSFConsumerSecret = process.env.OAUTH_WSF_CONSUMER_SECRET,
  oAuthWSFCallbackURL = process.env.OAUTH_WSF_CALLBACK_URL,
  signedRequestConsumerSecret = process.env.SIGNED_REQUEST_CONSUMER_SECRET,
  app = express(),
  jsforce = require("jsforce"),
  oauth2 = {};

app.set("view engine", "ejs");
app.use(express.json());
app.use(compression());
app.use(
  express.urlencoded({
    extended: true,
  })
);
app.use(express.static(__dirname + "/public"));
app.use(
  "/slds",
  express.static(
    __dirname + "/node_modules/@salesforce-ux/design-system/assets"
  )
);
app.use('/', express.static(__dirname + '/www'));

app.post("/sitesearch", function (req, res) {
  var signedRequest = decode(
    req.body.signed_request,
    signedRequestConsumerSecret
  );
  res.render("sitesearch", {
    sr: JSON.stringify(signedRequest),
  });
});

app.post("/signedrequest", function (req, res) {
  console.log("I got signedrequest", req.body.signed_request);

  // You could save this information in the user session if needed
  var signedRequest = decode(
    req.body.signed_request,
    signedRequestConsumerSecret
  );

  console.log("I decoded signedrequest", signedRequest);

  var context = signedRequest.context;

  if (context.environment?.parameters?.customContext === "record") {
    var context = signedRequest.context,
      oauthToken = signedRequest.client.oauthToken,
      instanceUrl = signedRequest.client.instanceUrl;

    // this is not necessary but documented here for demo
    var query =
      "SELECT Id, FirstName, LastName, Phone, Email FROM Contact WHERE Id = '" +
      context.environment.parameters?.recordId +
      "'";

    var contactRequest = {
      url: instanceUrl + "/services/data/v52.0/query?q=" + query,
      headers: {
        Authorization: "OAuth " + oauthToken,
      },
    };

    request(contactRequest, function (err, response, body) {
      console.log("Contact from API response", response);

      var contact = response,
        text =
          "MECARD:N:" +
          contact.LastName +
          "," +
          contact.FirstName +
          ";TEL:" +
          contact.Phone +
          ";EMAIL:" +
          contact.Email +
          ";;";

      console.log("Contact from signed request parameters", contact);

      QRCode.toDataURL(text, function (err, url) {
        res.render("qr", {
          imgSrc: url,
          sr: JSON.stringify(signedRequest),
        });
      });
    });
  } else {
    var contact = context.environment.record,
      text =
        "MECARD:N:" +
        contact.LastName +
        "," +
        contact.FirstName +
        ";TEL:" +
        contact.Phone +
        ";EMAIL:" +
        contact.Email +
        ";;";

    console.log("Contact from signed request context record", contact);

    QRCode.toDataURL(text, function (err, url) {
      res.render("index", {
        context: context,
        imgSrc: url,
        sr: JSON.stringify(signedRequest),
      });
    });
  }
});

app.post("/realty", function (req, res) {
  console.log("I got signedrequest", req.body.signed_request);

  // You could save this information in the user session if needed
  var signedRequest = decode(
    req.body.signed_request,
    signedRequestConsumerSecret
  );

  console.log("I decoded signedrequest", signedRequest);

  res.render("realty", { sr: JSON.stringify(signedRequest) });
});

app.get("/oauth/uaf", function (req, res) {
  console.log("oauth uaf", req.body, req.params, req.query);
  res.render("oauth", { consumerKey: oAuthUAFConsumerKey });
});

app.get("/oauth/wsf", function (req, res) {
  console.log("oauth wsf", req.body, req.params, req.query);
  console.log("redirecting to oauth2 auth url");
  oauth2 = new jsforce.OAuth2({
    // you can change loginUrl to connect to sandbox or prerelease env.
    loginUrl: req.query.loginUrl,
    clientId: oAuthWSFConsumerKey,
    clientSecret: oAuthWSFConsumerSecret,
    redirectUri: oAuthWSFCallbackURL,
  });
  res.redirect(oauth2.getAuthorizationUrl({ scope: "api id web" }));
});

app.get("/oauth/wsf/callback", function (req, res) {
  console.log("oauth wsf callback", req.body, req.params, req.query);
  var conn = new jsforce.Connection({ oauth2: oauth2 });
  var code = req.query.code;
  conn.authorize(code, function (err, userInfo) {
    if (err) {
      return console.error(err);
    }
    console.log("authorize response", conn, userInfo);
    res.render("oauth2", { conn: conn });
  });
});

app.get('/properties', properties.findAll);
app.get('/properties/:id', properties.findById);
app.post('/properties', properties.createItem);
app.put('/properties', properties.updateItem);
app.delete('/properties/:id', properties.deleteItem);

app.get('/contacts', contacts.findAll);
app.get('/contacts/:id', contacts.findById);
app.post('/contacts', contacts.createItem);
app.put('/contacts', contacts.updateItem);
app.delete('/contacts/:id', contacts.deleteItem);

app.get('/activities', activities.findAll);
app.post('/activities', activities.createItem);
app.delete('/activities/:id', activities.deleteItem);

app.get('/activitytypes', activityTypes.findAll);

app.get('/brokers', brokers.findAll);
app.get('/brokers/:id', brokers.findById);
app.post('/brokers', brokers.createItem);
app.put('/brokers', brokers.updateItem);
app.delete('/brokers/:id', brokers.deleteItem);

app.set("port", process.env.PORT || 5000);

app.listen(app.get("port"), function () {
  console.log("Express server listening on port " + app.get("port"));
});
