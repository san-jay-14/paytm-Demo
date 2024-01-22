const jwt = require("jsonwebtoken");
const {secret} = require("./config");


const authmiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if(!authHeader || !authHeader.startsWith("Bearer ")) {
        res.status(403).json({message: "Invalid token"});
        return;
    }

    const token = authHeader.split(" ")[1];
    try{
        const decoded = jwt.verify(token, secret);
        req.userId = decoded.userId;
        next();
    } catch(err) {
        res.status(403).json({message: "Invalid token"});
    }
};

module.exports = authmiddleware;