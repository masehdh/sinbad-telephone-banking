const axios = require("axios");

const speech = "yes";
var ncco = [];
const test = async (asr) => {
  await axios
    .post(`http://localhost:5005/webhooks/rest/webhook`, {
      sender: "test_user", // sender ID of the user sending the message
      message: asr,
    })
    .then((textResponse) => {
    //   console.log(textResponse.data);
      var textResponses = textResponse.data;
      var a = "";
      textResponses.forEach((resp) => {
        a = a.concat(resp.text);
      });
      console.log(a);
      ncco = [
        {
          action: "talk",
          language: "en-US",
          style: 6,
          premium: true,
          text: `${a}`,
        },
        {
          action: "input",
          type: ["speech"],
          eventUrl: [`http://localhost/webhooks/asr`],
          speech: {
            language: "en-US",
          },
        },
      ];
    });
};
test(speech);
// data = [
//   { recipient_id: "test_user3", text: "One moment please." },
//   {
//     recipient_id: "test_user3",
//     text: "Thank you, your transfer is pending. You and account 1 will both receive a text message when the transfer is confirmed",
//   },
// ];

// data.forEach((data) => {
//   a = a.concat(data.text);
// });
// console.log(a);
