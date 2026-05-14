const { createTokenForUser } = require("../Authentication/auth");
const userModel = require("../Models/user.model");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET;

const { redisClient } = require("../Redis/redisClient");

// ✅ Redis Keys
const profileKey = (id) => `profile:${id}`;
const loggedUserKey = (id) => `loggedUser:${id}`;
const allProfilesKey = (id) => `allProfiles:${id}`;
const followersKey = (id) => `followers:${id}`;
const followingKey = (id) => `following:${id}`;
const searchUsersKey = (query) =>
  `searchUsers:${query.toLowerCase()}`;

const getAuthToken = (req) =>
  req.cookies?.token ||
  req.headers?.authorization?.split(" ")[1];

// ✅ Signup
const signupUser = async (req, res) => {
  try {
    const { fullName, email, password } = req.body;

    const profilePic = req.file ? req.file.path : null;

    if (!fullName || !email || !password || !profilePic) {
      return res.status(400).json({
        success: false,
        message: "Please fill all the fields",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message:
          "Password must be at least 6 characters long",
      });
    }

    const existingUser = await userModel.findOne({
      email,
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "User already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new userModel({
      fullName,
      email,
      password: hashedPassword,
      profilePic,
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

// ✅ Signin
const signinUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please fill all the fields",
      });
    }

    const user = await userModel.findOne({ email });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const isMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const token = createTokenForUser(user);

    return res
      .cookie("token", token, {
        httpOnly: true,
        secure: true,
        sameSite: "None",
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

// ✅ Protected Route
const protectedRoute = async (req, res) => {
  try {
    const token = getAuthToken(req);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    if (!JWT_SECRET) {
      throw new Error("JWT_SECRET not set");
    }

    jwt.verify(token, JWT_SECRET);

    return res.status(200).json({
      success: true,
      message: "Protected route accessed",
    });

  } catch (err) {
    console.error("Protected route error:", err);

    return res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
};

// ✅ Fetch All Profiles
const fetchAllProfiles = async (req, res) => {
  try {
    const token = getAuthToken(req);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    const userId = decoded.id;

    let cached = null;

    if (redisClient) {
      cached = await redisClient.get(
        allProfilesKey(userId)
      );
    }

    if (cached) {
      return res.status(200).json({
        success: true,
        profiles: JSON.parse(cached),
      });
    }

    const profiles = await userModel.find(
      { _id: { $ne: userId } },
      { password: 0 }
    );

    if (redisClient) {
      await redisClient.setEx(
        allProfilesKey(userId),
        60,
        JSON.stringify(profiles)
      );
    }

    return res.status(200).json({
      success: true,
      profiles,
    });

  } catch (err) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ✅ Fetch Profile
const fetchProfile = async (req, res) => {
  try {
    const { id } = req.params;

    let cached = null;

    if (redisClient) {
      cached = await redisClient.get(profileKey(id));
    }

    if (cached) {
      return res.status(200).json({
        success: true,
        user: JSON.parse(cached),
      });
    }

    const user = await userModel.findById(id, {
      password: 0,
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (redisClient) {
      await redisClient.setEx(
        profileKey(id),
        60,
        JSON.stringify(user)
      );
    }

    return res.status(200).json({
      success: true,
      user,
    });

  } catch (err) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ✅ Fetch Followers
const fetchFollowers = async (req, res) => {
  try {
    const userId = req.params.userId;

    let cached = null;

    if (redisClient) {
      cached = await redisClient.get(
        followersKey(userId)
      );
    }

    if (cached) {
      return res.status(200).json({
        success: true,
        followers: JSON.parse(cached),
      });
    }

    const followersData = await userModel
      .findById(userId)
      .populate("followersList", { password: 0 });

    if (!followersData) {
      return res.status(404).json({
        success: false,
        message: "No followers found",
      });
    }

    if (redisClient) {
      await redisClient.setEx(
        followersKey(userId),
        60,
        JSON.stringify(followersData.followersList)
      );
    }

    return res.status(200).json({
      success: true,
      followers: followersData.followersList,
    });

  } catch (err) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ✅ Fetch Following
const fetchFollowingList = async (req, res) => {
  try {
    const userId = req.params.userId;

    let cached = null;

    if (redisClient) {
      cached = await redisClient.get(
        followingKey(userId)
      );
    }

    if (cached) {
      return res.status(200).json({
        success: true,
        following: JSON.parse(cached),
      });
    }

    const followingData = await userModel
      .findById(userId)
      .populate("followingList", { password: 0 });

    if (!followingData) {
      return res.status(404).json({
        success: false,
        message: "No following found",
      });
    }

    if (redisClient) {
      await redisClient.setEx(
        followingKey(userId),
        60,
        JSON.stringify(followingData.followingList)
      );
    }

    return res.status(200).json({
      success: true,
      following: followingData.followingList,
    });

  } catch (err) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ✅ Follow / Unfollow
const fetchFollowersCount = async (req, res) => {
  try {
    const { id } = req.params;

    const token = getAuthToken(req);

    const decoded = jwt.verify(token, JWT_SECRET);

    const loggedUser = await userModel.findById(
      decoded.id
    );

    const targetUser = await userModel.findById(id);

    const isFollowing =
      targetUser.followersList.includes(
        loggedUser._id
      );

    if (!isFollowing) {
      targetUser.followersList.push(loggedUser._id);
      targetUser.followers += 1;

      loggedUser.followingList.push(targetUser._id);
      loggedUser.following += 1;
    } else {
      targetUser.followersList.pull(loggedUser._id);
      targetUser.followers -= 1;

      loggedUser.followingList.pull(targetUser._id);
      loggedUser.following -= 1;
    }

    await targetUser.save();
    await loggedUser.save();

    if (redisClient) {
      await redisClient.del(profileKey(id));
      await redisClient.del(profileKey(decoded.id));

      await redisClient.del(followersKey(id));
      await redisClient.del(followersKey(decoded.id));

      await redisClient.del(followingKey(id));
      await redisClient.del(followingKey(decoded.id));

      await redisClient.del(allProfilesKey(decoded.id));
      await redisClient.del(loggedUserKey(decoded.id));
    }

    return res.status(200).json({
      success: true,
      isFollowing: !isFollowing,
    });

  } catch (err) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ✅ Logged In User
const fetchLoggedInUser = async (req, res) => {
  try {
    const token = getAuthToken(req);

    const decoded = jwt.verify(token, JWT_SECRET);

    const userId = decoded.id;

    let cached = null;

    if (redisClient) {
      cached = await redisClient.get(
        loggedUserKey(userId)
      );
    }

    if (cached) {
      return res.status(200).json({
        success: true,
        user: JSON.parse(cached),
      });
    }

    const user = await userModel.findById(userId, {
      password: 0,
    });

    if (redisClient) {
      await redisClient.setEx(
        loggedUserKey(userId),
        60,
        JSON.stringify(user)
      );
    }

    return res.status(200).json({
      success: true,
      user,
    });

  } catch (err) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ✅ Logout
const handleLogout = async (req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: true,
      sameSite: "None",
    });

    return res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });

  } catch (err) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ✅ Search Users
const fetchUsersBySearch = async (req, res) => {
  try {
    const { query } = req.query;

    let cached = null;

    if (redisClient) {
      cached = await redisClient.get(
        searchUsersKey(query)
      );
    }

    if (cached) {
      return res.status(200).json({
        success: true,
        users: JSON.parse(cached),
      });
    }

    const users = await userModel
      .find({
        fullName: {
          $regex: query,
          $options: "i",
        },
      })
      .select("_id fullName profilePic")
      .limit(10);

    if (redisClient) {
      await redisClient.setEx(
        searchUsersKey(query),
        30,
        JSON.stringify(users)
      );
    }

    return res.status(200).json({
      success: true,
      users,
    });

  } catch (err) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// ✅ Update Bio
const updateBio = async (req, res) => {
  try {
    const token = getAuthToken(req);

    const decoded = jwt.verify(token, JWT_SECRET);

    const userId = decoded.id;

    const { bio } = req.body;

    const updatedUser =
      await userModel.findByIdAndUpdate(
        userId,
        { bio },
        { new: true }
      );

    if (redisClient) {
      await redisClient.del(
        loggedUserKey(userId)
      );
    }

    return res.status(200).json({
      success: true,
      user: updatedUser,
    });

  } catch (err) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message: "Bio update failed",
    });
  }
};

// ✅ Fetch Users By IDs
const fetchUsersByIds = async (req, res) => {
  try {
    const { userIds } = req.body;

    const users = await userModel.find(
      { _id: { $in: userIds } },
      "fullName profilePic"
    );

    return res.json({
      success: true,
      users,
    });

  } catch (err) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message: "Failed",
    });
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
  fetchUsersByIds,
};