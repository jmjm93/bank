//whether this is running on the client or on the server, the values inside this variable should be the ones from the bank
// in the case of the client it'll only contain the public values, since the client should never call the sign method
var key;

function setKeys(exp,mod)
{
	key = {'n':bigInt(mod),'e':bigInt(exp)};
}
function generateKeys(size)
{
	var p = bigInt.randBetween(0,size);
        while(!p.isPrime())
            p = bigInt.randBetween(0,size);
        var q = bigInt.randBetween(0,size);
        while(!q.isPrime())
            q = bigInt.randBetween(0,size);
        var n = p.multiply(q);
        var _p = p.subtract(1);
        var _q = q.subtract(1);
        var totient = _p.multiply(_q);
        var e = bigInt("65537");
        while(!(e.isPrime() && bigInt.gcd(e,totient)==1))
            e = bigInt.randBetween(0,size);
        var d = e.modInv(totient);
        key = {'n':n,'e':e,'d':d};
}

function fetchKeys()
{
	return key;
}

function sign(message)
{
	if(key!=undefined){
    var d = key.d;
    var n = key.n;
    var value = bigInt(message);
    var sigma = value.modPow(d,n);
    return sigma.toString();
	}
}

function unsign(signature)
{
    var e = key.e;
    var n = key.n;
    var value = bigInt(signature);
    var message = value.modPow(e,n);
    return message.toString();
}

function blind(message)
{
    if(!(typeof(message)==='string')) throw "Message must be a string";
    var e = key.e;
    var n = key.n;
    var r = bigInt.randBetween(0,n);
    while(!r.isPrime() || bigInt.gcd(r,n).compare(1)>0) r = bigInt.randBetween(0,n);


    var msgValue = bigInt(message);
    var blindedMessage = msgValue.multiply(r.modPow(e,n));
    var ans = {};
    ans["blindedMessage"] = blindedMessage.toString();
    ans["blindFactor"] = r.toString();
    return ans;
}


function unblind(message,factor)
{
    if(!(typeof(message)==='string')) throw "Message must be a string";
    var n = key.n;
    var r = bigInt(factor);
    var msgValue = bigInt(message);
    var sigmaUnblinded = msgValue.multiply(r.modInv(n));
    return sigmaUnblinded.toString();
}


function string2Int(string){
    var binaryValue = "";
    for (var i = 0; i < string.length; ++i) {
        var code = string.charCodeAt(i);
        binaryValue = binaryValue.concat(dec2Bin(code, 8));
    }
    return bigInt(binaryValue, 2);
}

function dec2Bin(dec,length){
    var out = "";
    while(length--)
        out += (dec >> length ) & 1;
    return out;
}

function int2String(int){
    var mrx = int.toString(16);
    var bytes = [];
    for (var i = 0; i < mrx.length; i += 2) {
        var byte = parseInt(mrx.substring(i, i + 2), 16);
        if (byte > 127) {
            byte = -(~byte & 0xFF) - 1;
        }
        bytes.push(byte);
    }
    var result = "";
    for (var i = 0; i < bytes.length; i++) {
        result += String.fromCharCode(parseInt(bytes[i]));
    }
    return result;
}
