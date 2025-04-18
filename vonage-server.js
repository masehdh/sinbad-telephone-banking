// dotenv
require("dotenv").config();

// axios
const axios = require("axios");

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
const signer = web3.eth.accounts.privateKeyToAccount(
  process.env.SIGNER_PRIVATE_KEY
);
web3.eth.accounts.wallet.add(signer);

//  Stand in list of existing account numbers for validate_transfer_recipient
const ALLOWED_ACCOUNT_NUMBERS = [1, 2, 3, 4, 5];
const ACCOUNT_MAPPING = {
  1: "0x12cc9850b063579895adaa80a628ea60f2932ae2",
  2: "0x43C0f22142337C0f938931F55Dfe21619375DB87",
};

app.use(bodyParser.json());

const onInboundCall = (request, response) => {
  let ncco = [
    {
      action: "talk",
      text: "This is Sinbad, how can I help you?",
      style: 6,
      premium: true,
    },
    {
      action: "input",
      type: ["dtmf", "speech"],
      eventUrl: [
        `${request.protocol}://${request.get("host")}/webhooks/asr`,
      ],
      dtmf: {
        timeOut: 10,
        maxDigits: 6,
        submitOnHash: true,
      },
      speech: {
        language: "en-US",
        startTimeout: 10,
        endOnSilence: 4
      }
    },
  ];
  return response.json(ncco);
};

app
  .get("/webhooks/answer", onInboundCall)
  .post("/webhooks/events", (request, response) => {
    return response.sendStatus(200);
  })
  .post("/webhooks/receipt", (request, response) => {
    const transactionHash = request.body.transaction_hash;
    const transferAmount = request.body.transfer_amount;

    const expectedBlockTime = 1000;
    const sleep = (milliseconds) => {
      return new Promise((resolve) => setTimeout(resolve, milliseconds));
    };
    (async () => {
      let receipt = null;
      while (receipt == null) {
        // Waiting expectedBlockTime until the transaction is mined
        receipt = await web3.eth.getTransactionReceipt(transactionHash);
        await sleep(expectedBlockTime);
      }
      const blockNumber = await receipt.blockNumber;
      recipient = Object.keys(ACCOUNT_MAPPING).find(
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
  })
  .post("/webhooks/sendVerifySMS", (request, response) => {
    vonage.verify.request(
      {
        number: "16475614010",
        brand: "Vonage",
      },
      (err, result) => {
        if (err) {
          console.error(err);
          verifyRequestId = err.request_id;
          sms_payload = [
            {
              request_id: verifyRequestId,
            },
          ];
          response.json(sms_payload);
        } else {
          verifyRequestId = result.request_id;
          console.log("request_id", verifyRequestId);
          sms_payload = [
            {
              request_id: verifyRequestId,
            },
          ];
          response.json(sms_payload);
        }
      }
    );
    // ncco = [
    //   {
    //     action: "talk",
    //     language: "en-US",
    //     style: 6,
    //     premium: true,
    //     text: `Please enter the 4 digit verification code you received via sms using the keypad or your voice.`,
    //   },
    //   {
    //     action: "input",
    //     type: ["speech", "dtmf"],
    //     eventUrl: [`${request.protocol}://${request.get("host")}/webhooks/asr`],
    //     speech: {
    //       language: "en-US",
    //     },
    //     startTimeout: 60,
    //     endOnSilence: 2,
    //     timeOut: 5,
    //   },
    // ];
    // response.json(ncco);
  })
  .post("/webhooks/verifySMS", (request, response) => {
    sms_code = request.body.sms_code;
    request_id = request.body.request_id;
    vonage.verify.check(
      {
        request_id: request_id,
        code: sms_code,
      },
      (err, result) => {
        if (err) {
          console.error(err);
          ("");
          response.send(err);
        } else {
          console.log(result);
          response.send(result);
        }
      }
    );
  })
  .post("/webhooks/asr", async (request, response) => {
    var ncco = [];

      if (request.body.dtmf.digits == null && request.body.speech.results) {
        speech = request.body.speech.results[0].text;
        console.log(speech);
      } else if (request.body.dtmf.digits != null) {
        console.log(request.body)
        speech = request.body.dtmf.digits;
        console.log(speech);
      } else {
        ncco = [
          {
            action: "talk",
            language: "en-US",
            style: 6,
            premium: true,
            text: `Sorry, I didn't catch that. Please try again`,
          },
          {
            action: "input",
            type: ["dtmf", "speech"],
            eventUrl: [
              `${request.protocol}://${request.get("host")}/webhooks/asr`,
            ],
            dtmf: {
              timeOut: 10,
              maxDigits: 6,
              submitOnHash: true,
            },
            speech: {
              language: "en-US",
              startTimeout: 10,
              endOnSilence: 5
            }
          },
        ];
        response.json(ncco);
      }

    const sendMoney = (asr) => {
        axios
        .post("http://localhost:5005/webhooks/rest/webhook", {
          sender: "test_user1", // sender ID of the user sending the message
            message: asr,
          })
          .then((textResponse) => {
            // console.log(textResponse);
            var testResponses = textResponse.data;
            var smartResponse = "";
            testResponses.forEach((resp) => {
              smartResponse = smartResponse.concat(resp.text);
            });
            console.log(smartResponse);
            // smartResponse = textResponse.data[0].text;
            ncco = [
              {
                action: "talk",
                language: "en-US",
                style: 6,
                premium: true,
                text: `${smartResponse}`,
              },
              {
                action: "input",
                type: ["dtmf", "speech"],
                eventUrl: [
                  `${request.protocol}://${request.get("host")}/webhooks/asr`,
                ],
                dtmf: {
                  timeOut: 10,
                  maxDigits: 6,
                  submitOnHash: true,
                },
                speech: {
                  language: "en-US",
                  startTimeout: 10,
                  endOnSilence: 3
                }
              },
            ];
            response.json(ncco);
          })
          .catch("error", (err) => {
            console.log("Error: " + err.message);
          });
        };
        sendMoney(speech);
    });
      
const port = 3000;
app.listen(port, () => console.log(`Listening on port ${port}`));
