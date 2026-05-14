import React, { useState , useEffect} from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../../Styles/Signin.css';
import { API_URL } from '../../../ConfigApi/Api';

const Signin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${API_URL}/ping`);
  }, []);

  const submitHandler = async (e) => {
    e.preventDefault();

    // Password validation
    if (password.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      return;
    }

    setPasswordError("");
    setLoading(true);

    const data = {
      email,
      password,
    };

    try {
      const res = await axios.post(`${API_URL}/user/signin`, data, {
        withCredentials: true,
      });

      if (res.data.success) {
        if (res.data.token) {
          localStorage.setItem('token', res.data.token);
        }
        navigate('/home');
      } else {
        alert('Login failed');
      }

    } catch (error) {
      if (error.response?.data?.message) {
        alert(error.response.data.message);
      } else {
        alert('Something went wrong. Please try again.');
      }

      console.error('Login error:', error);

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='signin-container'>
      <div className='signin-card'>
        <h1 className='signin-title'>Sign In</h1>

        <form className='signin-form' onSubmit={submitHandler}>
          
          <div className='form-group'>
            <label className='form-label'>Email</label>
            <input
              className='form-input'
              type='email'
              name='email'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder='Enter your email'
              required
            />
          </div>

          <div className='form-group'>
            <label className='form-label'>Password</label>
            <input
              className='form-input'
              type='password'
              name='password'
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);

                if (e.target.value.length < 6) {
                  setPasswordError("Password must be at least 6 characters");
                } else {
                  setPasswordError("");
                }
              }}
              placeholder='Enter your password'
              required
            />

            {/* Error message */}
            {passwordError && (
              <p style={{color: "red", fontSize: "13px", marginTop: "4px"}}>
                {passwordError}
              </p>
            )}
          </div>

          <button className='submit-btn' type='submit' disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>

          <div className='signup-link'>
            Don't have an account? <Link to='/signup'>Create one</Link>
          </div>

        </form>
      </div>
    </div>
  );
};

export default Signin;