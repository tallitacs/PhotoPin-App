import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Box, CircularProgress, Typography, Alert } from '@mui/material';
import * as api from '../../services/api.service';

const GOOGLE_ACCESS_TOKEN_KEY = 'google_access_token';

export const GoogleCallback: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const processCode = async () => {
      const query = new URLSearchParams(location.search);
      const code = query.get('code');

      if (!code) {
        setError('No authorization code found from Google.');
        return;
      }

      try {
        const data = await api.sendGoogleAuthCode(code);
        if (data.success && data.tokens.access_token) {
          // Save the access token and navigate back to the import page
          localStorage.setItem(GOOGLE_ACCESS_TOKEN_KEY, data.tokens.access_token);
          navigate('/import');
        } else {
          setError('Failed to exchange code for tokens.');
        }
      } catch (err) {
        setError('An error occurred during token exchange.');
      }
    };

    processCode();
  }, [location, navigate]);

  return (
    <Box
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      height="80vh"
    >
      {error ? (
        <Alert severity="error">{error}</Alert>
      ) : (
        <>
          <CircularProgress />
          <Typography sx={{ mt: 2 }}>
            Authenticating with Google...
          </Typography>
        </>
      )}
    </Box>
  );
};