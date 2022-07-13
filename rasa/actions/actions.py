from typing import Any, Text, Dict, List

from rasa_sdk import FormValidationAction, Action, Tracker
from rasa_sdk.executor import CollectingDispatcher
from rasa_sdk.types import DomainDict
from rasa_sdk.events import EventType
from rasa_sdk.events import Restarted
from rasa_sdk.events import AllSlotsReset
from rasa_sdk.events import FollowupAction
# from rasa.core.trackers import DialogueStateTracker
from rasa_sdk.events import SlotSet

from dotenv import load_dotenv
import requests
import os
from web3 import Web3
from math import ceil
import decimal

import vonage

# Set up for transfers
load_dotenv()
network = os.environ.get("ETHEREUM_NETWORK")
ngrok = os.environ.get("NGROK_REMOTE_URL")
key = os.environ.get("SIGNER_PRIVATE_KEY")
w3 = Web3(
    Web3.HTTPProvider(
        f"https://{network}.infura.io/v3/{os.environ.get('INFURA_PROJECT_ID')}"
    )
)
acct = w3.eth.account.privateKeyToAccount(key)

# Set up for sms follow up
# vonage_api_key = os.environ.get("VONAGE_API_KEY")
# vonage_secret = os.environ.get("VONAGE_SECRET")
# client = vonage.Client(key=vonage_api_key, secret=vonage_secret)
# sms = vonage.Sms(client)

# Stand in list of existing account numbers for validate_transfer_recipient
ALLOWED_ACCOUNT_NUMBERS = [1,2,3,4,5]
ACCOUNT_MAPPING = {
    "1": "0x12cc9850b063579895adAA80A628eA60f2932ae2",
    "2": "0x43C0f22142337C0f938931F55Dfe21619375DB87"
}
PIN_NUMBER = 123456

# change this action to match new number, role slot mappings if necessary:
class ActionSendTransfer(Action):
    def name(self) -> Text:
        return "action_send_transfer"

    def run(
        self,
        dispatcher: CollectingDispatcher,
        tracker: Tracker,
        domain: Dict[Text, Any],
    ) -> List[Dict[Text, Any]]:
        
        amount = int(tracker.get_slot("transfer_amount"))
        sinbad_recipient = tracker.get_slot("transfer_recipient")
        recipient = ACCOUNT_MAPPING[f"{sinbad_recipient}"]
        
        transfer = {
            "from": acct.address,
            "to": recipient,
            "value": amount,
            "gas": 21000,  ## This is the standard gas for simple transfers, more for contracts
            "maxFeePerGas": w3.toWei("33", "gwei"),
            "maxPriorityFeePerGas": w3.toWei("33", "gwei"),
            "nonce": w3.eth.getTransactionCount(acct.address),
            "chainId": 3,
        }
        signed = w3.eth.account.sign_transaction(transfer, key)
        transaction_hash = w3.eth.send_raw_transaction(signed.rawTransaction).hex()
       
        print(
            f"Mining transfer... \n View pending transfer here: https://{network}.etherscan.io/tx/{transaction_hash}"
        )
        dispatcher.utter_message(text=f"Thank you, your transfer is pending. You and account {sinbad_recipient} will both receive a text message when the transfer is confirmed")
        # print(f'Mined in block {w3.eth.wait_for_transaction_receipt(transaction_hash).blockNumber}')
        # dispatcher.utter_message(text=f'Mined in block: {transaction_hash}')
        
        return [SlotSet(key="transaction_hash", value=transaction_hash)]

class SendReceipt(Action):
    
    def name(self) -> Text:
        return "action_send_receipt"
    
    async def run(
        self,
        dispatcher: CollectingDispatcher,
        tracker: Tracker,
        domain: Dict[Text, Any],
    ) -> List[Dict[Text, Any]]:
        
        transaction_hash = tracker.get_slot("transaction_hash")
        amount = tracker.get_slot("transfer_amount")
        receipt_payload = {
            "transaction_hash": transaction_hash,
            "transfer_amount": amount
        }
        print(receipt_payload)

        #put the async post request here for the txn receipt with slot values on node server
        response = requests.post(f"{ngrok}/webhooks/receipt", json=receipt_payload)

        return []

# class SendSMSVerification(Action):

#     def name(self) -> Text:
#         return "send_sms_verification"

#     async def run(
#         self,
#         dispatcher: CollectingDispatcher,
#         tracker: Tracker,
#         domain: Dict[Text, Any],
#     ) -> List[Dict[Text, Any]]:

#         #put the async post request here for the txn receipt with slot values on node server
#         response = await requests.post(f"{ngrok}/webhooks/receipt")
#         request_id = response.data.request_id
#         return [SlotSet(key="request_id", value=request_id)]
    

