const express = require("express");
const app = express();
const cors = require("cors");
const secp = require("ethereum-cryptography/secp256k1");
const {toHex} = require("ethereum-cryptography/utils");
const {keccak256} = require("ethereum-cryptography/keccak");

const port = 3042;

app.use(cors());
app.use(express.json());

const balances = {
  "0xd623640675bed9332eaa523bab467cff19129f43": 100,
  "0x3b700389dedcfe31deabc456b17587005d5758cd": 50,
  "0x358137752948f5a4b7a29b7fef2830cf7da02ef7": 75,
};

app.get("/balance/:address", (req, res) => {
  const { address } = req.params;
  const balance = balances[address] || 0;
  res.send({ balance });
});

app.post("/send", (req, res) => {

  const { transaction, hash, signature } = req.body;
  const sender=  transaction.sender;
  const amount = transaction.amount;
  const recipient = transaction.recipient;

  setInitialBalance(sender);
  setInitialBalance(recipient);

  const isValid = isValidTransaction(hash,signature,sender);
  if(!isValid) {
    res.status(400).send({message: "Signature is invalid"})
  }

  if (balances[sender] < amount) {
    res.status(400).send({ message: "Not enough funds!" });
  } else {
    balances[sender] -= amount;
    balances[recipient] += amount;
    res.send({ balance: balances[sender] });
  }
});

app.listen(port, () => {
  console.log(`Listening on port ${port}!`);
});

function setInitialBalance(address) {
  if (!balances[address]) {
    balances[address] = 0;
  }
}

function isValidTransaction(hash, sign, sender) {
  const signature = Uint8Array.from(Object.values(sign[0]))
  const recoveryBit = sign[1]
  const recoveredPublicKey = secp.recoverPublicKey(hash, signature, recoveryBit)
  const isSigned = secp.verify(signature, hash, recoveredPublicKey);
  const addr = "0x" + toHex(keccak256(recoveredPublicKey.slice(1)).slice(-20));
  const isValidSender = (sender === addr) ? true:false

  if(isValidSender && isSigned) 
    return true

  return false
}
