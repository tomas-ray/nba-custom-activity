'use strict';
// Module Dependencies
// -------------------
var express     = require('express');
var bodyParser  = require('body-parser');
var errorhandler = require('errorhandler');
var http        = require('http');
var path        = require('path');
var request     = require('request');
var routes      = require('./routes/index');
var activity    = require('./routes/activity');
var JWT         = require('./lib/jwtDecoder');
// EXPRESS CONFIGURATION
var app = express();


console.log('IN APP.JS - >');

// Configure Express
app.set('port', process.env.PORT || 3000);
app.use(bodyParser.raw({type: 'application/jwt'}));
app.use(express.static(path.join(__dirname, 'nba')));
app.use(bodyParser.urlencoded({ extended: true }));
//app.use(bodyParser.json());

// Express in Development Mode
if ('development' == app.get('env')) {
  console.log('express development');
  app.use(errorhandler());
}

app.get('/nba/', routes.init);



app.post('/nba/login', routes.login);
app.post('/nba/logout', routes.logout);
app.get('/nba/index.html', routes.login);
app.get('/nba/js/require.js', routes.require);
app.get('/nba/config.json', routes.config);
app.get('/nba/js/postmonger.js', routes.postmonger);
app.get('/nba/js/customActivity.js', routes.customActivity);
app.get('/nba/js/jquery-3.4.1.min.js', routes.jquery);
app.get('/nba/images/icon.PNG', routes.image);

//logs
app.get('/nba/logs/jsLogs.txt', routes.logs);

// Custom Routes for MC
app.post('/nba/journeybuilder/save/', activity.save);
app.post('/nba/journeybuilder/validate/', activity.validate );
app.post('/nba/journeybuilder/publish/', activity.publish );
app.post('/nba/journeybuilder/execute/', activity.execute );
app.post('/nba/journeybuilder/stop/', activity.stop );


http.createServer(app).listen(
  app.get('port'), function(){
    console.log('Express server listening on port ' + app.get('port'));
  }
);
  