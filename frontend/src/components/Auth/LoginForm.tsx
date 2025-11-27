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

export const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const user = await login(email, password);
      if (user) {
        navigate('/');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      // Handle Firebase Auth errors
      let errorMessage = 'Failed to log in. Please check your credentials.';
      if (err.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email.';
      } else if (err.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password.';
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address.';
      } else if (err.code === 'auth/user-disabled') {
        errorMessage = 'This account has been disabled.';
      } else if (err.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed attempts. Please try again later.';
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
          Sign in to PhotoPin
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
            autoFocus
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
            autoComplete="current-password"
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
            Sign In
          </Button>
          <Grid container>
            <Grid item>
              <Link component={RouterLink} to="/signup" variant="body2">
                {"Don't have an account? Sign Up"}
              </Link>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Container>
  );
};