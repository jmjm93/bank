// public keys of the signing part
var key;

function setKeys(exp,mod,priv)
{
	key = {'n':bigInt(mod),'e':bigInt(exp),'d':bigInt(priv)};
}


function fetchKeys()
{
	return key;
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
