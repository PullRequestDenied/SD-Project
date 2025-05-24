// src/components/SearchPageLayout.jsx
import React, { useState } from 'react'
import {
  Box,
  Button,
  TextField,
  Grid,
  Card,
  CardContent,
  CardActions,
  Typography,
  Drawer,
  IconButton,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import SortIcon from '@mui/icons-material/Sort'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'

export default function SearchPageLayout({ token }) {
  // State
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [question, setQuestion]       = useState('')
  const [startDate, setStartDate]     = useState(null)
  const [endDate, setEndDate]         = useState(null)
  const [fileType, setFileType]       = useState('')
  const [sortField, setSortField]     = useState('created_at')
  const [sortOrder, setSortOrder]     = useState('desc')
  const [results, setResults]         = useState([])
  const [currentSummary, setCurrentSummary] = useState({ docId: null, text: '', loading: false })
  const [summaryText, setSummaryText] = useState({ docId: null, text: '', loading: false })

  const hostUrl = 'http://localhost:5000'

  // Ask‐question search
const handleSearch = async () => {
  if (!question.trim()) return;
  setResults([]);
  setCurrentSummary({ docId: null, text: '', loading: false });

  const payload = {
    question,
    startDate: startDate ? startDate.toISOString() : undefined,
    endDate: endDate ? endDate.toISOString() : undefined,
    fileType: fileType || undefined,
    sortField,
    sortOrder,
  };

  try {
    const res = await fetch(`${hostUrl}/api/search/ask-question`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` // Ensure correct token format
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

    const { answer, related } = await res.json();

    setResults(
      related.map(r => ({
        id: r.id,
        filename: r.name,
        path: r.path,
        created_at: r.created_at,
        type: r.type,
      }))
    );

    setCurrentSummary({ docId: null, text: answer, loading: false });
  } catch (e) {
    console.error('Search failed', e);
    setCurrentSummary({ docId: null, text: 'Search failed. Please try again.', loading: false });
  }

  setSidebarOpen(false);
};
  // Summarize individual doc
const handleSummarize = async (docId) => {
  setSummaryText({ docId, text: '', loading: true });
  try {
    const res = await fetch(`${hostUrl}/api/search/summarize`, { // Corrected API path
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ docIds: [docId] })
    });

    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

    const { summary } = await res.json();
    setSummaryText({ docId, text: summary, loading: false });
  } catch (e) {
    console.error('Summarize failed', e);
    setSummaryText({ docId, text: 'Error summarizing. Please try again.', loading: false });
  }


  
};
const handleDownload = async (docId, filename) => {
  try {
    const res = await fetch(`${hostUrl}/api/search/download`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ docIds: [docId] }),
    });

    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (e) {
    console.error('Download failed', e);
  }
};
const clearAll = () => {
  setQuestion('');
  setStartDate(null);
  setEndDate(null);
  setFileType('');
  setSortField('created_at');
  setSortOrder('desc');
  setResults([]);
  setCurrentSummary({ docId: null, text: '', loading: false });
  setSummaryText({ docId: null, text: '', loading: false });
};


  // Sidebar filters
  const filters = (
    <Box p={2} width={260}>
      <Typography variant="h6" gutterBottom>Filters</Typography>
      <Divider />
      <Box mt={2}>
        <DatePicker
          label="From"
          value={startDate}
          onChange={setStartDate}
          renderInput={(props) => <TextField fullWidth size="small" {...props} />}
        />
      </Box>
      <Box mt={2}>
        <DatePicker
          label="To"
          value={endDate}
          onChange={setEndDate}
          renderInput={(props) => <TextField fullWidth size="small" {...props} />}
        />
      </Box>
      <Box mt={2}>
        <FormControl fullWidth size="small">
          <InputLabel>Type</InputLabel>
          <Select
            value={fileType}
            label="Type"
            onChange={(e) => setFileType(e.target.value)}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="application/pdf">PDF</MenuItem>
            <MenuItem value="image/png">PNG</MenuItem>
            <MenuItem value="text/plain">Text</MenuItem>
          </Select>
        </FormControl>
      </Box>
      <Box mt={2} display="flex" alignItems="center">
        <FormControl size="small" sx={{ flex: 1 }}>
          <InputLabel>Sort by</InputLabel>
          <Select
            value={sortField}
            label="Sort by"
            onChange={(e) => setSortField(e.target.value)}
          >
            <MenuItem value="created_at">Date</MenuItem>
            <MenuItem value="filename">Name</MenuItem>
          </Select>
        </FormControl>
        <IconButton onClick={() => setSortOrder(o => o === 'asc' ? 'desc' : 'asc')}>
          <SortIcon sx={{ transform: sortOrder === 'asc' ? 'rotate(180deg)' : 'none' }} />
        </IconButton>
      </Box>
      <Box mt={3}>
        <Button variant="contained" fullWidth onClick={handleSearch}>
          Apply
        </Button>
      <Box mt={2}>
        <Button
          variant="outlined"
          fullWidth
          onClick={() => {
            setStartDate(null);
            setEndDate(null);
            setFileType('');
            setSortField('created_at');
            setSortOrder('desc');
          }}
        >
          Reset
        </Button>
      </Box>
    </Box>
  </Box>
)

return (
  <LocalizationProvider dateAdapter={AdapterDateFns}>
    {/* Search Bar */}
    <Box display="flex" alignItems="center" justifyContent="center" py={4} bgcolor="#111">
      <Box sx={{ width: { xs: '90%', md: '60%' } }} display="flex" gap={1}>
        <TextField
          fullWidth
          variant="filled"
          placeholder="Ask a question about your documents…"
          value={question}
          onChange={e => setQuestion(e.target.value)}
          InputProps={{ sx: { backgroundColor: '#fff', borderRadius: 1 } }}
        />
        <Button variant="contained" onClick={() => setSidebarOpen(true)}>
          <MenuIcon /> Filters
        </Button>
        <Button variant="contained" onClick={handleSearch}>
          Search
        </Button>
        <Button variant="outlined" onClick={clearAll}>
          Clear
        </Button>
      </Box>
    </Box>

    {/* Answer Box (always visible first) */}
    {currentSummary.text && !currentSummary.docId && (
      <Box mx={2} my={2} p={3} bgcolor="#000" color="#fff" borderRadius={2} boxShadow={2}>
        <Typography variant="h6" gutterBottom>Answer:</Typography>
        <Typography mt={1}>{currentSummary.text}</Typography>
      </Box>
    )}

    {/* Files Grid */}
    <Box px={2} pb={4}>
      <Grid container spacing={2}>
        {results.map(doc => (
          <Grid key={doc.id} item xs={12} sm={6} md={4} lg={3}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography variant="subtitle1" noWrap>{doc.filename}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {new Date(doc.created_at).toLocaleDateString()}
                </Typography>
              </CardContent>
              <CardActions>
                <Button size="small" onClick={() => handleSummarize(doc.id)}>
                  Summarize
                </Button>
                <Button size="small" onClick={() => handleDownload(doc.id,doc.filename)}>  
                   Download                 
                </Button>
                
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>

    {/* Individual File Summary */}
    {summaryText.docId && (
      <Box mx={2} my={2} p={3} bgcolor="#222" color="#fff" borderRadius={2} boxShadow={2}>
        <Typography variant="h6" gutterBottom>
          {summaryText.loading
            ? 'Summarizing…'
            : `Summary for ${results.find(r => r.id === summaryText.docId)?.filename}:`}
        </Typography>
        <Typography mt={1}>{summaryText.text}</Typography>
      </Box>
    )}

    {/* Sidebar for filters */}
    <Drawer open={sidebarOpen} onClose={() => setSidebarOpen(false)}>
      {filters}
    </Drawer>
  </LocalizationProvider>
)
};
