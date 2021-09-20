var express = require("express"),
	request = require("request"),
	QRCode = require("qrcode"),
	decode = require("salesforce-signed-request"),
	oAuthUAFConsumerKey = process.env.OAUTH_UAF_CONSUMER_KEY,
	oAuthWSFConsumerKey = process.env.OAUTH_WSF_CONSUMER_KEY,
	oAuthWSFConsumerSecret = process.env.OAUTH_WSF_CONSUMER_SECRET,
	oAuthWSFCallbackURL = process.env.OAUTH_WSF_CALLBACK_URL,
	signedRequestConsumerSecret = process.env.SIGNED_REQUEST_CONSUMER_SECRET,
	app = express(),
	jsforce = require("jsforce");

var oauth2 = new jsforce.OAuth2({
	// you can change loginUrl to connect to sandbox or prerelease env.
	clientId: oAuthWSFConsumerKey,
	clientSecret: oAuthWSFConsumerSecret,
	redirectUri: oAuthWSFCallbackURL
});

app.set("view engine", "ejs");
app.use(express.json());
app.use(
	express.urlencoded({
		extended: true,
	})
);
app.use(express.static(__dirname + "/public"));

app.post("/signedrequest", function (req, res) {
	console.log("I got signedrequest", req.body.signed_request);

	// You could save this information in the user session if needed
	var signedRequest = decode(req.body.signed_request, signedRequestConsumerSecret);

	console.log("I decoded signedrequest", signedRequest);

	var context = signedRequest.context,
		oauthToken = signedRequest.client.oauthToken,
		instanceUrl = signedRequest.client.instanceUrl;

	// this is not necessary but documented here for demo
	var query = "SELECT Id, FirstName, LastName, Phone, Email FROM Contact WHERE Id = '" + context.environment.record.Id + "'";

	var contactRequest = {
		url: instanceUrl + "/services/data/v52.0/query?q=" + query,
		headers: {
			Authorization: "OAuth " + oauthToken,
		},
	};

	request(contactRequest, function (err, response, body) {
		console.log("Contact from API response", response);

		var contact = context.environment.record,
			text = "MECARD:N:" + contact.LastName + "," + contact.FirstName + ";TEL:" + contact.Phone + ";EMAIL:" + contact.Email + ";;";

		console.log("Contact from signed request context", contact);

		QRCode.toDataURL(text, function (err, url) {
			res.render("index", { context: context, imgSrc: url, sr: JSON.stringify(signedRequest) });
		});
	});
});

app.get("/oauth", function (req, res) {
	console.log("oauth", req.body, req.params, req.query);
	res.render("oauth", { consumerKey: oAuthUAFConsumerKey });
});

app.get("/oauth2", function (req, res) {
	console.log("oauth2", req.body, req.params, req.query);
	console.log("redirecting to oauth2 auth url");
	oauth2.loginUrl = req.query.loginUrl;
	res.redirect(oauth2.getAuthorizationUrl({ scope: "api id web" }));
});

app.get("/oauth2/callback", function (req, res) {
	console.log("oauth2 callback", req.body, req.params, req.query);
	var conn = new jsforce.Connection({ oauth2: oauth2 });
	var code = req.query.code;
	conn.authorize(code, function (err, userInfo) {
		if (err) {
			return console.error(err);
		}
		console.log('authorize response', conn, userInfo);
		res.render("oauth2", {conn: conn});
	});
});

app.set("port", process.env.PORT || 5000);

app.listen(app.get("port"), function () {
	console.log("Express server listening on port " + app.get("port"));
});
