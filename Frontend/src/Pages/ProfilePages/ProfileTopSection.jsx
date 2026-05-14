import React from 'react'
import '../../Styles/TopSection.css'
import { useState } from 'react';
import axios from 'axios';
import { API_URL } from '../../../ConfigApi/Api';
import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../../Styles/TopSection.css'


const ProfileTopSection = ({user , loggedInUser }) => {
      const [followers, setFollowers] = useState();
      const [following, setFollowing] = useState(false);
      const [postsLength, setPostLength] = useState([]);
      const navigate = useNavigate();
       useEffect(() => {
           const fetchPosts = async () => {
               try {
                   const res = await axios.get(`${API_URL}/posts/${user._id}`, {
                       withCredentials: true,
                   });
                   if (res.data.success) {
                       setPostLength(res.data.userPosts.length);
   
                   } else {
                      console.log("error")
                   }
               } catch (err) {
                   console.error('Error fetching user posts length:', err);
               } 
           };
           fetchPosts();
       }, []);   
       
       
       useEffect(() => {
          if (user && loggedInUser) {
            // Check if loggedInUser is already in user's followersList
            const isFollowing = user.followersList.includes(loggedInUser._id);
            setFollowing(isFollowing);
            setFollowers(user.followers); // initialize local count
        }
      }, [user, loggedInUser]);
const handleFollowersCount = async () => {
  try {
    const res = await axios.post(`${API_URL}/user/follow/${user._id}`, {}, {
      withCredentials: true,
    });

    if (res.data.success) {
      // Update follower count for the viewed user
      setFollowers(prev => (following ? prev - 1 : prev + 1));

      // Update following count for the logged-in user
      if (typeof loggedInUser.following === 'number') {
        loggedInUser.following += following ? -1 : 1;
      }

      setFollowing(!following);
    } else {
      console.error('Failed to follow user');
    }
  } catch (err) {
    console.error('Error following user:', err);
  }
};

  return (
    <div className="profile-container">
  <div className="left-profile-section">
    <img 
        src={user.profilePic.startsWith('http') ? user.profilePic : `${API_URL}/${user.profilePic.replace(/^\/+/, '')}`}
        alt="Profile" 
        className="profile-image" />
  </div>

  <div className="right-profile-section">
    <div className="username-row">
      <h2 className="username">{user.fullName}</h2>
    </div>

    <div className="stats-row">
      <div className="stat">
        <strong>{postsLength}</strong>
        <span>posts</span>
      </div>
      <div className="stat">
        <Link to="/userFollowers" state={user._id} className="text-decoration-none text-dark" >
          <strong>{followers !== undefined ? followers : user.followers}</strong>
        </Link>
        <span>followers</span>
      </div>

      <div className="stat">
        <Link to="/userFollowing" state={{ userId: user._id, followingList: user.followingList }} className="text-decoration-none text-dark"  >
            <strong>{user.followingList.length}</strong>
        </Link>
        <span>following</span>
      </div>
    </div>

     

      {user._id !== loggedInUser._id && (
        <button className='follow-btn' onClick={handleFollowersCount}>
            {following ? "Unfollow" : "Follow"}
        </button>
      )}
      {user._id !== loggedInUser._id && (
       <button className='message-btn' onClick={() => navigate(`/chat/${user._id}`)}>
            Message
        </button>
      )}  

    <div className="bio-section">
      <p>{user.bio}</p>
    </div>
  </div>
</div>

  )
}

export default ProfileTopSection