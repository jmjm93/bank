
/**
 * Generates a proof ready to be sent to someone.
 * @param destination the destination of the message
 * @param origin the origin of the message
 * @param data the message
 * @param mod the module needed for the signature, in a numeric string
 * @param key the private key to use for the signature, in a numeric string
 * @returns {string} a string containing the hash of the proof
 */
function generateProof(destination,origin,data)
{
    var MD5 = new Hashes.MD5;
    var proof = MD5.hex(destination+","+origin+","+data);
    return proof;
}

function checkProof(proofToCheck,destination,origin,data)
{
	var MD5 = new Hashes.MD5;
	var proof = MD5.hex(destination+","+origin+","+data);
	return(proof===proofToCheck);
}
