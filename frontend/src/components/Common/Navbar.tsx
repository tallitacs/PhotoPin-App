import { AppBar, Toolbar, Typography, Button, Box, IconButton, Tooltip } from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useThemeMode } from '../../hooks/useTheme';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';

export const Navbar: React.FC = () => {
  const { logout, user } = useAuth();
  const { mode, toggleTheme } = useThemeMode();
  const navigate = useNavigate();

  const handleLogoClick = () => {
    navigate('/');
  };

  return (
    <AppBar position="static">
      <Toolbar>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            cursor: 'pointer',
            mr: 2,
            '&:hover': {
              opacity: 0.8
            }
          }}
          onClick={handleLogoClick}
        >
          <PhotoCameraIcon sx={{ mr: 1 }} />
          <Typography variant="h6" component="div">
            PhotoPin
          </Typography>
        </Box>
        <Box sx={{ flexGrow: 1 }} />

        <Box>
          <Button component={RouterLink} to="/gallery" color="inherit">
            Gallery
          </Button>
          <Button component={RouterLink} to="/timeline" color="inherit">
            Timeline
          </Button>
          <Button component={RouterLink} to="/albums" color="inherit">
            Albums
          </Button>
          <Button component={RouterLink} to="/memories" color="inherit">
            Memories
          </Button>
          <Button component={RouterLink} to="/upload" color="inherit">
            Upload
          </Button>
          {/* NEW: Import Button */}
          <Button component={RouterLink} to="/import" color="inherit">
            Import
          </Button>
        </Box>
        
        <Box sx={{ flexGrow: 1 }} />

        {/* Theme Toggle */}
        <Tooltip title={mode === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}>
          <IconButton
            color="inherit"
            onClick={toggleTheme}
            sx={{ mr: 1 }}
            aria-label="toggle theme"
          >
            {mode === 'light' ? <DarkModeIcon /> : <LightModeIcon />}
          </IconButton>
        </Tooltip>

        <Typography variant="body2" sx={{ mr: 2 }}>
          {user?.email}
        </Typography>
        <Button color="inherit" onClick={logout}>
          Logout
        </Button>
      </Toolbar>
    </AppBar>
  );
};