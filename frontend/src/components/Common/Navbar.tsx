import { AppBar, Toolbar, Typography, Button, Box, IconButton, Tooltip } from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useThemeMode } from '../../hooks/useTheme';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import FavoriteIcon from '@mui/icons-material/Favorite';

export const Navbar: React.FC = () => {
  const { logout, user } = useAuth();
  const { mode, toggleTheme } = useThemeMode();
  const navigate = useNavigate();

  const handleLogoClick = () => {
    // Dispatch event to close map sidebar if open
    window.dispatchEvent(new CustomEvent('closeMapSidebar'));
    // Navigate to home page
    navigate('/', { replace: true });
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
          <Box
            component="img"
            src="/icons/PHOTOPIN LOGO _v2 white.png"
            alt="PhotoPin Logo"
            sx={{
              height: '40px',
              width: 'auto'
            }}
          />
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
          <Button component={RouterLink} to="/favorites" color="inherit">
            <FavoriteIcon />
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

        <Typography variant="body2" sx={{ mr: 2, color: 'white' }}>
          {user?.email}
        </Typography>
        <Button color="inherit" onClick={logout}>
          Logout
        </Button>
      </Toolbar>
    </AppBar>
  );
};