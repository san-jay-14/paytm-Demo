const express = require('express');
const zod = require('zod');
const router = express.Router();
const {secret} = require('../config');
const jwt = require('jsonwebtoken');
const authmiddleware = require('../middleware');
const {User,Account} = require('../db');

const signupSchema = zod.object({
    username: zod.string().min(3).max(30),
    password: zod.string().min(6),
    firstName: zod.string().max(50),
    lastName: zod.string().max(50)
});


router.post('/signup', async (req, res) => {
    const body = req.body;
    const {success} = signupSchema.safeParse(body);
    if(!success) {
        res.status(400).json({message: "Invalid request body"});
        return;
    }
    const existingUser = await User.findOne({
        username: body.username
    });

    if(existingUser) {
        res.status(409).json({message: "User already exists"});
        return;
    }

    const user = new User.create({
        username: req.body.username,
        password: req.body.password,
        firstName: req.body.firstName,
        lastName: req.body.lastName
    });

    const userId = user._id;

    // Creating new account for the user
    await Account.create({
        userId: userId,
        balance: 1+ Math.random() * 100000
    });

    const token = jwt.sign({
        userId
    }, secret, 
    );

    res.json({
        message: "User created",
        token: token
    })


});

//signin
const signinSchema = zod.object({
    username: zod.string().min(3).max(30),
    password: zod.string().min(6)
});

router.post('/signin', async (req, res) => {
    const {success} = signinSchema.safeParse(req.body);
    if(!success) {
        res.status(400).json({message: "Invalid request body"});
        return;
    }

    const user = await User.findOne({
        username: req.body.username,
        password: req.body.password
    });

    if(!user) {
        res.status(401).json({message: "Invalid username or password"});
        return;
    }
    const token = jwt.sign({
        userId: user._id
    }, secret);

    res.json({
        message: "Signin successful",
        token: token
    });
});

const updateSchema = zod.object({
    firstName: zod.string().max(50).optional(),
    lastName: zod.string().max(50).optional(),
    password: zod.string().min(6).optional(),
});

router.put('/', authmiddleware, async (req, res) => {
    const {success} = updateSchema.safeParse(req.body);
    if(!success) {
        res.status(400).json({message: "Invalid request body"});
        return;
    }

    await User.updateOne(req.body, {
        id: req.userId
    });
    res.json({message: "User updated"});
});

router.get("/bulk", async (req, res) => {
    const filter = req.query.filter || "";

    const users = await User.find({
        $or: [{
            firstName: {
                "$regex": filter
            }
        }, {
            lastName: {
                "$regex": filter
            }
        }]
    })

    res.json({
        user: users.map(user => ({
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName,
            _id: user._id
        }))
    })
})


module.exports = router;