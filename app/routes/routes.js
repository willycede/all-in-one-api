const jwt = require("jsonwebtoken");
const test = require('./test/test')
const users = require('./users/user')
const api = '/api'


require('dotenv').config()

const routes = function (server){
    server.use(`${api}/test`,verifyToken,test);
    server.use(`${api}/users`,users);
    server.use(`${api}/countries`,verifyToken,countries);
    server.use(`${api}/states`,verifyToken,states);
    server.use(`${api}/cities`,verifyToken,cities);
}

// Authorization: Bearer <token>
function verifyToken(req, res, next){
    const bearerHeader = req.headers.authorization;
    if(typeof bearerHeader !== 'undefined'){
         const bearerToken = bearerHeader;
         try {
            const decoded = jwt.verify(bearerToken, process.env.JWT_SECRET_KEY);
            req.token  = bearerToken;
            req.userInfo = decoded.user
            next();
           
         } catch (error) {
            return res.sendStatus(403); 
         }
    }else{
        res.sendStatus(403);
    }
}

module.exports= routes;