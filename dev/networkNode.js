const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const Blockchain = require("./blockchain");
const { v4: uuidv4 } = require('uuid');
const port = process.argv[2];
const rp = require('request-promise');

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

app.post('/register-and-blroadcast-node' , function(req , res){
	const newNodeUrl = req.body.newNodeUrl;
	if(myCoin.networkNodes.indexOf(newNodeUrl) == -1)
		myCoin.networkNodes.push(newNodeUrl);

	const regNodesPromises = [];
	myCoin.networkNodes.forEach(networkNodeUrl => {
		const requestOptions = {
			uri: networkNodeUrl + '/register-node' , 
			method: 'POST' , 
			body: { newNodeUrl: newNodeUrl } , 
			json: true
		};

		regNodesPromises.push(rp(requestOptions));
	});

	Promise.all(regNodesPromises)
	.then(data => {
		const bulkRegisterOptions = {
			uri: newNodeUrl + '/register-nodes-bulk' , 
			method: 'POST' , 
			body: { allNetworkNodes: [ ...myCoin.networkNodes, myCoin.currentNodeUrl] } , 
			json: true
		};

		return rp(bulkRegisterOptions);
	})
	.then(data => {
		res.json({note: 'New Node registred with network successfully'});
	});
});

app.post('/register-node' , function(req,res) {
	const newNodeUrl = req.body.newNodeUrl;
	const nodeNotAlreadyPresent = myCoin.networkNodes.indexOf(newNodeUrl == -1);
	const notCurrentNode = myCoin.currentNodeUrl !== newNodeUrl;
	if(nodeNotAlreadyPresent && notCurrentNode)
		myCoin.networkNodes.push(newNodeUrl);
	res.json({ note: 'New Node registered successfully with node.' });
});

app.post('/register-nodes-bulk' , function(req,res) {
	const allNetworkNodes = req.body.allNetworkNodes;
	allNetworkNodes.forEach(networkNodeUrl => {
		const nodeNotAlreadyPresent = myCoin.networkNodes.indexOf(networkNodeUrl) == -1;
		const notCurrentNode = myCoin.currentNodeUrl !== networkNodeUrl;
		if(nodeNotAlreadyPresent && notCurrentNode) 
			myCoin.networkNodes.push(networkNodeUrl);
	});
	res.json({ note: 'Bulk registeration successful.' });
});


app.listen(port, function() {
	console.log(`listening on port ${port} ... `);
});