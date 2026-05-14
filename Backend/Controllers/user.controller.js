const { createTokenForUser } = require('../Authentication/auth');
const userModel = require('../Models/user.model');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const FeedModel = require('../Models/UserFeed.model');
const JWT_SECRET = process.env.JWT_SECRET;

const { redisClient } = require("../Redis/redisClient");

// ✅ Redis Keys
const profileKey = (id) => `profile:${id}`;
const loggedUserKey = (id) => `loggedUser:${id}`;
const allProfilesKey = (id) => `allProfiles:${id}`; // depends on logged-in user
const followersKey = (id) => `followers:${id}`;
const followingKey = (id) => `following:${id}`;
const searchUsersKey = (query) => `searchUsers:${query.toLowerCase()}`;



const signupUser = async (req, res) => {
  try {
    const { fullName, email, password } = req.body;
    const profilePic = req.file ? req.file.path : null;

    // Validate input fields
    if (!fullName || !email || !password || !profilePic) {
      return res.status(400).json({
        success: false,
        message: "Please fill all the fields",
      });
    }

    // Password minimum length check
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long",
      });
    }

    // Check if user already exists
    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "User already exists",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = new userModel({
      fullName,
      email,
      password: hashedPassword,
      profilePic: profilePic,
    });

    await newUser.save();

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
    });

  } catch (err) {
    console.error("Signup error:", err);

    return res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
};


const signinUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please fill all the fields",
      });
    }

    // Password minimum length check
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long",
      });
    }

    // Check if user exists
    const user = await userModel.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Generate token
    const token = createTokenForUser(user);

    // Set cookie – Safari‑friendly configuration
    return res
      .cookie("token", token, {
        httpOnly: true,
        secure: true,        // keep HTTPS only
        sameSite: "Lax",    // works with Safari and avoids cross‑site blocking
        maxAge: 24 * 60 * 60 * 1000,
      })
      .status(200)
      .json({
        success: true,
        message: "User logged in successfully",
        token,
      });

  } catch (err) {
    console.error("Signin error:", err);

    return res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
};
  
const protectedRoute = async (req, res) => {
    try {
        const token = req.cookies.token;
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized'
            });
        }
    
       
        const decoded = jwt.verify(token, JWT_SECRET);
        if (!JWT_SECRET) throw new Error('JWT_SECRET is not set in environment');
        
        if(decoded){
            return res.status(200).json({
            success: true,
            message: 'Protected route accessed',
           
        });
        }
    } catch (err) {
        console.error('Protected route error:', err);
        return res.status(500).json({
            success: false,
            message: 'Server error',
            error: err.message  
        });
    }
};

