import React from 'react'
import { Link } from 'react-router-dom';
import { API_URL } from '../../../ConfigApi/Api';
import "../../Styles/GetComments.css"
import axios from 'axios';
import { FaTrash } from 'react-icons/fa';
import { useState } from 'react';
import { useEffect } from 'react';




const GetComments = ({comments , onDeleteComment}) => {
  const [loggedInUserId, setLoggedInUserId] =useState(null);
  // const navigate = useNavigate();
  useEffect(() => {
    const fetchUserId = async () => {
      try {
        const res = await axios.get(`${API_URL}/user/userProfile`, { withCredentials: true });
        if (res.data.success) {
          setLoggedInUserId(res.data.user._id);
        }
      } catch (err) {
        console.error("Error fetching logged-in user ID:", err.message);
      }
    };

    fetchUserId();
  }, []);

  if (!comments || comments.length === 0) {
    return (
    <div className='no-comments'> 
       No Comments posted yet. Be the first to comment!!
    </div>
    );
  }
  //let userId = null; // Initialize userId to null
  const handleDeleteComment = async(comment)=>{
     try{
      const res = await axios.delete(`${API_URL}/comments/delete/${comment._id}` , {
        withCredentials:true,
      })
      if(res.data.success){
        alert("Comment deleted successfully")
         console.log(res.data.loggedInUserId);
        onDeleteComment(comment._id);

      }
      else{
        console.log("Error while deleting the comment")
      }
     }catch(err){
       console.log("Error while deleting the comment" , err.message)
     }
  }
  


  return (
    <div>       
           <div className="comments-container">
            {comments.length === 0 ? (
        <div className="no-comments">
          No Comments posted yet. Be the first to comment!!
        </div>
      ) : (
            comments.map((comment) => (
              <div key={comment._id} className="comment">
                <img
                   src={comment.userProfilePic.startsWith('http')
                       ? comment.userProfilePic
                       : `${API_URL}/${comment.userProfilePic.replace(/^\/+/, '')}`}
                  alt={comment.fullName}
                  className="comment-user-pic"
                />
                <div className="comment-content">
                  <div className="comment-header">
                    <span className="comment-user-name">{comment.fullName}</span>
                    <span className="comment-date">{new Date(comment.date).toLocaleDateString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    { loggedInUserId === comment.userId && <button className="delete-btn-icon" onClick={() => handleDeleteComment(comment)} title="Delete">
                         <FaTrash size={18} color="#dc3545" />
                    </button>}
                  </div>
                 
                  <p className="comment-text">{comment.text}</p>
                </div>
              </div>
            )))}
          </div>


    </div>
  )
}

export default GetComments
