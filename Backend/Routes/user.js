const express = require('express');
const router = express.Router();
const userModel = require('../Models/user.model');
const uploadProfile = require('../Utils/userProfileMulterConfig')
const bcrypt = require('bcrypt');
const { signupUser , signinUser , protectedRoute ,
        fetchAllProfiles ,fetchProfile , fetchFollowers ,
        fetchFollowersCount , fetchLoggedInUser , handleLogout,
        fetchFollowingList , fetchLikedProfiles , fetchUsersBySearch ,
        updateBio , fetchUsersByIds} = require('../Controllers/user.controller');


router.post('/signup' ,uploadProfile.single('profilePic'), signupUser);
router.post('/signin' , signinUser);
router.get('/protected' , protectedRoute);
router.get("/profiles" , fetchAllProfiles);
router.get('/profile/:id', fetchProfile);
router.get('/followers/:userId', fetchFollowers);
router.post('/follow/:id', fetchFollowersCount);
router.get('/userProfile' , fetchLoggedInUser);
router.post('/logout' , handleLogout);
router.get('/following/:userId' , fetchFollowingList)
router.get('/searchProfile' , fetchUsersBySearch);
router.put('/updateBio', updateBio);
router.post('/getUsersByIds', fetchUsersByIds);



module.exports = router;