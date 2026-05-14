import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Signin from './Pages/UserPages/Signin'
import Signup from './Pages/UserPages/Signup'
import Start from './Pages/Start'
import ProtectedRoute from './Pages/ProtectedRoute'
import Home from './Pages/Home/Home'
import Profile from './Pages/ProfilePages/Profile'
import UserProfile from './Pages/UserPages/UserProfile'
import UserFollowers from './Pages/UserPages/UserFollowers'
import AddFeed from './Pages/Home/FooterContent/AddFeed'
import ExplorePage from './Pages/Home/FooterContent/ExplorePage'
import ContentDetailed from './Pages/Home/FooterContent/ContentDetailed'
import CommentSection from './Pages/Comments/CommentSection'
import FollowingList from './Pages/UserPages/FollowingList'
import LikedProfiles from './Pages/UserPages/LikedProfiles'
import ChatUserList from './Pages/Home/FooterContent/ChatUserList'
import ChatIn from './ChatPages/ChatIn'
import AIChat from './ChatPages/AIChat'
import SearchPage from './Pages/UserPages/SearchPage'
const App = () => {
  return (
    <div>
      <Routes>
        <Route path="/" element={<Start/>}/>
        <Route path='/signin' element={<Signin />} />
        <Route path='/signup' element={<Signup />} />
        <Route path='/home' element={<ProtectedRoute><Home/></ProtectedRoute>}/>
        <Route path='/profile/:id' element={<ProtectedRoute><Profile/></ProtectedRoute>}/>
        <Route path='/userProfile' element={<ProtectedRoute><UserProfile/></ProtectedRoute>}/>
        <Route path='/userFollowers' element={<ProtectedRoute><UserFollowers/></ProtectedRoute>}/>
        <Route path='/addFeed' element={<ProtectedRoute><AddFeed/></ProtectedRoute>}/>
        <Route path='/explorer' element={<ProtectedRoute><ExplorePage/></ProtectedRoute>}/>
        <Route path='/contentDetails' element={<ProtectedRoute><ContentDetailed/></ProtectedRoute>}/>
        <Route path='/commentSection' element={<ProtectedRoute><CommentSection/></ProtectedRoute>}/>
        <Route path='/userFollowing' element={<ProtectedRoute><FollowingList/></ProtectedRoute>}/>
        <Route path='/likedProfiles' element={<ProtectedRoute><LikedProfiles/></ProtectedRoute>}/>
        <Route path='/messages' element={<ProtectedRoute><ChatUserList/></ProtectedRoute>}/>
        <Route path='/chat/:id' element={<ProtectedRoute><ChatIn/></ProtectedRoute>}/>
        <Route path='/chat/gemini' element={<ProtectedRoute><AIChat/></ProtectedRoute>}/>
        <Route path='/search' element={<ProtectedRoute><SearchPage/></ProtectedRoute>}/>
 
      </Routes>
    </div>
  )
}

export default App

