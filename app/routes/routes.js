const jwt = require("jsonwebtoken");
const test = require('./test/test')
const users = require('./users/user')
const countries = require('./countries/countries')
const states = require('./states/states')
const cities = require('./cities/cities')
const company = require('./company/company')
const company_users = require('./company_users/company_users')
const rol = require('./rol/rol')
const user_rol = require('./user_rol/user_rol')
const categories = require('./categories/categories')
const products = require('./products/products')
const locations = require('./locations/locations')
const permissions = require('./permissions/permissions')
const catalogs = require('./catalogs/catalogs')
const features = require('./features/features')
const api = '/api'


require('dotenv').config()

const routes = function (server){
    server.use(`${api}/test`,verifyToken,test);
    server.use(`${api}/users`,users);
    server.use(`${api}/countries`,countries);
    server.use(`${api}/states`,states);
    server.use(`${api}/cities`,cities);
    server.use(`${api}/rol`,rol);
    server.use(`${api}/user_rol`,user_rol);
    server.use(`${api}/company`,company);
    server.use(`${api}/company_users`,company_users);
    server.use(`${api}/categories`,categories);
    server.use(`${api}/products`,products);
    server.use(`${api}/locations`,locations);
    server.use(`${api}/permissions`,permissions);
    server.use(`${api}/catalogs`,catalogs);
    server.use(`${api}/features`,features);
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