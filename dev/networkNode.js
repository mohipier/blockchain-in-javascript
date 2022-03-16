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
	const newTransaction = req.body;
	const blockIndex = myCoin.addTransactionToPendingTransactions(newTransaction);
	res.json({ note: `Transaction will be added in block ${blockIndex}.`})
});

app.post("/transaction/broadcast" , function(req,res) {
	const newTransaction = myCoin.createNewTransaction(req.body.amount , req.body.sender , req.body.recipient);
	myCoin.addTransactionToPendingTransactions(newTransaction);

	const requestPromises = [];
	myCoin.networkNodes.forEach(networkNodeUrl => {
		const requestOptions = {
			uri: networkNodeUrl + '/transaction' , 
			method: 'POST' , 
			body: newTransaction,
			json: true
		};
		requestPromises.push(rp(requestOptions));
	});

	Promise.all(requestPromises)
	.then(data => {
		res.json({ note: 'Transaction created and broadcast successfully.' });
	});
});

app.get("/mine" , function(req,res) {
	const lastBlock = myCoin.getLastBlock();
	const previousBlockHash = lastBlock['hash'];
	const currentBlockData = {
		transactions: myCoin.pendingTransactions,
		index: lastBlock['index'] + 1
	}

	const nonce = myCoin.proofOfWork(previousBlockHash , currentBlockData);
	const blockHash = myCoin.hashBlock(previousBlockHash , currentBlockData, nonce);
	const newBlock = myCoin.createNewBlock(nonce , previousBlockHash , blockHash);
	
	const requestPromises = [];
	myCoin.networkNodes.forEach(networkNodeUrl => {
		const requestOptions = {
			uri: networkNodeUrl + '/receive-new-block' , 
			method: 'POST',
			body: { newBlock: newBlock } , 
			json: true
		}

		requestPromises.push(rp(requestOptions));
	});

	Promise.all(requestPromises)
	.then(data => {
		const requestOptions = {
			uri: myCoin.currentNodeUrl + '/transaction/broadcast' , 
			method: 'POST',
			body: { 
				amount: 12.5 , 
				sender: "00" ,
				recipient : nodeAddress
			} , 
			json: true
		}

		return rp(requestOptions);
	})
	.then(data => {
		res.json({
			note: "new Block mined and broadcast successfully" , 
			block: newBlock
		});
	}); 
});

app.post('/receive-new-block' , function(req , res){
	const newBlock = req.body.newBlock;
	const lastBlock = myCoin.getLastBlock();
	const correctHash = lastBlock.hash === newBlock.previousBlockHash;
	const correctIndex = lastBlock['index'] + 1 === newBlock['index'];
	if(correctHash && correctIndex) {
		myCoin.chain.push(newBlock);
		myCoin.pendingTransactions = [];
		res.json({
			note: 'New block receive and accepted.',
			newBlock: newBlock
		});
	} else {
		res.json({
			note: 'New block rejected' , 
			newBlock: newBlock
		})
	}
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

app.get('/consensus' , function(req,res) {
	const requestPromises = [];
	myCoin.networkNodes.forEach(networkNodeUrl => {
		const requestOptions = {
			uri: networkNodeUrl + '/blockchain' , 
			method: 'GET' , 
			json: true
		};

		requestPromises.push(rp(requestOptions));
	});

	Promise.all(requestPromises)
	.then(blockchains => {
		const currentChainLength = myCoin.chain.length;
		let maxChainLength = currentChainLength;
		let newLongestChain = null;
		let newPendingTransactions = null;

		blockchains.forEach(blockchain => {
			if(blockchain.chain.length > maxChainLength) {
				maxChainLength = blockchain.chain.length;
				newLongestChain = blockchain.chain;
				newPendingTransactions = blockchain.pendingTransactions;
			}
		});

		if(!newLongestChain || (newLongestChain && !myCoin.chainIsValid(newLongestChain))) {
			res.json({
				note: 'Current chain has not been replaced.',
				chain: myCoin.chain
			})		
		} else {
			myCoin.chain = newLongestChain;
			myCoin.pendingTransactions = newPendingTransactions;
			res.json({
				note: 'This chain has been replaced.' , 
				chain: myCoin.chain
			})
		}
	});

});

app.get('/block/:blockHash' , function(req,res) {
	const blockHash = req.params.blockHash;
	const correctBlock = myCoin.getBlock(blockHash);
	res.json({
		block: correctBlock
	})
});

app.get('/transaction/:transactionId' , function(req,res) {
	const transactionId = req.params.transactionId;
	const transactionData = myCoin.getTransaction(transactionId);
	res.json({
		transaction: transactionData.transaction,
		block: transactionData.block
	});
});

app.get('/address/:address' , function(req,res) {
	const address = req.params.address;
	const addressData = myCoin.getAddressData(address);
	res.json({
		addressData: addressData
	});
});

app.get('/block-explorer' , function(req,res) {
	res.sendFile('./block-explorer/index.html' , { root: __dirname });
});


app.listen(port, function() {
	console.log(`listening on port ${port} ... `);
});