const fetchAllProfiles = async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ success: false, message: "Unauthorized" });

    if (!JWT_SECRET) throw new Error('JWT_SECRET not set');
    const decoded = jwt.verify(token, JWT_SECRET);
    if (!decoded) return res.status(401).json({ success: false, message: "Unauthorized" });

    const userId = decoded.id;

    // ✅ Redis cache
    const cached = await redisClient.get(allProfilesKey(userId));
    if (cached) {
      return res.status(200).json({
        success: true,
        profiles: JSON.parse(cached),
        message: "Profiles fetched (cached)",
      });
    }

    const profiles = await userModel.find({ _id: { $ne: userId } }, { password: 0 });

    await redisClient.setEx(allProfilesKey(userId), 60, JSON.stringify(profiles));

    return res.status(200).json({ success: true, profiles });
  } catch (err) {
    console.error("Fetch profiles error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};


const fetchProfile = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(404).json({ success: false, message: "User not found" });

    // ✅ Redis cache
    const cached = await redisClient.get(profileKey(id));
    if (cached) {
      return res.status(200).json({
        success: true,
        user: JSON.parse(cached),
        message: "Profile fetched (cached)",
      });
    }

    const user = await userModel.findById(id, { password: 0 });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    await redisClient.setEx(profileKey(id), 60, JSON.stringify(user));

    return res.status(200).json({ success: true, user });
  } catch (err) {
    console.error("Fetch profile error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};


const fetchFollowers = async (req, res) => {
  try {
    const userId = req.params.userId;
    if (!userId) return res.status(404).json({ success: false, message: "User not found" });

    // ✅ Redis cache
    const cached = await redisClient.get(followersKey(userId));
    if (cached) {
      return res.status(200).json({
        success: true,
        followers: JSON.parse(cached),
        message: "Followers fetched (cached)",
      });
    }

    const followersData = await userModel
      .findById(userId)
      .populate("followersList", { password: 0 });

    if (!followersData) {
      return res.status(404).json({ success: false, message: "No followers found" });
    }

    await redisClient.setEx(
      followersKey(userId),
      60,
      JSON.stringify(followersData.followersList)
    );

    return res.status(200).json({
      success: true,
      followers: followersData.followersList,
    });
  } catch (err) {
    console.error("Fetch followers error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};


const fetchFollowingList = async (req, res) => {
  try {
    const userId = req.params.userId;
    if (!userId) return res.status(404).json({ success: false, message: "User not found" });

    // ✅ Redis cache
    const cached = await redisClient.get(followingKey(userId));
    if (cached) {
      return res.status(200).json({
        success: true,
        following: JSON.parse(cached),
        message: "Following fetched (cached)",
      });
    }

    const followingData = await userModel
      .findById(userId)
      .populate("followingList", { password: 0 });

    if (!followingData) {
      return res.status(404).json({ success: false, message: "No following found" });
    }

    await redisClient.setEx(
      followingKey(userId),
      60,
      JSON.stringify(followingData.followingList)
    );

    return res.status(200).json({
      success: true,
      following: followingData.followingList,
    });
  } catch (err) {
    console.error("Fetch following error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};


const fetchFollowersCount = async (req, res) => {
  try {
    const { id } = req.params;
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    if (!JWT_SECRET) throw new Error('JWT_SECRET not set');
    const decoded = jwt.verify(token, JWT_SECRET);
    const LoggedUser = await userModel.findById(decoded.id);

    if (!LoggedUser) {
      return res.status(404).json({
        success: false,
        message: "Logged-in user not found",
      });
    }

    const targetUser = await userModel.findById(id);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: "Target user not found",
      });
    }

    const isFollowing = targetUser.followersList.includes(LoggedUser._id);

    if (!isFollowing) {
      // ✅ Follow user
      targetUser.followersList.push(LoggedUser._id);
      targetUser.followers += 1;

      LoggedUser.followingList.push(targetUser._id);
      LoggedUser.following += 1;
    } else {
      // ✅ Unfollow user
      targetUser.followersList.pull(LoggedUser._id);
      targetUser.followers -= 1;

      LoggedUser.followingList.pull(targetUser._id);
      LoggedUser.following -= 1;
    }

    await targetUser.save();
    await LoggedUser.save();

    // ✅ Redis cache clear (VERY IMPORTANT)
    await redisClient.del(profileKey(id));
    await redisClient.del(profileKey(decoded.id));

    await redisClient.del(followersKey(id));
    await redisClient.del(followersKey(decoded.id));

    await redisClient.del(followingKey(id));
    await redisClient.del(followingKey(decoded.id));

    await redisClient.del(allProfilesKey(decoded.id));
    await redisClient.del(loggedUserKey(decoded.id));

    return res.status(200).json({
      success: true,
      message: isFollowing ? "Unfollowed successfully" : "Followed successfully",
      updatedFollowerCount: targetUser.followers,
      updatedFollowingCount: LoggedUser.following,
      isFollowing: !isFollowing,
    });
  } catch (err) {
    console.error("Fetch followers count error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
};


const fetchLoggedInUser = async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ success: false, message: "Unauthorized" });

    if (!JWT_SECRET) throw new Error('JWT_SECRET not set');
    const decoded = jwt.verify(token, JWT_SECRET);
    if (!decoded) return res.status(401).json({ success: false, message: "Unauthorized" });

    const userId = decoded.id;

    // ✅ Redis cache
    const cached = await redisClient.get(loggedUserKey(userId));
    if (cached) {
      return res.status(200).json({
        success: true,
        user: JSON.parse(cached),
        message: "Logged user fetched (cached)",
      });
    }

    const user = await userModel.findById(userId, { password: 0 });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    await redisClient.setEx(loggedUserKey(userId), 60, JSON.stringify(user));

    return res.status(200).json({ success: true, user });
  } catch (err) {
    console.error("Fetch logged in user error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const handleLogout = async (req, res) => {
  try {
    // Clear the cookie
    res.clearCookie("token", {
      httpOnly: true,
      secure: true,
      sameSite: "None",
    });

    return res.status(200).json({
      success: true,
      message: 'User logged out successfully'
    });
  } catch (err) {
    console.error('Logout error:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message  
    });
  }
}

const fetchUsersBySearch = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query?.trim()) {
      return res.status(400).json({ success: false, message: "Search query is required" });
    }

    // ✅ Redis cache
    const cached = await redisClient.get(searchUsersKey(query));
    if (cached) {
      return res.status(200).json({
        success: true,
        users: JSON.parse(cached),
        message: "Search users fetched (cached)",
      });
    }

    const users = await userModel
      .find({ fullName: { $regex: query, $options: "i" } })
      .select("_id fullName profilePic")
      .limit(10);

    await redisClient.setEx(searchUsersKey(query), 30, JSON.stringify(users));

    return res.status(200).json({ success: true, users });
  } catch (err) {
    console.error("Search users error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const updateBio = async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token)
      return res.status(401).json({ success: false, message: "Unauthorized" });

    if (!JWT_SECRET) throw new Error('JWT_SECRET is not set in environment');

    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.id || decoded._id;
    const { bio } = req.body;
    
    console.log("📝 RECEIVED BIO:", bio);
    
    if (!bio || bio.trim() === "")
      return res.status(400).json({ success: false, message: "Bio cannot be empty" });

    const updatedUser = await userModel.findByIdAndUpdate(
      userId,
      { bio: bio.trim() },
      { new: true }
    );
    
    console.log("✅ UPDATED USER BIO:", updatedUser.bio);

    // 🔥 Clear Redis cache so fresh data is fetched next time
    await redisClient.del(loggedUserKey(userId));
    console.log("🧹 Cleared Redis cache for user:", userId);

    return res.status(200).json({ success: true, user: updatedUser });
  } catch (error) {
    console.log("❌ UPDATE BIO ERROR:", error.message);
    return res.status(500).json({ success: false, message: "Bio update failed", error: error.message });
  }
};

 const fetchUsersByIds = async (req, res) => {
  try {
    const { userIds } = req.body;

    

    const users = await userModel.find(
      { _id: { $in: userIds } },
      "fullName profilePic"
    );

    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed" });
  }
};




module.exports = {
  signupUser,
  signinUser,
  protectedRoute,
  fetchAllProfiles,
  fetchProfile,
  fetchFollowers,
  fetchFollowersCount,
  fetchLoggedInUser,
  handleLogout,
  fetchFollowingList,
  fetchUsersBySearch,
  updateBio,
  fetchUsersByIds
  
  
};
 

