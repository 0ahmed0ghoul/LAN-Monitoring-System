const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const find = require('local-devices');
const { promises: fs } = require('fs');
const path = require('path');

const app = express();
const PORT = 3001;
const DATA_DIR = path.join(__dirname, 'data');
const LOG_FILE = path.join(DATA_DIR, 'agent_data.json');

// Create data directory if not exists
fs.mkdir(DATA_DIR, { recursive: true }).catch(console.error);
const MY_PC_IP = '192.168.56.1'; // Change this to your PC's IP

// Enhanced CORS configuration
const corsOptions = {
  origin: ['http://localhost:5173','http://localhost:8080', 'http://10.99.179.224:5173'],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(bodyParser.json({ limit: '10mb' }));

// Store agent data in memory (with persistence to disk)
let devicesData = {};


// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: err.message
  });
});

// Load saved agent data on startup
async function loadAgentData() {
  try {
    const data = await fs.readFile(LOG_FILE, 'utf8');
    devicesData = JSON.parse(data);
    console.log('Loaded existing agent data');
  } catch (err) {
    if (err.code !== 'ENOENT') {
      console.error('Error loading agent data:', err);
    }
  }
}

// Save agent data to disk
async function saveAgentData() {
  try {
    await fs.writeFile(LOG_FILE, JSON.stringify(devicesData, null, 2));
  } catch (err) {
    console.error('Error saving agent data:', err);
  }
}

// Auto-save data every 30 seconds
setInterval(saveAgentData, 30000);

// Load existing data when server starts
loadAgentData();

app.post('/api/receive', async (req, res) => {
  try {
    const { system, software, timestamp } = req.body;

    if (!system || !system.ip || !Array.isArray(software)) {
      return res.status(400).json({
        error: "Missing or invalid data",
        required: ["system.ip", "software (array)"]
      });
    }

    // Ensure each software entry has required fields
    const validSoftware = software
      .filter(s => s.name && s.version && s.size && s.installDate)
      .sort((a, b) => new Date(b.installDate) - new Date(a.installDate)) // latest first
      .slice(0, 40); // take only the latest 40

    // Replace existing data with new one
    devicesData[system.ip] = {
      system,
      software: validSoftware,
      lastUpdated: timestamp || new Date().toISOString()
    };

    console.log(`✅ Updated data from ${system.ip} (${system.hostname})`);

    res.status(200).json({
      status: 'success',
      message: 'Data received and updated',
      ip: system.ip
    });

  } catch (error) {
    console.error('❌ Error in /api/receive:', error);
    res.status(500).json({
      error: "Internal server error",
      details: error.message
    });
  }
});

app.get('/api/devices', async (req, res) => {
  try {
    // Load agent_data.json
    const rawData = await fs.readFile(LOG_FILE, 'utf8');
    const agentData = JSON.parse(rawData);

    // Transform entries into an array of devices
    const devices = Object.entries(agentData).map(([ip, data]) => {
      const sys = data.system || {};
      return {
        ip,
        mac: sys.mac || 'Unknown',
        hostname: sys.hostname || 'Unknown',
        os: sys.os_info?.os || 'Unknown',
        osVersion: sys.os_info?.version || 'Unknown',
        cpuUsage: sys.cpu?.usage_percent ?? null,
        ramUsage: sys.ram?.used_percent ?? null,
        diskUsage: sys.disk?.used_percent ?? null,
        totalRamGb: sys.ram?.total_gb ?? null,
        totalDiskGb: sys.disk?.total_gb ?? null,
        software: data.software || [],
        isMyPc: ip === MY_PC_IP,
        lastUpdated: data.timestamp || null
      };
    });

    res.json({
      status: 'success',
      count: devices.length,
      devices
    });
  } catch (error) {
    console.error('Error reading devices:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to read device data',
      details: error.message
    });
  }
});


// Endpoint to get specific device details
app.get('/api/device/:ip', (req, res) => {
  try {
    const { ip } = req.params;
    const deviceData = devicesData[ip];

    if (!deviceData) {
      return res.status(404).json({ 
        error: "No agent data found for this IP",
        ip
      });
    }

    res.json({
      status: 'success',
      device: deviceData
    });
  } catch (error) {
    console.error('Error in /api/device/:ip:', error);
    res.status(500).json({ 
      error: "Internal server error",
      details: error.message 
    });
  }
});


app.listen(PORT,  () => {
  console.log(`\nServer running on http://10.40.35.224:${PORT}`);
  console.log(`CORS allowed for: ${corsOptions.origin.join(', ')}`);
  console.log(`Storing agent data in: ${LOG_FILE}\n`);
});