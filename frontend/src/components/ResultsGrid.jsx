import React from 'react';
import {
  Grid,
  Card,
  CardMedia,
  CardContent,
  Typography,
  CardActions,
  Button
} from '@mui/material';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';

export default function ResultsGrid({ results, onSummarize }) {
  return (
    <Grid container spacing={2}>
      {results.length === 0 && (
        <Grid item xs={12}>
          <Typography variant="body1">No results found</Typography>
        </Grid>
      )}

      {results.map((doc) => {
        const isImage = doc.type?.startsWith('image/');
        return (
          <Grid item xs={12} sm={6} md={4} lg={3} key={doc.id}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              {isImage && doc.publicUrl ? (
                <CardMedia
                  component="img"
                  height="140"
                  image={doc.publicUrl}
                  alt={doc.filename}
                  sx={{ objectFit: 'cover' }}
                />
              ) : (
                <CardMedia
                  component={InsertDriveFileIcon}
                  sx={{ fontSize: 80, color: 'rgba(0,0,0,0.3)', p: 2, textAlign: 'center' }}
                />
              )}

              <CardContent sx={{ flexGrow: 1 }}>
                <Typography variant="subtitle1" noWrap>
                  {doc.filename}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {new Date(doc.created_at).toLocaleDateString()}
                </Typography>
              </CardContent>

              <CardActions>
                <Button
                  size="small"
                  href={doc.publicUrl || undefined}
                  target="_blank"
                  disabled={!doc.publicUrl}
                >
                  Download
                </Button>
                <Button
                  size="small"
                  onClick={() => onSummarize(doc.id)}
                >
                  Summarize
                </Button>
              </CardActions>
            </Card>
          </Grid>
        );
      })}
    </Grid>
  );
}
