import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
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
  CircularProgress,
} from "@mui/material";
import { ArrowLeft } from 'lucide-react';
import MenuIcon from "@mui/icons-material/Menu";
import SortIcon from "@mui/icons-material/Sort";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import Particles from "../assets/Particals";
import { useDarkMode } from "../context/DarkModeContext";
import BlurText from "../assets/BlurText";
import ShinyText from "../assets/ShinyText";
import { Link } from "react-router-dom";
import { de } from "date-fns/locale";
import { search } from "../../../api/server";

export default function SearchPageLayout({ token }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [fileType, setFileType] = useState("");
  const [sortField, setSortField] = useState("created_at");
  const [sortOrder, setSortOrder] = useState("desc");
  const [results, setResults] = useState([]);
  const [currentSummary, setCurrentSummary] = useState({
    docId: null,
    text: "",
    loading: false,
  });
  const [summaryText, setSummaryText] = useState({
    docId: null,
    text: "",
    loading: false,
  });
  const { darkMode } = useDarkMode();

  const hostUrl =
    "https://api-sd-project-fea6akbyhygsh0hk.southafricanorth-01.azurewebsites.net";
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const initialTerm = params.get("term");
    if (initialTerm) {
      setQuestion(initialTerm);
      handleSearch();
    }
  }, [location.search]);

  const handleSearch = async () => {
    if (!question.trim()) return;
    setResults([]);
    setCurrentSummary({ docId: null, text: "", loading: true });

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
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

      const { answer, related } = await res.json();

      setResults(
        related.map((r) => ({
          id: r.id,
          filename: r.name,
          path: r.path,
          created_at: r.created_at,
          type: r.type,
        }))
      );

      setCurrentSummary({ docId: null, text: answer, loading: false });
    } catch (e) {
      console.error("Search failed", e);
      setCurrentSummary({
        docId: null,
        text: "Search failed. Please try again.",
        loading: false,
      });
    }

    setSidebarOpen(false);
  };

  const handleSummarize = async (docId) => {
    setSummaryText({ docId, text: "", loading: true });
    try {
      const res = await fetch(`${hostUrl}/api/search/summarize`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ docIds: [docId] }),
      });

      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

      const { summary } = await res.json();
      setSummaryText({ docId, text: summary, loading: false });
    } catch (e) {
      console.error("Summarize failed", e);
      setSummaryText({
        docId,
        text: "Error summarizing. Please try again.",
        loading: false,
      });
    }
  };

  const handleDownload = async (docId, filename) => {
    try {
      const res = await fetch(`${hostUrl}/api/search/download`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ docIds: [docId] }),
      });

      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Download failed", e);
    }
  };

  const renderCard = (doc) => (
    <Card
      key={doc.id}
      sx={{
        bgcolor: darkMode ? "#1e1e1e" : "#fff",
        color: darkMode ? "#fff" : "#000",
        m: 2,
      }}
    >
      <CardContent>
        <Typography variant="h6">{doc.filename}</Typography>
        <Typography variant="body2" color="textSecondary">
          {new Date(doc.created_at).toLocaleString()}
        </Typography>
        <Typography variant="caption">{doc.type}</Typography>
      </CardContent>
      <CardActions>
        <Button
          size="small"
          onClick={() => handleDownload(doc.id, doc.filename)}
        >
          Download
        </Button>
        <Button size="small" onClick={() => handleSummarize(doc.id)}>
          {summaryText.loading && summaryText.docId === doc.id ? (
            <CircularProgress size={20} />
          ) : (
            "Summarize"
          )}
        </Button>
      </CardActions>
      {summaryText.docId === doc.id && (
        <CardContent>
          <Typography variant="body2">{summaryText.text}</Typography>
        </CardContent>
      )}
    </Card>
  );

  const filters = (
    <Box
      sx={{
        width: 300,
        height: "100%",
        bgcolor: darkMode ? "#1e2939" : "#fff",
        p: 2,
        color: darkMode ? "#fff" : "#000",
      }}
    >
      <Typography variant="h6" gutterBottom>
        Filters
      </Typography>
      <Divider sx={{ mb: 2 }} />

      <FormControl fullWidth sx={{ mb: 2 }}>
        <DatePicker
          label="From"
          value={startDate}
          onChange={(newValue) => setStartDate(newValue)}
          slotProps={{
            textField: {
              fullWidth: true,
              variant: "outlined",
              InputProps: { style: { color: darkMode ? "#fff" : "#000" } },
              InputLabelProps: { style: { color: darkMode ? "#fff" : "#000" } },
            },
          }}
        />
      </FormControl>

      <FormControl fullWidth sx={{ mb: 2 }}>
        <DatePicker
          label="To"
          value={endDate}
          onChange={(newValue) => setEndDate(newValue)}
          slotProps={{
            textField: {
              fullWidth: true,
              variant: "outlined",
              InputProps: { style: { color: darkMode ? "#fff" : "#000" } },
              InputLabelProps: { style: { color: darkMode ? "#fff" : "#000" } },
            },
          }}
        />
      </FormControl>

      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel sx={{ color: darkMode ? "#fff" : "#000" }}>
          File Type
        </InputLabel>
        <Select
          value={fileType}
          onChange={(e) => setFileType(e.target.value)}
          label="File Type"
          sx={{ color: darkMode ? "#fff" : "#000" }}
        >
          <MenuItem value="">All</MenuItem>
          <MenuItem value="pdf">PDF</MenuItem>
          <MenuItem value="docx">DOCX</MenuItem>
          <MenuItem value="txt">TXT</MenuItem>
        </Select>
      </FormControl>

      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel sx={{ color: darkMode ? "#fff" : "#000" }}>
          Sort By
        </InputLabel>
        <Select
          value={sortField}
          onChange={(e) => setSortField(e.target.value)}
          label="Sort By"
          sx={{ color: darkMode ? "#fff" : "#000" }}
        >
          <MenuItem value="created_at">Date Created</MenuItem>
          <MenuItem value="name">Name</MenuItem>
        </Select>
      </FormControl>

      <FormControl fullWidth>
        <InputLabel sx={{ color: darkMode ? "#fff" : "#000" }}>
          Order
        </InputLabel>
        <Select
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
          label="Order"
          sx={{ color: darkMode ? "#fff" : "#000" }}
        >
          <MenuItem value="asc">Ascending</MenuItem>
          <MenuItem value="desc">Descending</MenuItem>
        </Select>
      </FormControl>
      <Box mt={3}>
        <Button variant="contained" fullWidth onClick={handleSearch}>
          Apply
        </Button>
      </Box>
      <Box mt={2}>
        <Button
          variant="outlined"
          fullWidth
          onClick={() => {
            setStartDate(null);
            setEndDate(null);
            setFileType("");
            setSortField("created_at");
            setSortOrder("desc");
          }}
        >
          Reset
        </Button>
      </Box>
    </Box>
  );

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <main
        className={`relative min-h-screen transition-colors duration-300 ${
          darkMode ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-900"
        }`}
      >

        <Link to="/"
            className="absolute top-6 left-6 group flex items-center space-x-1"
        >
        <ArrowLeft className="w-5 h-5 text-indigo-500 group-hover:text-indigo-600 transition" />
            <span className="opacity-0 group-hover:opacity-100 transition-opacity text-sm text-indigo-500">
                Back to Home
            </span>
        </Link>


        <section className="absolute inset-0 z-0">
          <Particles
            particleColors={["#ffffff", "#000000"]}
            particleCount={200}
            particleSpread={12}
            speed={0.1}
            particleBaseSize={100}
            moveParticlesOnHover={false}
            alphaParticles={false}
            disableRotation={false}
          />
        </section>

        <section className="relative z-10 flex items-center justify-center py-20 px-4">
          <article className="w-full max-w-3xl text-center">
            <BlurText
              text="What would you like to explore?"
              delay={70}
              animateBy="words"
              direction="top"
              className="text-4xl mb-8"
            />
            <div className="flex flex-col md:flex-row items-center gap-3">
              <Button
                variant="contained"
                size="large"
                onClick={() => setSidebarOpen(true)}
              >
                <MenuIcon /> Filters
              </Button>

              <TextField
                variant="outlined"
                fullWidth
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ask a question..."
                sx={{
                  mx: 2,
                  flexGrow: 1,
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "1rem",
                    backgroundColor: darkMode ? "#1e1e1e" : "#f9f9f9",
                    border: "1px solid",
                    borderColor: darkMode ? "#444" : "#ccc",
                    paddingX: 2,
                    paddingY: 1,
                    transition: "all 0.3s ease",
                    "&:hover": {
                      borderColor: darkMode ? "#888" : "#888",
                    },
                    "&.Mui-focused": {
                      borderColor: darkMode ? "#aaa" : "#555",
                      boxShadow: darkMode
                        ? "0 0 0 2px rgba(255, 255, 255, 0.2)"
                        : "0 0 0 2px rgba(0, 0, 0, 0.1)",
                    },
                    "& input": {
                      color: darkMode ? "#fff" : "#000",
                      padding: "10px 0",
                    },
                    "& input::placeholder": {
                      color: darkMode ? "#aaa" : "#888",
                      opacity: 1,
                    },
                  },
                }}
              />
              <button
                type="button"
                onClick={handleSearch}
                className={`px-4 py-2 rounded-md transition-colors ${
                  darkMode ? "bg-gray-900 text-white" : "bg-gray-200 text-black"
                }`}
              >
                <ShinyText
                  text="search!"
                  disabled={false}
                  speed={2}
                  className="custom-class"
                />
              </button>
            </div>
          </article>

          {currentSummary.loading ? (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress />
            </Box>
          ) : (
            currentSummary.text && (
              <Box mb={4}>
                <Typography variant="h6" gutterBottom>
                  Answer
                </Typography>
                <Typography variant="body1">{currentSummary.text}</Typography>
              </Box>
            )
          )}

          <Grid container spacing={2}>
            {results.map(renderCard)}
          </Grid>
        </section>

        <Drawer
          anchor="left"
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        >
          {filters}
        </Drawer>
      </main>
    </LocalizationProvider>
  );
}


