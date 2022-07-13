# sinbad-telephone-banking

This repository is for the telephone banking arm of Sinbad. The user story is this:

* Users can call a phone number specific to their country, and using an interactive voice response menu in their language and get  access to almost everything that users of the app have. 

They can see their account balance and transfer history, send transfers, and change their account details.

Let's map the specific functional requirements to their respective tools:

| Requirement  | Tool | MVP Implementation |
| ------------- | ------------- | ------------- |
| Telephone number in every country| [Vonage Rent a Number](https://developer.vonage.com/numbers/overview) | 1 Canadian number, 1 Afghan number | 
| Interactive Voice Response (IVR) menu in 40+ human languages | [Vonage IVR](https://developer.vonage.com/use-cases/interactive-voice-response) | English and Afghan Persian/Dari |
| Post transactions to layer 2 ethereum (Can use [Arbitrum](https://bridge.arbitrum.io/), but ideally [ZK-Sync](https://zksync.io/) or [Loopring](https://loopring.org/#/)  | [Infura API](https://docs.infura.io/infura/networks)| Use Arbitrum |
| Serverless API that connects telephony webhooks to blockchain requests and customer support | [Firebase Cloud Functions](https://firebase.google.com/products/functions?gclsrc=ds&gclsrc=ds) | Keep it simple and centralized, from a single address controlled by Sinbad |
| Manage user authentication | [Firebase Auth](https://firebase.google.com/products/auth?gclsrc=ds&gclsrc=ds), [Vonage Dual-Tone-Multi-Frequency (DTMF Pin code) to type pin code](https://developer.vonage.com/voice/voice-api/code-snippets/handle-user-input-with-dtmf) | Simple 4-digit pin code in database |
| Database | [Firebase Firestore](https://firebase.google.com/products/firestore?gclsrc=ds&gclsrc=ds) | Use Firestore |
| Natural Language Understanding customer support in multiple human languages | [Rasa](https://rasa.com/) | Not necessary for MVP |

