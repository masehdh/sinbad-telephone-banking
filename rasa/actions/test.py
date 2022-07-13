# from dotenv import load_dotenv
# import os
# from web3 import Web3
# import requests
# from math import ceil
# import decimal

# load_dotenv()
# network = os.environ.get('ETHEREUM_NETWORK')
# key = os.environ.get('SIGNER_PRIVATE_KEY')

# w3 = Web3(Web3.HTTPProvider(f"https://{network}.infura.io/v3/{os.environ.get('INFURA_PROJECT_ID')}"))

# acct = w3.eth.account.privateKeyToAccount(key)

# transaction = {
#     'from': acct.address,
#     'to': "0x68108C8C57A1e0C9A9841B901D81ED2E4a823377",
#     'value': w3.toWei("0.001", "ether"),
#     'gas': 21000, ## This is the standard gas for simple transfers, more for contracts
#     'maxFeePerGas': w3.toWei("98", "gwei"),
#     'maxPriorityFeePerGas': w3.toWei("98", "gwei"),
#     'nonce': w3.eth.getTransactionCount(acct.address),
#     'chainId': 3
#     }

# def sendTransfer():

#     signed = w3.eth.account.sign_transaction(transaction, key)
#     test = w3.eth.send_raw_transaction(signed.rawTransaction)
#     print(f'Mining transaction... \n View pending transaction here: https://{network}.etherscan.io/tx/{test.hex()}')
#     print(f'Mined in block {w3.eth.wait_for_transaction_receipt(test).blockNumber}')

# # sendTransfer() for development use this. For production, switch to polygon/arbitrum/loopring gas estimator for mainnet

# def estimateGas():

#     response = requests.get(
#     f'https://api.anyblock.tools/ethereum/ethereum/ropsten/gasprice')

#     return (decimal.Decimal((response.json()["fast"])))

# def checkBalance(amount):
#     balance = w3.eth.get_balance(acct.address)
#     gasCost = ceil(w3.toWei(estimateGas(),'gwei'))
#     print(f'balance: {balance} \n gasCost: {gasCost} \n amount: {amount}' )

#     if balance >= (amount + gasCost):
#         print("txn successful")
#     else:
#         print("txn unsuccessful")

# checkBalance(52255356381325153)

# import vonage
# import os
# from dotenv import load_dotenv
# load_dotenv()

# vonage_api_key = os.environ.get("VONAGE_API_KEY")
# vonage_secret = os.environ.get("VONAGE_SECRET")

# client = vonage.Client(key=vonage_api_key, secret=vonage_secret)
# sms = vonage.Sms(client)

# responseData = sms.send_message(
#     {
#         "from": "14509131037",
#         "to": "16475614010",
#         "text": "A text message sent using the Nexmo SMS API",
#     }
# )

# if responseData["messages"][0]["status"] == "0":
#     print("Message sent successfully.")
# else:
#     print(f"Message failed with error: {responseData['messages'][0]['error-text']}")

# import requests

# url = "http://localhost:5005/webhooks/rest/webhook"
# payload = '{"message":""}'
# headers = {
#   'Content-Type': 'application/json'
# }
# response = requests.post(url, headers=headers, data = payload.encode('utf-8'))
# print("{}".format(response.json()[0]["text"]))