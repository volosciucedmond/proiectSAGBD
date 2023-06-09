import React, { useState, useEffect } from "react";
import axios from "axios";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TablePagination from "@mui/material/TablePagination";
import TableRow from "@mui/material/TableRow";
import { Modal, Box, Typography, TextField, Button } from "@mui/material";

const columns = [
  { id: "county", label: "County", minWidth: 100 },
  { id: "cityCount", label: "City Count", minWidth: 100 },
  { id: "totalPopulation", label: "Total Population", minWidth: 100 },
];

export default function CityTable() {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [rows, setRows] = useState([]);
  const [selectedCounty, setSelectedCounty] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  const [countyData, setCountyData] = useState({});
  const [newCountyData, setNewCountyData] = useState({});
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    axios
      .get("/api/counties")
      .then((response) => {
        // Generate random city counts for each row between 40 and 60
        const modifiedRows = response.data.counties.map((row) => ({
          ...row,
          cityCount: Math.floor(Math.random() * 21) + 40, // Random value between 40 and 60
        }));
        setRows(modifiedRows);
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  }, []);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleCountyClick = (county) => {
    setSelectedCounty(county);
    setCountyData(county);
    setOpenModal(true);
  };

  const handleModalClose = () => {
    setOpenModal(false);
    setCountyData(null);
    setNewCountyData(null);
  };

  const handleSaveChanges = () => {
    if (selectedCounty) {
      const { cityCount } = countyData;

      const updatedCityCount =
        cityCount !== undefined && cityCount !== ""
          ? parseInt(cityCount)
          : Math.floor(Math.random() * 21) + 40;

      const updatedRows = rows.map((row) => {
        if (row.id === selectedCounty.id) {
          return { ...row, cityCount: updatedCityCount };
        }
        return row;
      });
      setRows(updatedRows);
    } else {
      const newCounty = {
        id: Math.random().toString(),
        ...newCountyData,
        cityCount: Math.floor(Math.random() * 21) + 40,
      };
      setRows([...rows, newCounty]);
    }

    setOpenModal(false);
    setCountyData({});
    setNewCountyData({});
    setSelectedCounty(null);
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const filteredRows = rows.filter((row) =>
    row.county.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!rows || rows.length === 0) {
    return <div>Loading...</div>;
  }

  return (
    <Paper>
      <TextField
        label="Search County"
        value={searchQuery}
        onChange={handleSearchChange}
        style={{ margin: "1rem" }}
      />

      <Button variant="contained" onClick={() => setOpenModal(true)}>
        Create
      </Button>

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell key={column.id} align="center">
                  {column.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredRows
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((row) => (
                <TableRow key={row.id} onClick={() => handleCountyClick(row)}>
                  {columns.map((column) => (
                    <TableCell key={column.id} align="center">
                      {row[column.id]}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[10, 25, 50]}
        component="div"
        count={filteredRows.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
      />

      <Modal open={openModal} onClose={handleModalClose}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            bgcolor: "background.paper",
            border: "2px solid #000",
            boxShadow: 24,
            p: 2,
          }}
        >
          <Typography variant="h6">
            {selectedCounty ? selectedCounty.county : "Create New County"}
          </Typography>
          <TextField
            label="City Count"
            value={
              selectedCounty
                ? countyData.cityCount || ""
                : newCountyData.cityCount || ""
            }
            onChange={(e) => {
              if (selectedCounty) {
                setCountyData({ ...countyData, cityCount: e.target.value });
              } else {
                setNewCountyData({
                  ...newCountyData,
                  cityCount: e.target.value,
                });
              }
            }}
          />
          <TextField
            label="Total Population"
            value={
              selectedCounty
                ? countyData.totalPopulation || ""
                : newCountyData.totalPopulation || ""
            }
            onChange={(e) => {
              if (selectedCounty) {
                setCountyData({
                  ...countyData,
                  totalPopulation: e.target.value,
                });
              } else {
                setNewCountyData({
                  ...newCountyData,
                  totalPopulation: e.target.value,
                });
              }
            }}
          />
          {selectedCounty ? (
            <Button variant="contained" onClick={handleSaveChanges}>
              Save Changes
            </Button>
          ) : (
            <Button variant="contained" onClick={handleSaveChanges}>
              Create
            </Button>
          )}
        </Box>
      </Modal>
    </Paper>
  );
}
