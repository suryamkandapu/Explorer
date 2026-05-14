import { useParams } from 'react-router-dom';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { API_URL } from '../../../ConfigApi/Api';
import HomeFooter from '../Home/HomeFooter';
import UserFeed from '../UserPages/UserFeed';
import ProfileTopSection from './ProfileTopSection';

const Profile = () => {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  
  const [loggedInUser , setLoggedInUser] = useState([]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get(`${API_URL}/user/profile/${id}`);
        if (res.data.success) {
          setUser(res.data.user);
        }
      } catch (err) {
        console.error('Failed to load user profile:', err);
      }
    };

    fetchProfile();
  }, [id]);

 useEffect(() => {
  const fetchLoggedInUser = async () => {
    try {
      const res = await axios.get(`${API_URL}/user/userProfile`, {
        withCredentials: true,
      });

      if (res.data.success) {
        setLoggedInUser(res.data.user);
      }
    } catch (err) {
      console.log("Error fetching loggedInUser", err);
    }
  };

  fetchLoggedInUser();
}, []);

  if (!user) return <div>Loading...</div>;




  return (
    <div>
     
       <ProfileTopSection user={user} loggedInUser={loggedInUser} />
       <UserFeed user={user} />
       <HomeFooter/>

    </div>
     
  );
};

export default Profile;
