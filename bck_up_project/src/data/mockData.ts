// Mock data for the TAMS system
export const mockFlights = [
  {
    id: "VN1530",
    callSign: "HVN1530",
    aircraft: "A321",
    origin: "SGN",
    destination: "PQC",
    status: "On Approach",
    std: "14:30",
    etd: "14:35",
    gate: "A2",
    runway: "09",
    pax: 180,
    cargo: "12.5T",
  },
  {
    id: "QH1425",
    callSign: "BBV1425", 
    aircraft: "A320",
    origin: "HAN",
    destination: "PQC",
    status: "Boarding",
    std: "15:15",
    etd: "15:15",
    gate: "B4",
    runway: "27",
    pax: 156,
    cargo: "8.2T",
  },
  {
    id: "VJ625",
    callSign: "VJC625",
    aircraft: "A321",
    origin: "PQC",
    destination: "SGN", 
    status: "Departed",
    std: "13:45",
    etd: "13:47",
    gate: "A1",
    runway: "09",
    pax: 189,
    cargo: "14.1T",
  },
];

export const mockKPIs = {
  onTimePerformance: { value: 87.3, target: 85, trend: "up" },
  avgTaxiOutTime: { value: 12.4, target: 15, trend: "stable" },
  checkpointWait: { value: 8.7, target: 12, trend: "down" },
  energyIntensity: { value: 142.8, target: 150, trend: "down" },
};

export const mockSystemHealth = [
  { system: "Flight Information Display", status: "operational", uptime: 99.8 },
  { system: "Baggage Handling System", status: "operational", uptime: 98.2 },
  { system: "Security Systems", status: "operational", uptime: 99.5 },
  { system: "Passenger Boarding Bridges", status: "maintenance", uptime: 96.7 },
  { system: "Ground Support Equipment", status: "operational", uptime: 97.9 },
  { system: "Communication Systems", status: "operational", uptime: 99.2 },
];

export const mockWeather = {
  temperature: 28,
  humidity: 76,
  windSpeed: 12,
  windDirection: 120,
  visibility: 10,
  conditions: "Partly Cloudy",
};

export const mockAircraft = [
  { id: "VN-A321-001", type: "A321", location: "Gate A2", status: "boarding" },
  { id: "VN-A320-045", type: "A320", location: "Runway 09", status: "takeoff" },
  { id: "QH-A320-112", type: "A320", location: "Gate B4", status: "maintenance" },
  { id: "VJ-A321-203", type: "A321", location: "Taxiway C", status: "taxi" },
];

export const mockRecommendations = [
  {
    id: "rec-001",
    type: "bottleneck",
    priority: "high",
    title: "Immigration Queue Surge Predicted",
    description: "AI model predicts 35% increase in queue length at Immigration Checkpoint A in next 15 minutes based on incoming flight patterns.",
    confidence: 87,
    timeToImpact: "12 minutes",
    suggestedActions: [
      "Open additional immigration lanes",
      "Activate e-gate priority processing", 
      "Deploy queue management staff"
    ],
    affectedSystems: ["Immigration Control", "Passenger Flow"],
    estimatedPassengers: 245
  },
  {
    id: "rec-002", 
    type: "optimization",
    priority: "medium",
    title: "Baggage Belt Optimization Opportunity",
    description: "Belt 3 showing 23% underutilization while Belt 1 at 94% capacity. Rebalancing could improve passenger wait times by 18%.",
    confidence: 92,
    timeToImpact: "8 minutes",
    suggestedActions: [
      "Redirect VN1530 baggage to Belt 3",
      "Update FIDS display information",
      "Notify ground handling team"
    ],
    affectedSystems: ["Baggage Handling", "FIDS"],
    estimatedSavings: "4.2 min avg wait time"
  },
  {
    id: "rec-003",
    type: "maintenance", 
    priority: "low",
    title: "Jetbridge B4 Preventive Maintenance Due",
    description: "Hydraulic system showing minor fluctuations. Scheduling maintenance during off-peak hours recommended.",
    confidence: 76,
    timeToImpact: "2 hours", 
    suggestedActions: [
      "Schedule maintenance for 23:00-05:00",
      "Prepare backup jetbridge",
      "Notify airlines using Gate B4"
    ],
    affectedSystems: ["Jetbridge B4", "Gate Operations"],
    estimatedDowntime: "3 hours"
  }
];