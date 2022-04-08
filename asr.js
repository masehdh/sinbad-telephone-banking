// GPT3
const { Configuration, OpenAIApi } = require("openai");
require("dotenv").config();

// Vonage
const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const Vonage = require("@vonage/server-sdk");
const vonage = new Vonage({
  apiKey: process.env.VONAGE_API_KEY,
  apiSecret: process.env.VONAGE_SECRET,
});

// Web3
const Web3 = require("web3");
const network = process.env.ETHEREUM_NETWORK;
const web3 = new Web3(
  new Web3.providers.HttpProvider(
    `https://${network}.infura.io/v3/${process.env.INFURA_PROJECT_ID}`
  )
);
// Creating a signing account from a private key
const signer = web3.eth.accounts.privateKeyToAccount(
  process.env.SIGNER_PRIVATE_KEY
);
web3.eth.accounts.wallet.add(signer);

//  Stand in list of existing account numbers for validate_transfer_recipient
const ALLOWED_ACCOUNT_NUMBERS = [1, 2, 3, 4, 5];
const ACCOUNT_MAPPING = {
  1: "0x68108c8c57a1e0c9a9841b901d81ed2e4a823377",
  2: "0x43C0f22142337C0f938931F55Dfe21619375DB87",
};

app.use(bodyParser.json());

const onInboundCall = (request, response) => {
  let ncco = [
    {
      action: "talk",
      text: "Hi, how can I help you?",
    },
    {
      action: "input",
      type: ["speech"],
      eventUrl: [`${request.protocol}://${request.get("host")}/webhooks/asr`],
      speech: {
        language: "en-US",
        uuid: [request.query.uuid],
      },
    },
  ];
  response.json(ncco);
};

app
  .get("/webhooks/answer", onInboundCall)
  .post("/webhooks/events", (request, response) => {
    console.log(request.body);
    response.sendStatus(200);
  })
  .post("/webhooks/receipt", (request, response) => {
    // python code begins
    const transactionHash = request.body.transaction_hash;
    const transferAmount = request.body.transfer_amount;

    // console.log(`transfer amount: ${transferAmount}, \n transaction hash: ${transactionHash}`)
    const expectedBlockTime = 1000; 
    const sleep = (milliseconds) => {
      return new Promise(resolve => setTimeout(resolve, milliseconds))
  }
    (async () => {
      let receipt = null
      while (receipt == null) { // Waiting expectedBlockTime until the transaction is mined
          receipt = await web3.eth.getTransactionReceipt(transactionHash);
          await sleep(expectedBlockTime)
      }
      const blockNumber = await receipt.blockNumber;
      recipient = await Object.keys(ACCOUNT_MAPPING).find(
        (key) => ACCOUNT_MAPPING[key] === receipt.to
      );

      const from = "14509131037";
      const to = "16475614010";
      const text = `Transfer confirmed. Account ${recipient} received ${transferAmount} in block: ${blockNumber}`;

      // vonage.message.sendSms(from, to, text);
      await vonage.message.sendSms(from, to, text, (err, responseData) => {
        if (err) {
          console.log(err);
        } else {
          if (responseData.messages[0]["status"] === "0") {
            console.log("Message sent successfully.");
          } else {
            console.log(
              `Message failed with error: ${responseData.messages[0]["error-text"]}`
            );
          }
        }
      });
    })();
    response.sendStatus(200);

    // (async () => {
    //   const completion = await openai.createCompletion("text-davinci-002", {
    //     prompt: speech,
    //     temperature: 0.7,
    //     max_tokens: 256,
    //   })
    //   const smartResponse = completion.data.choices[0].text;
    //   // Rasa logic to extract entities and trigger infura to send testnet txn
    //   const ncco = [
    //     {
    //       action: "talk",
    //       text: `${smartResponse}`,
    //     },
    //   ];
    //   response.json(ncco);
    // })();

    // const receiptPromise = () => {
    //   return new Promise((resolve, reject) => {
    //     const receipt = web3.eth.getTransactionReceipt(transactionHash);
    //     resolve(receipt);
    //   });
    // };

    // receiptPromise().then((receipt) => {
    //   const blockNumber = receipt.blockNumber;
    //   recipient = Object.keys(ACCOUNT_MAPPING).find(
    //     (key) => ACCOUNT_MAPPING[key] === receipt.to
    //   );

    //   const from = "14509131037";
    //   const to = "16475614010";
    //   const text = `Transfer confirmed. Account ${recipient} received ${transferAmount} in block: ${blockNumber}`;

    //   // vonage.message.sendSms(from, to, text);
    //   vonage.message.sendSms(from, to, text, (err, responseData) => {
    //     if (err) {
    //       console.log(err);
    //     } else {
    //       if (responseData.messages[0]["status"] === "0") {
    //         console.log("Message sent successfully.");
    //       } else {
    //         console.log(
    //           `Message failed with error: ${responseData.messages[0]["error-text"]}`
    //         );
    //       }
    //     }
    //   });
    // });
    // response.sendStatus(200);
  })
  .post("/webhooks/asr", (request, response) => {
    // const configuration = new Configuration({
    //   apiKey: "",
    // });
    // const openai = new OpenAIApi(configuration);
    // const speech = request.body.speech.results[0].text;
    // (async () => {
    //   const completion = await openai.createCompletion("text-davinci-002", {
    //     prompt: speech,
    //     temperature: 0.7,
    //     max_tokens: 256,
    //   })
    //   const smartResponse = completion.data.choices[0].text;
    //   // Rasa logic to extract entities and trigger infura to send testnet txn
    //   const ncco = [
    //     {
    //       action: "talk",
    //       text: `${smartResponse}`,
    //     },
    //   ];
    //   response.json(ncco);
    // })();
  });

const port = 3000;
app.listen(port, () => console.log(`Listening on port ${port}`));
