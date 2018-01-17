
function generateProof(destination,origin,data)
{
    var MD5 = new Hashes.MD5;
    var proof = MD5.hex(destination+","+origin+","+data);
    if(proof.charCodeAt(0)==48) proof=proof.substr(1); //if the most significant character is a 0 it's removed to simplify datatype conversion
    return proof;
}

function checkProof(proofToCheck,destination,origin,data)
{
	var MD5 = new Hashes.MD5;
	var proof = MD5.hex(destination+","+origin+","+data);
	if(proof.charCodeAt(0)==48) proof=proof.substr(1);
	return(proof===proofToCheck);
}
