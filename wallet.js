
var express = require('express');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var path = require('path');

var PORT=8070;

//MONGO CONF
var mongo = require('mongodb').MongoClient;
var database='wallet';
var url = "mongodb://localhost:27017/"+database;

//EXPRESS CONF
var app = express();
app.set('views',__dirname);
app.engine('html', require('ejs').renderFile);
app.use(express.static(path.join(__dirname,'public')));
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json());
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});



mongo.connect(url, function(err, db) {
        if (err) throw err;
        console.log("Database connected");
});

app.get('/', function(req,res){
	res.render('wallet.html');
});

app.post('/insertCoin', function(req,res, next){
	console.log("INSERT COIN");
	mongo.connect(url, function(err, db){
                if(err)throw err;
                var datab = db.db(database);
                var collection = datab.collection('coins');
                collection.findOne({'id':req.body.id}, function(err, result){
                        if((result===null)) collection.insertOne({'id':req.body.id,'signature':req.body.signature});
                });
        });

});

app.get('/fetchWallet', function(req,res){
	mongo.connect(url, function(err, db){
	if(err)throw err;
	var datab = db.db(database);
	var collection = datab.collection('coins');
	collection.find({}).toArray(function(err, result){ res.send(result);});
	});
});

var server = app.listen(PORT);
