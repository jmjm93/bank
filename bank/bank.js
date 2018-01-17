//NODE MODULES
var http = require('http');
var request = require('request');
var express = require('express');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var path = require('path');
var session = require('express-session');
var bigInt = require('big-integer');
var bignum = require('bignum');
var Hashes = require('jshashes');
var fs = require('fs');



//EXTERNAL JS
eval(fs.readFileSync('./../public/proof.js').toString());
eval(fs.readFileSync('./../public/rsa.js').toString());

//SETTINGS
var COINSIZE = bigInt(2e32); // coin random number generator size = 2e64
var RANDOM_KEY_LENGTH = 128; // size of the keys for non-rebuttal protocol

var KEYLENGTH = 64; // key length for client and bank keys
eval(fs.readFileSync('./../keys/keys'+KEYLENGTH+'.js').toString());

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
});


app.get('/', function (req,res){
	if(req.session.user===undefined) res.render('main.html');
	else res.render('profile.html');
});

app.post('/login', function (req,res){
	mongo.connect(url, function(err, db){
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
	res.render('profile.html');	
});

app.get('/userData', auth, function(req,res){
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
		var _id = applyKeys(req.body.id,serverKeys.e,serverKeys.n);//unsign(req.body.id);
		var ans = {};    
	if(_id.charCodeAt(0) != 53 || 
	    _id.charCodeAt(1) != 53 || 
	    _id.charCodeAt(2) != 53 || 
	    _id.charCodeAt(3) != 53 || 
	    _id.charCodeAt(4) != 53) res.send({'status':'failure','info':'Signature seems forged.'}); 
		else{
			if(err)throw err;
			var datab = db.db(database);
			var collection = datab.collection('coin');
			collection.findOne({'id':_id}, function(err, result){
				if(!(result===null)) res.send({'status':'failure','info':'Coin already spent.'});
				else{
					collection.insertOne({'id':_id}, function(err, result){
						if(!(result===null)){
							var newId = bigInt("55555" + bigInt.randBetween(0,COINSIZE).toString());
							ans=({'status':'success','coin':applyKeys(newId,serverKeys.d,serverKeys.n)});
							res.send(ans);
						}
					});
				} 
			});
	}
	});
});
// signs a blind coin
app.post('/signCoin', function(req,res){

	var proof_origin = req.body.proof;
	proof_origin = applyKeys(proof_origin,req.body.e,req.body.n);
	proof_origin = bigInt(proof_origin).toString(16);
	if(!checkProof(proof_origin,'bank','client',req.body.id)){
		res.send({'status':'failure','info':'Couldn\'t verify proof of origin'});
	}
	else{
		var signature = applyKeys(req.body.id,serverKeys.d,serverKeys.n);
		var K = generateKeys('2e'+RANDOM_KEY_LENGTH);
		signature = applyKeys(signature,K.d,K.n);
		var proof = bigInt(generateProof('TTP','bank',K.n.toString()),16);
		proof = applyKeys(proof,serverKeys.d,serverKeys.n);
		var proof_reception = generateProof('client','bank',signature);
		proof_reception = bigInt(proof_reception,16);
		proof_reception = applyKeys(proof_reception,serverKeys.d,serverKeys.n);
		request.post(  // sends encryption key to the TTP
		'http://127.0.0.1:8080/receiveKey',
		{ json: {
			'origin':'bank',
			'destination':'TTP',
			'value':K.n.toString(),
			'proof':proof,
			'e':serverKeys.e.toString(),
			'n':serverKeys.n.toString() }},
		function(error,response,body){
		});
		res.send({'status':'success','signature':signature,'proof':proof_reception}); // sends encrypted signed blinded document to client
	}
});

app.get('/key', function(req,res){
	res.send({'e':serverKeys.e,'n':serverKeys.n,'client':clientKeys});
});

var server = app.listen(PORT);
console.log('BANK RUNNING ON ' + PORT);
