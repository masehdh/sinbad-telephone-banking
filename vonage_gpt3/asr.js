// GPT3
const { Configuration, OpenAIApi } = require("openai");

// Vonage
const express = require("express");
const bodyParser = require("body-parser");
const app = express();

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

  //   function callName(req, res) {
      
  //     // Use child_process.spawn method from 
  //     // child_process module and assign it
  //     // to variable spawn
  //     var spawn = require("child_process").spawn;
        
  //     // Parameters passed in spawn -
  //     // 1. type_of_script
  //     // 2. list containing Path of the script
  //     //    and arguments for the script 
        
  //     // E.g : http://localhost:3000/name?firstname=Mike&lastname=Will
  //     // so, first name = Mike and last name = Will
  //     var process = spawn('python',["./hello.py",
  //                             req.query.firstname,
  //                             req.query.lastname] );
    
  //     // Takes stdout data from script which executed
  //     // with arguments and send this data to res object
  //     process.stdout.on('data', function(data) {
  //         res.send(data.toString());
  //     } )
  // }
    
  });

const port = 3000;
app.listen(port, () => console.log(`Listening on port ${port}`));
