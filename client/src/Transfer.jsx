import { useState } from "react";
import server from "./server";
import * as secp from 'ethereum-cryptography/secp256k1';
import {toHex,utf8ToBytes} from 'ethereum-cryptography/utils';
import {keccak256} from 'ethereum-cryptography/keccak';

function Transfer({ address, setBalance,privateKey, setPrivateKey }) {
  const [sendAmount, setSendAmount] = useState("");
  const [recipient, setRecipient] = useState("");

  const setValue = (setter) => (evt) => setter(evt.target.value);

  async function transfer(evt) {
    evt.preventDefault();

    const transaction = {
      sender: address,
      amount: parseInt(sendAmount),
      recipient,
    }
    const hash = toHex(keccak256(utf8ToBytes(JSON.stringify(transaction))))
    const signature = await secp.sign(hash, privateKey, { recovered: Boolean = true})

    try {
      const data = await server.post(`send`, {
        transaction: transaction,
        hash: hash,
        signature:signature,
      });

      setBalance(data.data.balance);
    } catch (ex) {
      alert('Error:'+ex.response.data.message);
    }
  }

  return (
    <form className="container transfer" onSubmit={transfer}>
      <h1>Send Transaction</h1>

      <label>
        Send Amount
        <input
          placeholder="1, 2, 3..."
          value={sendAmount}
          onChange={setValue(setSendAmount)}
        ></input>
      </label>

      <label>
        Recipient
        <input
          placeholder="Type an address, for example: 0x2"
          value={recipient}
          onChange={setValue(setRecipient)}
        ></input>
      </label>

      <label>
        Private Key*
        <input
          type="text"
          value={privateKey}
          onChange={setValue(setPrivateKey)}
          required
        ></input>
      </label>

      <input type="submit" className="button" value="Transfer" />
    </form>
  );
}

export default Transfer;
