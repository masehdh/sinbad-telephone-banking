from typing import Any, Text, Dict, List

from rasa_sdk import FormValidationAction, Action, Tracker
from rasa_sdk.executor import CollectingDispatcher
from rasa_sdk.types import DomainDict
from rasa_sdk.events import EventType
from rasa_sdk.events import Restarted
from rasa_sdk.events import AllSlotsReset

from dotenv import load_dotenv
import requests
import os
from web3 import Web3
from math import ceil
import decimal

# Set up for transfers
load_dotenv()
network = os.environ.get("ETHEREUM_NETWORK")
key = os.environ.get("SIGNER_PRIVATE_KEY")
w3 = Web3(
    Web3.HTTPProvider(
        f"https://{network}.infura.io/v3/{os.environ.get('INFURA_PROJECT_ID')}"
    )
)
acct = w3.eth.account.privateKeyToAccount(key)

# Stand in list of existing account numbers for validate_transfer_recipient
ALLOWED_ACCOUNT_NUMBERS = [1,2,3,4,5]

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

        condition = tracker.get_intent_of_latest_message()

        if condition == "send":
            transfer = {
                "from": acct.address,
                "to": "0x68108C8C57A1e0C9A9841B901D81ED2E4a823377",
                "value": w3.toWei("0.001", "ether"),
                "gas": 21000,  ## This is the standard gas for simple transfers, more for contracts
                "maxFeePerGas": w3.toWei("110", "gwei"),
                "maxPriorityFeePerGas": w3.toWei("110", "gwei"),
                "nonce": w3.eth.getTransactionCount(acct.address),
                "chainId": 3,
            }
            signed = w3.eth.account.sign_transaction(transfer, key)
            test = w3.eth.send_raw_transaction(signed.rawTransaction)
            print(
                f"Mining transfer... \n View pending transfer here: https://{network}.etherscan.io/tx/{test.hex()}"
            )
            dispatcher.utter_message(text=f"Thank you, your transfer is pending")
            return []
            # print(f'Mined in block {w3.eth.wait_for_transaction_receipt(test).blockNumber}')
            # dispatcher.utter_message(text=f'Mined in block: {test}')

        return []

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
        

        transfer_amount = int(transfer_amount)
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

      return [AllSlotsReset()]
    