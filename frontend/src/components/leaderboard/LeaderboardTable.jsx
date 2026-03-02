import React, { useState, useEffect } from 'react';
import { leaderboardService } from '../../services';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Box,
  CircularProgress,
  Chip,
  Alert,
  Button
} from '@mui/material';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import DownloadIcon from '@mui/icons-material/Download';
import { useSelector } from 'react-redux';
import { eventService } from '../../services';

const LeaderboardTable = ({ eventId }) => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [participants, setParticipants] = useState([]);
  const { user, isAuthenticated } = useSelector((state) => state.auth);

  const handleDownloadCertificate = async (eventId) => {
    try {
      const response = await eventService.getCertificate(eventId);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `certificate_${eventId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download certificate:', err);
      // Give specifically the actual server error text if generated, rather than constant default 
      alert(err.message || 'Failed to download certificate.');
    }
  };

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        setError(null);

        const data = await leaderboardService.getEventLeaderboard(eventId);
        setLeaderboard(data);

        if (isAuthenticated) {
          try {
            const parts = await eventService.getEventParticipants(eventId);
            setParticipants(Array.isArray(parts) ? parts : (parts?.data || []));
          } catch (e) {
            console.error('Failed to fetch participants for leaderboard', e);
          }
        }
      } catch (err) {
        console.error('Error fetching leaderboard:', err);
        setError(err.message || 'Failed to load leaderboard');
      } finally {
        setLoading(false);
      }
    };

    if (eventId) {
      fetchLeaderboard();
    }
  }, [eventId]);

  // Function to get medal color based on rank
  const getMedalColor = (rank) => {
    switch (rank) {
      case 1: return '#FFD700'; // Gold
      case 2: return '#C0C0C0'; // Silver
      case 3: return '#CD7F32'; // Bronze
      default: return 'transparent';
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" my={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ my: 2 }}>
        {error}
      </Alert>
    );
  }

  if (!leaderboard || leaderboard.length === 0) {
    return (
      <Alert severity="info" sx={{ my: 2 }}>
        No leaderboard data available for this event yet.
      </Alert>
    );
  }

  return (
    <Box sx={{ width: '100%', mb: 4 }}>
      <Typography variant="h5" component="h2" gutterBottom sx={{ mb: 3 }}>
        Event Leaderboard
      </Typography>

      <TableContainer component={Paper} sx={{ boxShadow: 3 }}>
        <Table aria-label="leaderboard table">
          <TableHead sx={{ backgroundColor: 'primary.main' }}>
            <TableRow>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Rank</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Participant</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>College</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="right">Score</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Achievements</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">Certificate</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {leaderboard.map((entry) => (
              <TableRow
                key={entry._id}
                sx={{
                  '&:nth-of-type(odd)': { backgroundColor: 'action.hover' },
                  '&:hover': { backgroundColor: 'action.selected' },
                  ...(entry.rank <= 3 && { backgroundColor: `${getMedalColor(entry.rank)}20` })
                }}
              >
                <TableCell>
                  <Box display="flex" alignItems="center">
                    {entry.rank <= 3 && (
                      <EmojiEventsIcon
                        sx={{
                          color: getMedalColor(entry.rank),
                          mr: 1,
                          filter: 'drop-shadow(0px 2px 2px rgba(0,0,0,0.3))'
                        }}
                      />
                    )}
                    {entry.rank}
                  </Box>
                </TableCell>
                <TableCell>{entry.userName}</TableCell>
                <TableCell>{entry.college || 'N/A'}</TableCell>
                <TableCell align="right">
                  <Typography fontWeight="bold">
                    {entry.score}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Box display="flex" flexWrap="wrap" gap={0.5}>
                    {entry.achievements && entry.achievements.length > 0 ? (
                      entry.achievements.map((achievement, index) => (
                        <Chip
                          key={index}
                          label={achievement}
                          size="small"
                          color="secondary"
                          variant="outlined"
                        />
                      ))
                    ) : (
                      <Typography variant="body2" color="text.secondary">None</Typography>
                    )}
                  </Box>
                </TableCell>
                <TableCell align="center">
                  {isAuthenticated && user && (String(user._id) === String(entry.userId) || String(user.id) === String(entry.userId)) ? (
                    participants.find(p => String(p.userId) === String(user._id) || String(p.userId) === String(user.id))?.attendanceStatus === 'completed' ? (
                      <Button
                        variant="outlined"
                        size="small"
                        color="primary"
                        startIcon={<DownloadIcon />}
                        onClick={() => handleDownloadCertificate(eventId)}
                      >
                        Download
                      </Button>
                    ) : (
                      <Typography variant="body2" color="text.secondary" title="Complete the event to unlock your certificate">
                        Pending
                      </Typography>
                    )
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      Private
                    </Typography>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default LeaderboardTable;