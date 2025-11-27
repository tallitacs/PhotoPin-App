import React from 'react';
import { Box, Typography } from '@mui/material';
import { PhotoCard } from '../Photos/PhotoCard';
import { Photo } from '../../types/photo.types';
import { format, isToday, isYesterday, isThisYear } from 'date-fns';

interface TimelineItemProps {
  date: string;
  photos: Photo[];
  onPhotoClick?: (photo: Photo) => void;
  onEdit?: (photo: Photo) => void;
  onDelete?: (photoId: string) => void;
}

export const TimelineItem: React.FC<TimelineItemProps> = ({ 
  date, 
  photos,
  onPhotoClick,
  onEdit,
  onDelete
}) => {
  const dateObj = new Date(date);
  
  // Format date similar to Google Photos
  let dateLabel = '';
  if (isToday(dateObj)) {
    dateLabel = 'Today';
  } else if (isYesterday(dateObj)) {
    dateLabel = 'Yesterday';
  } else if (isThisYear(dateObj)) {
    // Same year: "January 15" or "March 3"
    dateLabel = format(dateObj, 'MMMM d');
  } else {
    // Different year: "January 15, 2023"
    dateLabel = format(dateObj, 'MMMM d, yyyy');
  }

  return (
    <Box 
      sx={{ 
        mb: 6,
        position: 'relative'
      }}
    >
      {/* Date Header - Google Photos style */}
      <Box
        sx={{
          position: 'sticky',
          top: 64, // Below navbar
          zIndex: 10,
          backgroundColor: 'background.default',
          py: 2,
          mb: 2,
          borderBottom: '1px solid',
          borderColor: 'divider'
        }}
      >
        <Typography 
          variant="h5" 
          sx={{ 
            fontWeight: 400,
            fontSize: { xs: '1.25rem', sm: '1.5rem' },
            color: 'text.primary',
            letterSpacing: '0.01em'
          }}
        >
          {dateLabel}
        </Typography>
        <Typography 
          variant="body2" 
          sx={{ 
            color: 'text.secondary',
            mt: 0.5,
            fontSize: '0.875rem'
          }}
        >
          {photos.length} {photos.length === 1 ? 'photo' : 'photos'}
        </Typography>
      </Box>

      {/* Photo Grid - Google Photos style masonry */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: 'repeat(2, 1fr)',
            sm: 'repeat(3, 1fr)',
            md: 'repeat(4, 1fr)',
            lg: 'repeat(5, 1fr)',
            xl: 'repeat(6, 1fr)'
          },
          gap: { xs: 1, sm: 1.5, md: 2 },
          gridAutoRows: '8px' // Base row height for masonry calculation
        }}
      >
        {photos.map((photo) => {
          // Calculate grid row span based on aspect ratio
          const width = photo.metadata?.width || 1;
          const height = photo.metadata?.height || 1;
          const aspectRatio = width / height;
          
          // Calculate row span: taller photos (vertical) need more rows
          // Base on a standard column width of ~250px
          const baseColumnWidth = 250;
          const photoHeight = baseColumnWidth / aspectRatio;
          const rowSpan = Math.ceil(photoHeight / 8); // Divide by base row height (8px)
          
          return (
            <Box
              key={photo.id}
              sx={{
                gridRowEnd: `span ${Math.max(rowSpan, 30)}`, // Minimum span of 30
                width: '100%'
              }}
            >
              <PhotoCard 
                photo={photo} 
                onClick={onPhotoClick}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};