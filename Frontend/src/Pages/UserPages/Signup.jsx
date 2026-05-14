import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom';
import '../../Styles/Signup.css';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../../../ConfigApi/Api';

const Signup = () => {

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [profilePic , setProfilePic] = useState('');
  const [passwordError , setPasswordError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  
 const submitHandler = async (e) => {
    e.preventDefault();

    if(password.length < 6){
      setPasswordError("Password must be at least 6 characters");
      return;
    }

    setPasswordError("");
    setLoading(true);

    try {

      const formData = new FormData();
      formData.append("fullName", fullName);
      formData.append("email", email);
      formData.append("password", password);
      formData.append("profilePic", profilePic);

      const res = await axios.post(`${API_URL}/user/signup`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      console.log(res.data);

      setFullName('');
      setEmail('');
      setPassword('');
      setProfilePic('');

      alert("Registration successful");
      navigate("/signin")

    } catch (error) {
      console.error("Signup error:", error);
      alert("Signup failed. Try again.");
    } finally {
      setLoading(false);
    }
 }

  return (
    <div className='signup-container'>
      <div className='signup-card'>
        <h1 className='signup-title'>Register with a New Account!</h1>

        <form className='signup-form' onSubmit={submitHandler}>

          <div className='form-group'>
            <label className='form-label'>Full Name</label>
            <input 
              className='form-input'
              onChange={(e) => setFullName(e.target.value)}
              value={fullName}
              type="text" 
              placeholder="Enter your full name" 
              required
            />
          </div>
      
          <div className='form-group'>
            <label className='form-label'>Email</label>
            <input 
              className='form-input'
              onChange={(e) => setEmail(e.target.value)}
              value={email}
              type="email"
              placeholder="Enter your email" 
              required
            />
          </div>
      
          <div className='form-group'>
            <label className='form-label'>Password</label>
            <input 
              className={`form-input ${passwordError ? "input-error" : ""}`}
              onChange={(e) => {
                setPassword(e.target.value)

                if(e.target.value.length < 6){
                  setPasswordError("Password must be at least 6 characters")
                }else{
                  setPasswordError("")
                }
              }}
              value={password}
              type="password"
              placeholder="Create a password"
              required
            />

            {passwordError && (
              <p className="password-error">{passwordError}</p>
            )}
          </div>
      
          <div className='form-group'>
            <label className='form-label'>Profile Pic</label>
            <input 
              className='form-input'
              onChange={(e) => setProfilePic(e.target.files[0])}
              type="file"
              accept="image/*"
              required
            />
          </div>
      
          <button className='submit-btn' type="submit" disabled={loading}>
            {loading ? "Creating account..." : "Create Account"}
          </button>
      
          <div className='login-link'>
            Already have an account? <Link to="/signin">Login here</Link>
          </div>

        </form>
      </div>
    </div>
  )
}

export default Signup