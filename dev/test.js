const Blockchain = require("./blockchain");

const myCoin = new Blockchain();

console.log(myCoin);

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

const nonce = myCoin.proofOfWork(previousBlockHash, currentBlockData);

console.log(nonce , myCoin.hashBlock(previousBlockHash, currentBlockData , nonce));