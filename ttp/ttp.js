var express = require('express');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var path = require('path');
var session = require('express-session');
var bigInt = require('big-integer');
var fs = require('fs');
var Hashes = require('jshashes');

//EXTERNAL JS
eval(fs.readFileSync('./../public/proof.js').toString());
eval(fs.readFileSync('./../public/blind.js').toString());

var KEYSIZE = bigInt("2");
KEYSIZE = KEYSIZE.pow(512);
generateKeys(KEYSIZE);
var keys=fetchKeys();



var app = express();
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json());

var key = null;

app.post('/receiveKey', function(req,res){
	console.log("KEY RECEIVED FROM " + req.body.origin);
	var unsignedProofHex = bigInt(unsignWithValues(req.body.proof,req.body.e,req.body.n)).toString(16);
	if(checkProof(unsignedProofHex,req.body.destination,req.body.origin,req.body.value)){
		key = req.body.value;
		res.sendStatus(200);
		console.log("proof OK");
		}
	else{
		res.sendStatus(400);
		console.log("couldn't verify proof");
	}
});

app.get('/sendKey', function(req,res){
	var destination=req.connection.remoteAddress+":"+req.connection.remotePort;
	console.log("KEY REQUEST FROM " + destination);
	var proof = generateProof(destination,'TTP',key);
	proof = bigInt(proof,16).toString();
	if(key==null){
	console.log("key not defined"); 
	res.sendStatus(403);
	}
	else{	
		proof = bigInt(proof);
		proof = proof.modPow(keys.d,keys.n).toString();
		res.send("handle({'origin':'TTP','destination':'"+destination+"','value':'"+key+"','proof':'"+proof+"','e':'"+keys.e.toString()+"','n':'"+keys.n.toString()+"'});");		
	}
});


var server = app.listen(8080);
console.log('TTP OK');




