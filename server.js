var express = require('express'),
    request = require('request'),
    QRCode = require('qrcode'),
    decode = require('salesforce-signed-request'),
    consumerKey = process.env.CONSUMER_KEY,
    consumerSecret = process.env.CONSUMER_SECRET,
    app = express();

app.set('view engine', 'ejs');
app.use(express.json());
app.use(express.urlencoded({
  extended: true
}));
app.use(express.static(__dirname + '/public'));

app.post('/signedrequest', function(req, res) {
    console.log('I got signedrequest', req.body.signed_request);

    // You could save this information in the user session if needed
    var signedRequest = decode(req.body.signed_request, consumerSecret);

    console.log('I decoded signedrequest', signedRequest);

    var context = signedRequest.context,
        oauthToken = signedRequest.client.oauthToken,
        instanceUrl = signedRequest.client.instanceUrl;

    // this is not necessary but documented here for demo
    var query = "SELECT Id, FirstName, LastName, Phone, Email FROM Contact WHERE Id = '" + context.environment.record.Id + "'";

    var contactRequest = {
        url: instanceUrl + '/services/data/v52.0/query?q=' + query,
        headers: {
            'Authorization': 'OAuth ' + oauthToken
        }
    };

    request(contactRequest, function(err, response, body) {
        console.log('Contact from API response', response);

        var contact = context.environment.record,
            text = 'MECARD:N:' + contact.LastName + ',' + contact.FirstName + ';TEL:' + contact.Phone + ';EMAIL:' + contact.Email + ';;';

        console.log('Contact from signed request context', contact);

        QRCode.toDataURL(text, function(err, url) {
            res.render('index', {context: context, imgSrc: url, sr: JSON.stringify(signedRequest)});
        });
    });
});

app.get('/oauth', function(req, res) {
    res.render('oauth', {consumerKey: consumerKey});
});

app.set('port', process.env.PORT || 5000);

app.listen(app.get('port'), function () {
    console.log('Express server listening on port ' + app.get('port'));
});