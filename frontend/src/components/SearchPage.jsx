// src/components/SearchPageLayout.jsx
import React, { useState, useCallback } from 'react'
import AsyncSelect from 'react-select/async'
import {
  Box,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Card,
  CardContent,
  CardActions,
  Typography,
  Drawer,
  IconButton,
  Divider,
} from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import SortIcon from '@mui/icons-material/Sort'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'

export default function SearchPageLayout({ token }) {
  // State
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [termOption, setTermOption] = useState(null)
  const [startDate, setStartDate] = useState(null)
  const [endDate, setEndDate] = useState(null)
  const [fileType, setFileType] = useState('')
  const [sortField, setSortField] = useState('created_at')
  const [sortOrder, setSortOrder] = useState('desc')
  const [results, setResults] = useState([])
  const [currentSummary, setCurrentSummary] = useState({ docId: null, text: '', loading: false })

  // Suggestion loader
  const loadOptions = useCallback(async (input) => {
    setInputValue(input)
    const res = await fetch(
      `http://localhost:5000/api/search/suggestions?term=${encodeURIComponent(input)}`
    )
    if (!res.ok) return []
    const list = await res.json()
    return list.map((f) => ({ label: f, value: f }))
  }, [token])

  // Search
  const handleSearch = async () => {
    const term = termOption?.value ?? inputValue
    const from = startDate?.toISOString()
    const to = endDate?.toISOString()
    const params = new URLSearchParams()
    if (term) params.set('term', term)
    if (from) params.set('from', from)
    if (to) params.set('to', to)
    if (fileType) params.set('fileType', fileType)
    if (sortField) params.set('sort', sortField)
    if (sortOrder) params.set('order', sortOrder)

    const res = await fetch(`http://localhost:5000/api/search?${params}`)
    const json = await res.json()
    setResults(json.results || [])
    setSidebarOpen(false)
  }

  // Summarize
  const handleSummarize = async (docId) => {
    setCurrentSummary({ docId, text: '', loading: true })
    const res = await fetch('/api/search/summarize', {
      method: 'POST', headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ docIds: [docId] }),
    })
    const { summary } = await res.json()
    setCurrentSummary({ docId, text: summary, loading: false })
  }

  // Sidebar filters (removed keyword selector)
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
      </Box>
    </Box>
  )

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box display="flex" alignItems="center" justifyContent="center" py={4} bgcolor="#111">
        <Box sx={{ width: { xs: '90%', md: '60%' } }} display="flex" gap={1}>
          <AsyncSelect
            cacheOptions
            defaultOptions
            loadOptions={loadOptions}
            onChange={setTermOption}
            inputValue={inputValue}
            onInputChange={setInputValue}
            placeholder="Search documents..."
            styles={{
              container: b => ({ ...b, flex: 1 }),
              control: b => ({ ...b, minHeight: 48 }),
              menu: b => ({ ...b, color: 'black' }),
              option: (b, s) => ({ ...b, color: 'black' }),
              singleValue: b => ({ ...b, color: 'black' }),
              input: b => ({ ...b, color: 'black' }),
            }}
          />
          <Button variant="contained" size="large" onClick={() => setSidebarOpen(true)}>
            <MenuIcon /> Filters
          </Button>
          <Button variant="contained" size="large" onClick={handleSearch}>
            Search
          </Button>
        </Box>
      </Box>

      <Drawer open={sidebarOpen} onClose={() => setSidebarOpen(false)}>
        {filters}
      </Drawer>

      <Box px={2} pb={4}>
        <Grid container spacing={2}>
          {results.map(doc => (
            <Grid key={doc.id} item xs={12} sm={6} md={4} lg={3}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="subtitle1" noWrap>
                    {doc.filename}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(doc.created_at).toLocaleDateString()}
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button size="small" onClick={() => handleSummarize(doc.id)}>
                    Summarize
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      {currentSummary.docId && (
        <Box mx={2} mb={4} p={3} bgcolor="#ffffff" borderRadius={2} boxShadow={2}>
          <Typography variant="h6">
            {currentSummary.loading
              ? 'Summarizing…'
              : `Summary for ${results.find(r => r.id === currentSummary.docId)?.filename}:`}
          </Typography>
          {!currentSummary.loading && (
            <Typography mt={1}>{currentSummary.text}</Typography>
          )}
        </Box>
      )}
    </LocalizationProvider>
  )
}
