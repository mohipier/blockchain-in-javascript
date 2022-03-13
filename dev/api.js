const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const Blockchain = require("./blockchain");
const { v4: uuidv4 } = require('uuid');

const nodeAddress = uuidv4().split('-').join('');

const myCoin = new Blockchain();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

app.get("/blockchain" , function(req,res) {
	res.send(myCoin);
});

app.post("/transaction" , function(req,res) {
	const blockIndex = myCoin.createNewTransaction(req.body.amount , req.body.sender , req.body.recipient);
	res.json({note: `transaction will be added in block ${blockIndex}.`});
});

app.get("/mine" , function(req,res) {
	const lastBlock = myCoin.getLastBlock();
	const previousBlockHash = lastBlock['hash'];
	const currentBlockData = {
		transaction: myCoin.pendingTransactions,
		index: lastBlock['index'] + 1
	}

	const nonce = myCoin.proofOfWork(previousBlockHash , currentBlockData);
	const blockHash = myCoin.hashBlock(previousBlockHash , currentBlockData, nonce);

	myCoin.createNewTransaction(12.5 , "00", nodeAddress);

	const newBlock = myCoin.createNewBlock(nonce , previousBlockHash , blockHash);
	res.json({
		note: "new Block mined successfully" , 
		block: newBlock
	});
});


app.listen(3000, function() {
	console.log("listening on port 3000 ... ");
});