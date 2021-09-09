var express = require('express'),
    bodyParser = require('body-parser'),
    // request = require('request'),
    QRCode = require('qrcode'),
    decode = require('salesforce-signed-request'),

    consumerSecret = process.env.CONSUMER_SECRET,

    app = express();

app.set('view engine', 'ejs');
app.use(bodyParser()); // pull information from html in POST
app.use(express.static(__dirname + '/public'));

app.post('/signedrequest', function(req, res) {

    // You could save this information in the user session if needed
    var signedRequest = decode(req.body.signed_request, consumerSecret),
        context = signedRequest.context;//,
        oauthToken = signedRequest.client.oauthToken,
        instanceUrl = signedRequest.client.instanceUrl,

        this is not necessary but documented here for demo
        query = "SELECT Id, FirstName, LastName, Phone, Email FROM Contact WHERE Id = '" + context.environment.record.Id + "'",

        contactRequest = {
            url: instanceUrl + '/services/data/v52.0/query?q=' + query,
            headers: {
                'Authorization': 'OAuth ' + oauthToken
            }
        };

    request(contactRequest, function(err, response, body) {
        var contact = context.environment.record,
            text = 'MECARD:N:' + contact.LastName + ',' + contact.FirstName + ';TEL:' + contact.Phone + ';EMAIL:' + contact.Email + ';;';
        QRCode.toDataURL(text, function(err, url) {
            res.render('index', {context: context, imgUrl: url, sr: JSON.stringify(signedRequest)});
        });
    });
});

app.get('/oauth', function(req, res) {
    res.render('oauth');
});

app.set('port', process.env.PORT || 5000);

app.listen(app.get('port'), function () {
    console.log('Express server listening on port ' + app.get('port'));
});