###### Bank
A bank server with a mongo-based back-end, it has authentication capabilites and it allows a logged user to receive a signature for a coin without ever knowing that coin identifier.

On demand, the user generates a random number, blinds it and sends it to the server, the server then signs the blind message, encrypts it with a newly generated key, and sends it back to the client. The encryption key used is then sent to a TTP together with a proof, and the TTP will then forward it to the user on demand.

When the user finally receives the coin it's displayed in a box in case he wants to store it manually, but it's also sent to a wallet (if any) that'll authomatically store it on another local mongo database, more information below.

It has another end-point in which someone will send a coin identifier and the bank will then query its database to see whether that particular coin has been spent already.

All coin IDs have the "55555" pattern preceding it, if the pattern is missing after extracting the bank signature, that means that the coin is fake. 

###### Trusted Third Party AKA TTP
A simple server that receives an encryption key and forwards it to anyone that requests it via a specific end-point. When the key is published to a client it's sent together with a signed proof. The public key to verify the signature is accessible to anyone via another end-point.

###### Wallet
A local application. It generates an user-friendly display on the client browser of the available coins, the user can select a coin and fetch its signature number directly to its clipboard to be pasted on request, without having to do so manually.

