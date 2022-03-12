const Blockchain = require("./blockchain");

const bitcoin = new Blockchain();

console.log(bitcoin);

const previousBlockHash = 'skdfjoiahfoiajdaweiophfauiohfaioefjf';
const currentBlockData = [
	{
		amount: 10,
		sender: 'dfklsjdflksjfl;ksdjflsjd;fksdjf',
		recipient: 'eiuropiwtdsklnvkjnfdsfksfjjfdfsdfa',
	} , 
	{
		amount: 100,
		sender: 'dfklsjdflkssdfjfl;ksdjflsjd;fksdjf',
		recipient: 'eiuropiwsdfsdtdsklnvkjnfdsfksfjjfdfsdfa',
	} , 
	{
		amount: 20,
		sender: 'dfklsjdflksfdsfsjfl;ksdjflsjd;fksdjf',
		recipient: 'eiursdfsdopiwtdsklnvkjnfdsfksfjjfdfsdfa',
	} , 
	{
		amount: 150,
		sender: 'dfklsjdflksjfl;ksdjflsshfghfjd;fksdjf',
		recipient: 'eiurfghfghopiwtdsklnvkjnfdsfksfjjfdfsdfa',
	} , 
	{
		amount: 110,
		sender: 'dfklsjdflksjfl;ksdjflqweqwesjd;fksfsddjf',
		recipient: 'eiuropcssdciwtdsklnvkjnfdsfksfjjfdfsdfa',
	} 
];

const nonce = bitcoin.proofOfWork(previousBlockHash, currentBlockData);

console.log(nonce , bitcoin.hashBlock(previousBlockHash, currentBlockData , nonce));