'use client';

import React from 'react';
import { WarehouseState } from '../types/types';

interface ControlPanelProps {
  warehouseState: WarehouseState;
  statusMessage: string;
  statusType: 'info' | 'success' | 'error';
  statusLog: { message: string; type: 'info' | 'success' | 'error' }[];
  obstacleTypes: { value: string; label: string }[];
  predefinedEnvironments: string[];
  selectedPreset: string;
  onInitializeWarehouse: () => void;
  onSetStart: () => void;
  onSetEnd: () => void;
  onToggleObstacle: () => void;
  onPlaceMultiGrid: () => void;
  onFindPath: () => void;
  onClearSimulation: () => void;
  onWidthChange: (width: number) => void;
  onHeightChange: (height: number) => void;
  onObstacleTypeChange: (type: string) => void;
  onLoadPreset: (presetName: string) => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  warehouseState,
  statusMessage,
  statusType,
  statusLog,
  obstacleTypes,
  predefinedEnvironments,
  selectedPreset,
  onInitializeWarehouse,
  onSetStart,
  onSetEnd,
  onToggleObstacle,
  onPlaceMultiGrid,
  onFindPath,
  onClearSimulation,
  onWidthChange,
  onHeightChange,
  onObstacleTypeChange,
  onLoadPreset
}) => {
  const { warehouseWidth, warehouseHeight, currentMode } = warehouseState;
  const isPresetLoaded = !!selectedPreset;

  // Helper function to get mode description
  const getModeDescription = () => {
    let modeDescription = "Standby";
    
    // Safe check for client-side rendering before accessing document
    // This avoids the "document is not defined" error during server-side rendering
    let selectedObstacleLabel = 'Obstacle';
    
    // Only access DOM on client side
    const isBrowser = typeof window !== 'undefined';
    
    if (isBrowser) {
      // Find the selected obstacle type from provided prop array
      // This approach avoids direct DOM querying when possible 
      const selectElement = document.getElementById('obstacle-type') as HTMLSelectElement;
      
      if (selectElement?.value) {
        const selectedType = obstacleTypes.find(
          type => type.value === selectElement.value
        );
        if (selectedType) {
          selectedObstacleLabel = selectedType.label;
        }
      }
    }
    
    switch (currentMode) {
      case 'set_start':
        modeDescription = "Set Robot Start Point (Click on Grid)";
        break;
      case 'set_end':
        modeDescription = "Set Destination Point (Click on Grid)";
        break;
      case 'toggle_obstacle':
        modeDescription = `Place/Remove ${selectedObstacleLabel} (Click on Grid)`;
        break;
      case 'place_multi_grid':
        modeDescription = `Place Multi-Grid ${selectedObstacleLabel} (Click on Grid)`;
        break;
      default:
        modeDescription = "Standby";
    }
    
    return modeDescription;
  };

  return (
    <div className="flex-1 min-w-[300px] max-w-[400px] bg-white p-5 overflow-y-auto shadow-md flex flex-col gap-5">
      <header className="text-center pb-4 border-b border-gray-200 mb-4">
        <h1 className="text-2xl font-bold text-blue-700">Simulation Controls</h1>
        <p className="mt-1 text-gray-500">Warehouse Task Orchestrator</p>
      </header>

      <div className="bg-gray-50 rounded-lg p-4 mb-4 shadow-sm">
        <h2 className="text-lg font-semibold mb-3 pb-2 border-b-2 border-blue-100 text-blue-700">Load Preset Environment</h2>
        <select 
          id="preset-select"
          className="w-full p-2 border border-gray-300 rounded mb-2"
          value={selectedPreset}
          onChange={(e) => onLoadPreset(e.target.value)}
          disabled={isPresetLoaded}
        >
          <option value="" disabled={!!selectedPreset}>
            {isPresetLoaded ? `Preset Loaded: ${selectedPreset}` : "Select a Preset..."}
          </option>
          {predefinedEnvironments.map(name => (
            <option key={name} value={name} disabled={isPresetLoaded && selectedPreset !== name}>
              {name}
            </option>
          ))}
        </select>
        {isPresetLoaded && (
          <p className="text-sm text-gray-500 mt-1">(Clear simulation to load a different preset or customize)</p>
        )}
      </div>

      <div className={`bg-gray-50 rounded-lg p-4 mb-4 shadow-sm ${isPresetLoaded ? 'opacity-50 cursor-not-allowed' : ''}`}>
        <h2 className="text-lg font-semibold mb-3 pb-2 border-b-2 border-blue-100 text-blue-700">Warehouse Setup</h2>
        <div className="flex flex-wrap items-center mb-2">
          <label htmlFor="warehouse-width" className="mr-2">Grid Width:</label>
          <input 
            type="number" 
            id="warehouse-width" 
            className="w-16 p-2 border border-gray-300 rounded mr-4"
            value={warehouseWidth || 20} 
            min={5} 
            max={50}
            onChange={(e) => onWidthChange(parseInt(e.target.value))}
            disabled={isPresetLoaded}
          />
          
          <label htmlFor="warehouse-height" className="mr-2">Grid Height:</label>
          <input 
            type="number" 
            id="warehouse-height" 
            className="w-16 p-2 border border-gray-300 rounded"
            value={warehouseHeight || 15} 
            min={5} 
            max={50}
            onChange={(e) => onHeightChange(parseInt(e.target.value))}
            disabled={isPresetLoaded}
          />
        </div>
        <button 
          id="init-warehouse-btn" 
          className={`w-full mt-2 text-white rounded py-2 px-4 transition-colors ${isPresetLoaded ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-700 hover:bg-blue-800'}`}
          onClick={onInitializeWarehouse}
          disabled={isPresetLoaded}
        >
          Initialize Warehouse
        </button>
      </div>

      <div className={`bg-gray-50 rounded-lg p-4 mb-4 shadow-sm ${isPresetLoaded ? 'opacity-50 cursor-not-allowed' : ''}`}>
        <h2 className="text-lg font-semibold mb-3 pb-2 border-b-2 border-blue-100 text-blue-700">Navigation Points</h2>
        <div className="grid grid-cols-2 gap-2">
          <button 
            id="set-start-btn" 
            className={`text-white rounded py-2 px-4 transition-colors ${isPresetLoaded ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}
            onClick={onSetStart}
            disabled={isPresetLoaded}
          >
            Set Robot Start
          </button>
          <button 
            id="set-end-btn" 
            className={`text-white rounded py-2 px-4 transition-colors ${isPresetLoaded ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'}`}
            onClick={onSetEnd}
            disabled={isPresetLoaded}
          >
            Set Destination
          </button>
        </div>
      </div>

      <div className={`bg-gray-50 rounded-lg p-4 mb-4 shadow-sm ${isPresetLoaded ? 'opacity-50 cursor-not-allowed' : ''}`}>
        <h2 className="text-lg font-semibold mb-3 pb-2 border-b-2 border-blue-100 text-blue-700">Obstacle Management</h2>
        <div className="mb-3">
          <label htmlFor="obstacle-type" className="block mb-2">Obstacle Type:</label>
          <select 
            id="obstacle-type" 
            className="w-full p-2 border border-gray-300 rounded mb-2"
            onChange={(e) => onObstacleTypeChange(e.target.value)}
            disabled={isPresetLoaded}
          >
            {obstacleTypes.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-1 gap-2">
          <button 
            id="toggle-obstacle-btn" 
            className={`text-white rounded py-2 px-4 transition-colors ${isPresetLoaded ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'}`}
            onClick={onToggleObstacle}
            disabled={isPresetLoaded}
          >
            Place/Remove Obstacle
          </button>
          <button 
            id="multi-grid-obstacle-btn" 
            className={`text-white rounded py-2 px-4 font-bold border-2 border-dashed transition-colors ${isPresetLoaded ? 'bg-gray-400 border-gray-500 cursor-not-allowed' : 'bg-orange-500 hover:bg-orange-600 border-orange-800'}`}
            onClick={onPlaceMultiGrid}
            disabled={isPresetLoaded}
          >
            Place Larger Obstacle
          </button>
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-4 mb-4 shadow-sm">
        <h2 className="text-lg font-semibold mb-3 pb-2 border-b-2 border-blue-100 text-blue-700">Pathfinding</h2>
        <div className="grid grid-cols-1 gap-3">
          <button 
            id="find-path-btn" 
            className="bg-blue-700 text-white rounded py-3 px-4 hover:bg-blue-800 transition-colors font-bold"
            onClick={onFindPath}
          >
            Calculate Path
          </button>
          <button 
            id="clear-simulation-btn" 
            className="bg-gray-500 text-white rounded py-2 px-4 hover:bg-gray-600 transition-colors"
            onClick={onClearSimulation}
          >
            Reset Simulation
          </button>
        </div>
      </div>

      <div className="mt-auto bg-gray-800 text-gray-100 rounded-lg p-4 shadow-md">
        <h2 className="text-lg font-semibold mb-2 pb-1 border-b border-gray-600">System Log</h2>
        <div 
          id="current-mode-text" 
          className="bg-blue-100 text-blue-700 p-2 rounded mb-3 font-bold text-center"
        >
          Current Mode: {getModeDescription()}
        </div>
        <div 
          id="status-message-log" 
          className="flex flex-col-reverse h-32 overflow-y-auto p-2 bg-gray-900 rounded"
        >
          {statusLog.length === 0 ? (
            <p className="text-gray-400">&gt; System awaiting initialization...</p>
          ) : (
            statusLog.map((log, index) => {
              let color = 'text-blue-400'; // info
              let prefix = '[INFO] ';
              
              if (log.type === 'success') {
                color = 'text-green-400';
                prefix = '[OK] ';
              } else if (log.type === 'error') {
                color = 'text-red-400';
                prefix = '[FAIL] ';
              }
              
              return (
                <p key={index} className={`${color} my-1 py-1 px-2 rounded text-sm animate-fadeIn`}>
                  {prefix}{log.message}
                </p>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default ControlPanel;
