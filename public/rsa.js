// auxiliar module for inmediate, non-commital key generation/encryption methods

function createVolatileKeys(size)
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

