import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';

export const Navbar: React.FC = () => {
  const { logout, user } = useAuth();

  return (
    <AppBar position="static">
      <Toolbar>
        <PhotoCameraIcon sx={{ mr: 2 }} />
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          PhotoPin
        </Typography>

        <Box>
          <Button component={RouterLink} to="/" color="inherit">
            Gallery
          </Button>
          <Button component={RouterLink} to="/timeline" color="inherit">
            Timeline
          </Button>
          <Button component={RouterLink} to="/map" color="inherit">
            Map
          </Button>
          <Button component={RouterLink} to="/upload" color="inherit">
            Upload
          </Button>
        </Box>
        
        <Box sx={{ flexGrow: 1 }} />

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