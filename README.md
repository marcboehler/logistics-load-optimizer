# Logistics Load Optimizer - 3D Edition

Eine 3D-Visualisierungsanwendung zur Optimierung der Palettenbeladung.

## Features

- 3D-Visualisierung von Europaletten (1200x800x144mm)
- Interaktive Paket-Platzierung mit konfigurierbaren Maßen
- OrbitControls zum Drehen, Zoomen und Verschieben der Ansicht
- Eingabemaske für Karton-Maße (Länge, Breite, Höhe, Gewicht)

## Tech Stack

- **React** (Vite) - Frontend Framework
- **Tailwind CSS** - Styling
- **Three.js** - 3D-Rendering
- **@react-three/fiber** - React Renderer für Three.js
- **@react-three/drei** - Nützliche Helfer für react-three-fiber

## Installation

```bash
npm install
```

## Entwicklung

```bash
npm run dev
```

## Build

```bash
npm run build
```

## Steuerung

- **Linke Maustaste**: Drehen
- **Rechte Maustaste**: Verschieben
- **Mausrad**: Zoomen
