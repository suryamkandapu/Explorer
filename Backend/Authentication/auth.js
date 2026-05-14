const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;

function createTokenForUser(user){
    const payload = {
        id: user._id,
        fullName:user.fullName,
        email: user.email,
        profilePic: user.profilePic || 'https://i.pinimg.com/736x/c0/74/9b/c0749b7cc401421662ae901ec8f9f660.jpg',
    }
    if (!JWT_SECRET) throw new Error('JWT_SECRET is not defined');
    const token = jwt.sign(payload, JWT_SECRET );
    return token;
}

module.exports={
    createTokenForUser,   
}