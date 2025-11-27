import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { 
  Box, 
  Button, 
  TextField, 
  Typography, 
  Container, 
  Paper,
  Grid,
  Link
} from '@mui/material';

export const SignupForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [error, setError] = useState('');
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPass) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    setError('');
    try {
      const user = await signup(email, password);
      if (user) {
        navigate('/');
      }
    } catch (err: any) {
      console.error('Signup error:', err);
      // Handle Firebase Auth errors
      let errorMessage = 'Failed to sign up. Please try again.';
      if (err.code === 'auth/email-already-in-use') {
        errorMessage = 'This email is already registered. Please sign in instead.';
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address.';
      } else if (err.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak. Please use a stronger password.';
      } else if (err.code === 'auth/network-request-failed') {
        errorMessage = 'Network error. Please check your connection.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      setError(errorMessage);
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Paper elevation={3} sx={{ mt: 8, p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Typography component="h1" variant="h5">
          Sign up for PhotoPin
        </Typography>
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Email Address"
            name="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            sx={{
              '& .MuiOutlinedInput-root': {
                '&.Mui-focused': {
                  '& fieldset': {
                    borderColor: '#ff7a33', // Lighter orange for focus border
                  },
                  backgroundColor: 'rgba(255, 122, 51, 0.08)', // Light orange background when focused
                },
                // Override browser autofill styles with darker background
                '& input:-webkit-autofill': {
                  WebkitBoxShadow: '0 0 0 100px rgba(30, 30, 30, 0.8) inset !important',
                  WebkitTextFillColor: 'rgba(255, 255, 255, 0.87) !important',
                  caretColor: 'rgba(255, 255, 255, 0.87) !important',
                  transition: 'background-color 5000s ease-in-out 0s', // Prevent color change
                },
                '& input:-webkit-autofill:hover': {
                  WebkitBoxShadow: '0 0 0 100px rgba(30, 30, 30, 0.9) inset !important',
                },
                '& input:-webkit-autofill:focus': {
                  WebkitBoxShadow: '0 0 0 100px rgba(30, 30, 30, 0.95) inset !important',
                },
              },
              '& .MuiInputLabel-root.Mui-focused': {
                color: '#ff7a33', // Lighter orange for label when focused
              },
            }}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Password"
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            sx={{
              '& .MuiOutlinedInput-root': {
                '&.Mui-focused': {
                  '& fieldset': {
                    borderColor: '#ff7a33', // Lighter orange for focus border
                  },
                  backgroundColor: 'rgba(255, 122, 51, 0.08)', // Light orange background when focused
                },
                // Override browser autofill styles with darker background
                '& input:-webkit-autofill': {
                  WebkitBoxShadow: '0 0 0 100px rgba(30, 30, 30, 0.8) inset !important',
                  WebkitTextFillColor: 'rgba(255, 255, 255, 0.87) !important',
                  caretColor: 'rgba(255, 255, 255, 0.87) !important',
                  transition: 'background-color 5000s ease-in-out 0s', // Prevent color change
                },
                '& input:-webkit-autofill:hover': {
                  WebkitBoxShadow: '0 0 0 100px rgba(30, 30, 30, 0.9) inset !important',
                },
                '& input:-webkit-autofill:focus': {
                  WebkitBoxShadow: '0 0 0 100px rgba(30, 30, 30, 0.95) inset !important',
                },
              },
              '& .MuiInputLabel-root.Mui-focused': {
                color: '#ff7a33', // Lighter orange for label when focused
              },
            }}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="confirmPassword"
            label="Confirm Password"
            type="password"
            id="confirmPassword"
            value={confirmPass}
            onChange={(e) => setConfirmPass(e.target.value)}
            sx={{
              '& .MuiOutlinedInput-root': {
                '&.Mui-focused': {
                  '& fieldset': {
                    borderColor: '#ff7a33', // Lighter orange for focus border
                  },
                  backgroundColor: 'rgba(255, 122, 51, 0.08)', // Light orange background when focused
                },
                // Override browser autofill styles with darker background
                '& input:-webkit-autofill': {
                  WebkitBoxShadow: '0 0 0 100px rgba(30, 30, 30, 0.8) inset !important',
                  WebkitTextFillColor: 'rgba(255, 255, 255, 0.87) !important',
                  caretColor: 'rgba(255, 255, 255, 0.87) !important',
                  transition: 'background-color 5000s ease-in-out 0s', // Prevent color change
                },
                '& input:-webkit-autofill:hover': {
                  WebkitBoxShadow: '0 0 0 100px rgba(30, 30, 30, 0.9) inset !important',
                },
                '& input:-webkit-autofill:focus': {
                  WebkitBoxShadow: '0 0 0 100px rgba(30, 30, 30, 0.95) inset !important',
                },
              },
              '& .MuiInputLabel-root.Mui-focused': {
                color: '#ff7a33', // Lighter orange for label when focused
              },
            }}
          />
          {error && (
            <Typography color="error" variant="body2" sx={{ mt: 1 }}>
              {error}
            </Typography>
          )}
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
          >
            Sign Up
          </Button>
           <Grid container justifyContent="flex-end">
            <Grid item>
              <Link component={RouterLink} to="/login" variant="body2">
                {"Already have an account? Sign in"}
              </Link>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Container>
  );
};