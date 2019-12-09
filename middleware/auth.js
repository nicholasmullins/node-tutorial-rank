const jwt = require('jsonwebtoken');
const config = require('config');

module.exports = function(req, res, next) {
    // Get token to header 
    const token = req.header('x-auth-token')

    // Check if there is no token
    if (!token) {
        return res.status(401).json( {msg: 'No token, authorization denied'} ); // 401 means not autorized
    }

    // Verify token

    try {
        const decoded = jwt.verify(token, config.get('jwtSecret')); // if a token is returned then jwt will verify and decode it. Req.user we can use everywhere now.
        req.user = decoded.user;
        next();
    } catch (err) {
        res.status(401).json({msg: 'Token is not valid'});
    }
}