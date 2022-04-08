const Web3 = require("web3");

// async function main() {
//   // Configuring the connection to an Ethereum node
//   const network = process.env.ETHEREUM_NETWORK;
//   const web3 = new Web3(
//     new Web3.providers.HttpProvider(
//       `https://${network}.infura.io/v3/${process.env.INFURA_PROJECT_ID}`
//     )
//   );
//   // Creating a signing account from a private key
//   const signer = web3.eth.accounts.privateKeyToAccount(
//     process.env.SIGNER_PRIVATE_KEY
//   );
//   web3.eth.accounts.wallet.add(signer);
//   // Creating the transaction object
//   const tx = {
//     from: signer.address,
//     to: "0x68108C8C57A1e0C9A9841B901D81ED2E4a823377",
//     value: web3.utils.toWei("0.001"),
//     maxPriorityFeePerGas: web3.utils.toWei("98", "gwei"),
//     maxFeePerGas: web3.utils.toWei("98", "gwei")
//   };

//   // Assigning the right amount of gas
//   tx.gas = await web3.eth.estimateGas(tx);

//   console.log(tx)
//   // Sending the transaction to the network
//   const receipt = await web3.eth
//     .sendTransaction(tx)
//     .once("transactionHash", (txhash) => {
//       console.log(`Mining transaction ...`);
//       console.log(`https://${network}.etherscan.io/tx/${txhash}`);
//     });
//   // The transaction is now on chain!
//   console.log(`Mined in block ${receipt.blockNumber}`);
// }

async function main() {
  const ACCOUNT_MAPPING = {
    1: "0x68108C8C57A1e0C9A9841B901D81ED2E4a823377",
    2: "0x43C0f22142337C0f938931F55Dfe21619375DB87",
  };
  receipt = "0x68108C8C57A1e0C9A9841B901D81ED2E4a823377";
  a = Object.keys(ACCOUNT_MAPPING).find((key) => ACCOUNT_MAPPING[key] === receipt);
  console.log(receipt)
  console.log(typeof receipt)
  console.log(a)
}

require("dotenv").config();
main();