class ValidateUserAuthenticationForm(FormValidationAction):
    def name(self) -> Text:
        return "validate_user_authentication_form"
    
    def validate_pin_code(
        self,
        slot_value: Any,
        dispatcher: CollectingDispatcher,
        tracker: Tracker,
        domain: DomainDict,
    ) -> Dict[int, Any]:
        """ Verify pin code """
        pin_code = int(tracker.get_slot("pin_code"))

        if pin_code != 123456:
            dispatcher.utter_message(text=f'Pin code is incorrect.')
            return {'pin_code': None}
            # return [SlotSet(key="pin_code", value=None), SlotSet(key="user_verified", value=False)]
        
        response = requests.post(f"{ngrok}/webhooks/sendVerifySMS")
        response2 = response.json()
        request_id = response2[0]['request_id']
        
        return {'pin_code': pin_code, 'request_id': request_id}
        # return [SlotSet(key="pin_code", value=pin_code), SlotSet(key="user_verified", value=True)]

    def validate_sms_code(
        self,
        slot_value: Any,
        dispatcher: CollectingDispatcher,
        tracker: Tracker,
        domain: DomainDict,
    ) -> Dict[int, Any]:
        """ Verify sms code for transaction """
        request_id = tracker.get_slot("request_id")
        sms_code = int(tracker.get_slot("sms_code"))

        sms_payload = {
            "request_id": request_id,
            "sms_code": sms_code 
        }
        
        response = requests.post(f"{ngrok}/webhooks/verifySMS", json=sms_payload)
        response2 = response.json()
        if response2["status"] == "0":
            return {'user_verified': True, 'sms_code': sms_code}

        if response2["status"] == "16":
            dispatcher.utter_message(text=f'SMS code is incorrect, please try again')
            return {'user_verified':False, 'sms_code': None}

        # if response.status == "17":
        #     dispatcher.utter_message(text=f'Too many incorrect attempts, sending a new code')
        #     response = requests.post(f"{ngrok}/webhooks/sendVerifySMS")
        #     request_id = response.data.request_id
        #     return {'user_verified':False, 'sms_code': None, 'request_id': request_id}

class ValidateSendTransferForm(FormValidationAction):
    def name(self) -> Text:
        return "validate_send_transfer_form"

    def validate_transfer_recipient(
        self, 
        slot_value: Any,
        dispatcher: CollectingDispatcher,
        tracker: Tracker,
        domain: DomainDict,
    ) -> Dict[int, Any]:
        """ Validate `transfer_recipient value."""
        
        # transfer_recipient = int(self.from_entity(entity="number", role="transfer_recipient"))
        transfer_recipient = int(tracker.get_slot("transfer_recipient"))

        # if tracker.latest_action_name() == "utter_"
        # if FormValidationAction.next_requested_slot() == "transfer_amount"

        if transfer_recipient not in ALLOWED_ACCOUNT_NUMBERS:
            dispatcher.utter_message(text=f'Account {transfer_recipient} does not exist, please try again.')
            return {"transfer_recipient": None}
        return {'transfer_recipient': transfer_recipient}
    
    def validate_transfer_amount(
        self,
        slot_value: Any,
        dispatcher: CollectingDispatcher,
        tracker: Tracker,
        domain: DomainDict,
    ) -> Dict[int, Any]:
        """ Validate `transfer_amount value."""
        transfer_amount = int(tracker.get_slot("transfer_amount"))
        # transfer_amount = int(self.from_entity(entity="number", role="transfer_recipient"))
        

        # transfer_amount = int(transfer_amount)
        if transfer_amount <= 0:
                dispatcher.utter_message(text=f'This is an invalid transfer amount, please try again.')
                return {"transfer_amount": None}  

        # function to estimate gas fee and validate transfer amount maximum
        response = requests.get(f'https://api.anyblock.tools/ethereum/ethereum/ropsten/gasprice')
        fastGasCostUnrounded = decimal.Decimal((response.json()["fast"]))
        fastGasCost = ceil(w3.toWei(fastGasCostUnrounded,'gwei'))
        balance = w3.eth.get_balance(acct.address)

        if balance < (transfer_amount + fastGasCost):
            dispatcher.utter_message(text=f'Transfer amount exceeds balance. Please try again with a lower amount.')
            return {"transfer_amount": None}

        return {'transfer_amount': transfer_amount}

class ActionSlotReset(Action):

  def name(self) -> Text:
      return "action_slot_reset"

  def run(
      self, dispatcher, tracker: Tracker, domain: Dict[Text, Any]
  ) -> List[Dict[Text, Any]]:

      # custom behavior

    #   return [AllSlotsReset()]
    return [SlotSet(key='transfer_amount', value=None), SlotSet(key='transfer_recipient', value=None)]
    