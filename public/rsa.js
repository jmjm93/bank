
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
        return {'n':n,'e':e,'d':d};
}


function applyKeys(input,e,n)
{
        var value = bigInt(input);
        var message = value.modPow(bigInt(e),bigInt(n));
        return message.toString();
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
