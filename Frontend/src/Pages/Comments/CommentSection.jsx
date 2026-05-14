import React from 'react'
import GetComments from './GetComments'
import PostComments from './PostComments'
import { useLocation, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useEffect } from 'react'
import { API_URL } from '../../../ConfigApi/Api'
import {fetchCommentsByPostId} from './fetchCommentsByPostId';



const CommentSection = () => {
    const location = useLocation();
  const postId = location.state?.postId; // Get post from location state
    const navigate = useNavigate();
  const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Get post and userId from location state
    // This assumes that the post and userId are passed in the state when navigating to this component

    useEffect(()=>{
            const fetchComments = async ()=>{
                try{
                    setLoading(true);
                    const fetchedComments = await fetchCommentsByPostId(postId);
                    setComments(fetchedComments);
                    setLoading(false);
                }catch(err){
                    setError(true)
                    console.log(err);
                }
          }
      fetchComments(); 
    }, [postId]);


    
    const handleNewComment = (newComment) => {
        setComments(prev => [newComment, ...prev]);
    };

    const handleDeleteComment = (commentId) =>{
        setComments(prev => prev.filter(comment =>comment._id !== commentId))
    };
    

    if (loading) {
        return <div>Loading comments...</div>;
    }
    if (error) {
        return <div>Error: {error}</div>;
    }

  return (
    <div>
        <div className='comments-header'>
            <button className="Search-back-btn" onClick={() => navigate(-1)}>
             ← 
            </button>
            <p className='comments-title'>Comments</p>
        
        </div>
        
       <GetComments comments={comments} onDeleteComment={handleDeleteComment}/>
       <PostComments postId={postId} onNewComment={handleNewComment}/>
       
    </div>
  )
}

export default CommentSection
