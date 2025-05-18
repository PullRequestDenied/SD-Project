// src/components/DateFilter.jsx
import * as React from 'react';
import { DateRangePicker } from '@mui/x-date-pickers-pro/DateRangePicker'; 
import TextField from '@mui/material/TextField';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';

export default function DateFilter({ range, onChange }) {
  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <DateRangePicker
        startText="From"
        endText="To"
        value={range}                      // [Date|null, Date|null]
        onChange={onChange}                // newRange => setRange(newRange)
        renderInput={(startProps, endProps) => (
          <>
            <TextField {...startProps} />
            <TextField {...endProps} />
          </>
        )}
      />
    </LocalizationProvider>
  );
}
