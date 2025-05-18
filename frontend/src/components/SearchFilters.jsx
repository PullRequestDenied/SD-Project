// src/components/SearchFilters.jsx
import React, { useState, useCallback } from 'react'
import AsyncSelect from 'react-select/async'
import { Box, Button, TextField, FormControl, Select,MenuItem,
InputLabel  } from '@mui/material'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'

export default function SearchFilters({ token, onSearch }) {
  const [termOption, setTermOption] = useState(null)
  const [startDate, setStartDate] = useState(null)
  const [endDate, setEndDate] = useState(null)
  const [fileType, setFileType] = useState('') 

  // Async suggestions loader
  const loadOptions = useCallback(async (inputValue) => {
    const res = await fetch(
      `http://localhost:5000/api/search/suggestions?term=${encodeURIComponent(inputValue)}`,
    )
    if (!res.ok) return []
    const list = await res.json()
    return list.map(f => ({ value: f, label: f }))
  }, [token])

  // When the user clicks "Search"
  const handleSearch = () => {
    const term = termOption?.value ?? ''
    const from = startDate?.toISOString()
    const to   = endDate?.toISOString()
    onSearch({ term, from, to })
    fileType    
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box
        component="form"
        display="grid"
        gridTemplateColumns="1fr auto auto auto"
        gap={2}
        alignItems="center"
        onSubmit={e => { e.preventDefault(); handleSearch() }}
      >
        {/* Autocomplete input */}
        <AsyncSelect
          cacheOptions
          defaultOptions
          loadOptions={loadOptions}
          onChange={setTermOption}
          value={termOption}
          placeholder="Search documents…"
        />

        {/* From date picker */}
        <DatePicker
          label="From"
          value={startDate}
          onChange={setStartDate}
          renderInput={props => <TextField {...props} size="small" />}
        />

        {/* To date picker */}
        <DatePicker
          label="To"
          value={endDate}
          onChange={setEndDate}
          renderInput={props => <TextField {...props} size="small" />}
        />
                <FormControl size="small">
          <InputLabel id="file-type-label">Type</InputLabel>
          <Select
            labelId="file-type-label"
            value={fileType}
            label="Type"
            onChange={e => setFileType(e.target.value)}
            sx={{ minWidth: 120 }}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="application/pdf">PDF</MenuItem>
            <MenuItem value="image/jpeg">JPEG</MenuItem>
            <MenuItem value="text/plain">Text</MenuItem>
          </Select>
        </FormControl>

        {/* Submit button */}
        <Button
          type="submit"
          variant="contained"
          sx={{ height: '40px' }}
        >
          Search
        </Button>
      </Box>
    </LocalizationProvider>
  )
}
