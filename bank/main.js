//NODE MODULES
var http = require('http');
var request = require('request');
var express = require('express');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var path = require('path');
var session = require('express-session');
var bigInt = require('big-integer');
var Hashes = require('jshashes');
var fs = require('fs');

//EXTERNAL JS
eval(fs.readFileSync('./../public/blind.js').toString());
eval(fs.readFileSync('./../public/proof.js').toString());
eval(fs.readFileSync('./../public/rsa.js').toString());
var KEYSIZE = bigInt(2);
KEYSIZE = KEYSIZE.pow(128);
generateKeys(KEYSIZE);
var keys=fetchKeys();

var PORT=8081;
var ttpName='127:0.0.1:8070/';

//MONGO CONF
var mongo = require('mongodb').MongoClient;
var database='CITIE2';
var url = "mongodb://localhost:27017/"+database;

//EXPRESS CONF
var app = express();
app.set('views',__dirname);
app.engine('html', require('ejs').renderFile);
app.use(express.static(path.join(__dirname,'../public')));
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json());
app.use(cookieParser('auth'));
app.use(session({
	secret: 'secret',
	resave: true,
	saveUninitialized: true}));






var auth = function(req, res, next){
	if(req.session){
		mongo.connect(url, function(err, db){
			if(err) throw err;
			var datab = db.db(database);
			var collection = datab.collection('users');
			collection.findOne({'username':req.session.user}, function(err, result){
				if(result!=null) return next();
				else res.render('main.html');
				});
		});
	}
	else	return res.render('main.html');
}


mongo.connect(url, function(err, db) {
	if (err) throw err;
	console.log("Database connected");
});


app.get('/', function (req,res){
	if(req.session.user===undefined) res.render('main.html');
	else res.render('profile.html');
});

app.post('/login', function (req,res){
	mongo.connect(url, function(err, db){
		console.log('/LOGIN ');
		if(err)throw err;
		var datab = db.db(database);
		var collection = datab.collection('users');
		collection.findOne({'username':req.body.username}, function(err, result){
		if(result==null) res.send({'status':'failure','info':'Invalid username'});
		else if(result.password!=req.body.password) res.send({'status':'failure','info':'Invalid password'});
				else{
				req.session.user = result.username;
					req.session.admin = false;
					res.send({'status':'success'});
				}		
		});		
	});
});

app.post('/register', function(req,res){
	console.log('/REGISTER ');
	mongo.connect(url, function(err, db){
		if(err)throw err;
		var datab = db.db(database);
		var collection = datab.collection('users');
		collection.findOne({'username':req.body.username}, function(err, result){
			if(!(result===null)) res.send({'status':'failure','info':'Username already exists.'});
			else{
				collection.insertOne(req.body, function(err, result){
					if(err) throw err;
					if(result==null) res.send({'status':'failure','info':'Database failure.'});
						else res.send({'status':'success'});
				});
			} 
		});
	});		
});

app.get('/logout', function(req,res){
	req.session.destroy();
	res.render('main.html');
});

app.get('/profile', auth, function(req,res){
	console.log('OK');
	res.render('profile.html');	
});

app.get('/userData', auth, function(req,res){
	console.log('GET /userData');
	var username = req.session.user;
	mongo.connect(url, function(err, db){
		if(err)throw err;
		var datab = db.db(database);
		var collection = datab.collection('users');
		collection.findOne({'username':username}, function(err, result){
			if(!(result===null)){
				 var ans={'status':'success','username':result.username,'balance':'Inf'}; // for testing purposes users have infinite money
				 res.send(ans);
			 }
			else res.send({'status':'failure','info':'Database error.'}); 
		});
	});		
});

app.post('/exchangeCoin', function(req,res){
	mongo.connect(url, function(err, db){
		var _id = unsign(req.body.id);
	    if(_id.charCodeAt(0) != 53 || 
	    _id.charCodeAt(1) != 53 || 
	    _id.charCodeAt(2) != 53 || 
	    _id.charCodeAt(3) != 53 || 
	    _id.charCodeAt(4) != 53) res.send({'status':'failure','info':'Signature seems forged.'}); 
		if(err)throw err;
		var datab = db.db(database);
		var collection = datab.collection('coin');
		collection.findOne({'id':_id}, function(err, result){
			if(!(result===null)) res.send({'status':'failure','info':'Coin already spent.'});
			else{
				collection.insertOne(req.body, function(err, result){
					if(err) throw err;
					if(result==null) res.send({'status':'failure','info':'Database failure.'});
						else{
						var newId = bigInt("55555" + bigInt.randBetween(0,2e256).toString());
						res.send({'status':'success','coin':sign(newId)});
					}
				});
			} 
		});
	});
});
// signs a blind coin
app.post('/signCoin', function(req,res){
	console.log('POST /signCoin\n');
	var signature = sign(req.body.id);
	var K = createVolatileKeys(2e256);
	signature = applyKeys(signature,K.d,K.n);
	var proof = bigInt(generateProof('TTP','bank',K.n.toString()),16);
	proof = sign(proof);
	request.post(
	'http://127.0.0.1:8080/receiveKey',
	{ json: {
		'origin':'bank',
		'destination':'TTP',
		'value':K.n.toString(),
		'proof':proof,
		'e':keys.e.toString(),
		'n':keys.n.toString() }},
	function(error,response,body){
	});
	res.send({'status':'success','signature':signature});
});

app.get('/test', function(req,res){
	request.post(
	'http://127.0.0.1:8080/receiveKey',
	{ json: {'origin':'bank',
		'destination':'TTP',
		'value':434343,
		'proof':sign(bigInt(generateProof('TTP','bank',434343),16)),
		'e':keys.e.toString(),
		'n':keys.n.toString()}
	},
	function(error,response,body){
	});
});
app.get('/key', function(req,res){
	res.send({'e':fetchKeys().e.toString(),'n':fetchKeys().n.toString()});
});

var server = app.listen(PORT);
console.log('OK');
