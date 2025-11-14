import React, { useState } from 'react';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  Button,
  Tabs,
  Tab,
  Container
} from '@mui/material';
import { useAuth } from '../hooks/useAuth';
import { PhotoUpload } from '../components/photos/PhotoUpload';
import { PhotoGallery } from '../components/photos/PhotoGallery';
import { MapView } from '../components/map/MapView';
import { TimelineView } from '../components/timeline/TimelineView';

const Dashboard: React.FC = () => {
  const { signOut, user } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleUploadComplete = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <Box>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            PhotoPin
          </Typography>
          <Typography variant="body2" sx={{ mr: 2 }}>
            {user?.email}
          </Typography>
          <Button color="inherit" onClick={signOut}>
            Sign Out
          </Button>
        </Toolbar>
      </AppBar>

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} centered>
          <Tab label="Upload" />
          <Tab label="Gallery" />
          <Tab label="Map" />
          <Tab label="Timeline" />
        </Tabs>
      </Box>

      <Container maxWidth="xl" sx={{ mt: 3 }}>
        {activeTab === 0 && <PhotoUpload onUploadComplete={handleUploadComplete} />}
        {activeTab === 1 && <PhotoGallery key={refreshKey} />}
        {activeTab === 2 && <MapView />}
        {activeTab === 3 && <TimelineView />}
      </Container>
    </Box>
  );
};

export default Dashboard;