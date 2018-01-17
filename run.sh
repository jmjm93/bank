#!/bin/bash
service mongod start
cd bank
node bank.js&
cd ..
cd ttp
node ttp.js&
cd ..
cd wallet
node wallet.js&
