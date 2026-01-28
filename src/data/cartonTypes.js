// 40 Packaging Types (Cartons) - PK-001 to PK-040
// Max Height: 40cm, Max Width/Length: 60cm

export const cartonTypes = [
  { id: 'PK-001', length: 150, width: 100, height: 80 },
  { id: 'PK-002', length: 200, width: 150, height: 100 },
  { id: 'PK-003', length: 250, width: 150, height: 120 },
  { id: 'PK-004', length: 200, width: 200, height: 100 },
  { id: 'PK-005', length: 300, width: 200, height: 150 },
  { id: 'PK-006', length: 250, width: 200, height: 150 },
  { id: 'PK-007', length: 300, width: 250, height: 150 },
  { id: 'PK-008', length: 350, width: 250, height: 180 },
  { id: 'PK-009', length: 300, width: 300, height: 150 },
  { id: 'PK-010', length: 350, width: 300, height: 200 },
  { id: 'PK-011', length: 400, width: 250, height: 200 },
  { id: 'PK-012', length: 400, width: 300, height: 200 },
  { id: 'PK-013', length: 400, width: 300, height: 250 },
  { id: 'PK-014', length: 450, width: 300, height: 200 },
  { id: 'PK-015', length: 400, width: 350, height: 250 },
  { id: 'PK-016', length: 450, width: 350, height: 250 },
  { id: 'PK-017', length: 500, width: 300, height: 250 },
  { id: 'PK-018', length: 450, width: 400, height: 250 },
  { id: 'PK-019', length: 500, width: 350, height: 300 },
  { id: 'PK-020', length: 500, width: 400, height: 300 },
  { id: 'PK-021', length: 550, width: 350, height: 300 },
  { id: 'PK-022', length: 500, width: 450, height: 300 },
  { id: 'PK-023', length: 550, width: 400, height: 300 },
  { id: 'PK-024', length: 550, width: 450, height: 350 },
  { id: 'PK-025', length: 600, width: 400, height: 300 },
  { id: 'PK-026', length: 600, width: 400, height: 350 },
  { id: 'PK-027', length: 550, width: 500, height: 350 },
  { id: 'PK-028', length: 600, width: 450, height: 350 },
  { id: 'PK-029', length: 600, width: 500, height: 350 },
  { id: 'PK-030', length: 600, width: 450, height: 400 },
  { id: 'PK-031', length: 600, width: 500, height: 400 },
  { id: 'PK-032', length: 600, width: 550, height: 350 },
  { id: 'PK-033', length: 600, width: 550, height: 400 },
  { id: 'PK-034', length: 600, width: 600, height: 350 },
  { id: 'PK-035', length: 600, width: 600, height: 400 },
  { id: 'PK-036', length: 180, width: 120, height: 100 },
  { id: 'PK-037', length: 220, width: 180, height: 120 },
  { id: 'PK-038', length: 280, width: 220, height: 160 },
  { id: 'PK-039', length: 320, width: 280, height: 180 },
  { id: 'PK-040', length: 380, width: 320, height: 220 },
]

// Helper to get carton by ID
export const getCartonById = (id) => cartonTypes.find(c => c.id === id)

// Calculate carton volume in cm³
export const getCartonVolume = (carton) => {
  return (carton.length / 10) * (carton.width / 10) * (carton.height / 10)
}
