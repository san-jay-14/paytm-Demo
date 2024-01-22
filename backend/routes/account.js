// backend/routes/account.js
const express = require('express');
const authmiddleware = require('../middleware');
const {Account} = require('../db');
const { default: mongoose } = require('mongoose');

const router = express.Router();


router.get('/balance', authmiddleware, async (req, res) => {
    const account = await Account.findOne({userId: req.userId});
    res.json({
        balance: account.balance
    });
});

router.post('/transfer', authmiddleware, async (req, res) => {
    const session = await mongoose.startSession();

    session.startTransaction();
    const {amount,to} = req.body;

    const account = await Account.findOne({userId: req.userId});

    if(!account || account.balance < amount) {
        await session.abortTransaction();
        res.status(400).json({message: "Insufficient balance"});
        return;
    }

    const toAccount = await Account.findOne({userId: to}).session(session);

    if(!toAccount) {
        await session.abortTransaction();
        res.status(400).json({message: "Invalid to account"});
        return;
    }

    await Account.updateOne({userId: req.userId}, {$inc: {balance: -amount}}).session(session);
    await Account.updateOne({userId: to}, {$inc: {balance: amount}}).session(session);


    await session.commitTransaction();
    res.json({message: "Transfer successful"});
});

module.exports = router;
