'use client';

import React from 'react';
import { WarehouseState } from '../types/types';

interface ControlPanelProps {
  warehouseState: WarehouseState;
  statusMessage: string;
  statusType: 'info' | 'success' | 'error';
  statusLog: { message: string; type: 'info' | 'success' | 'error' }[];
  obstacleTypes: { value: string; label: string }[];
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
  onLoadPreset: (presetKey: string) => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  warehouseState,
  statusMessage,
  statusType,
  statusLog,
  obstacleTypes,
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

  // Helper function to get mode description
  const getModeDescription = () => {
    let modeDescription = "Standby";
    const selectedObstacleType = obstacleTypes.find(
      type => type.value === (document.getElementById('obstacle-type') as HTMLSelectElement)?.value
    )?.label || 'Obstacle';
    
    switch (currentMode) {
      case 'set_start':
        modeDescription = "Set Robot Start Point (Click on Grid)";
        break;
      case 'set_end':
        modeDescription = "Set Destination Point (Click on Grid)";
        break;
      case 'toggle_obstacle':
        modeDescription = `Place/Remove ${selectedObstacleType} (Click on Grid)`;
        break;
      case 'place_multi_grid':
        modeDescription = `Place Multi-Grid ${selectedObstacleType} (Click on Grid)`;
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
          />
        </div>
        <button 
          id="init-warehouse-btn" 
          className="w-full mt-2 bg-blue-700 text-white rounded py-2 px-4 hover:bg-blue-800 transition-colors"
          onClick={onInitializeWarehouse}
        >
          Initialize Warehouse
        </button>
      </div>

      <div className="bg-gray-50 rounded-lg p-4 mb-4 shadow-sm">
        <h2 className="text-lg font-semibold mb-3 pb-2 border-b-2 border-blue-100 text-blue-700">Preset Environments</h2>
        <p className="text-gray-600 text-sm mb-3">Choose a pre-defined environment:</p>
        <div className="grid grid-cols-1 gap-2">
          <button 
            className="bg-purple-600 text-white rounded py-2 px-4 hover:bg-purple-700 transition-colors"
            onClick={() => onLoadPreset('amazon')}
          >
            Amazon Fulfillment Center
          </button>
          <button 
            className="bg-green-600 text-white rounded py-2 px-4 hover:bg-green-700 transition-colors"
            onClick={() => onLoadPreset('nvidia')}
          >
            NVIDIA GPU Factory
          </button>
          <button 
            className="bg-red-600 text-white rounded py-2 px-4 hover:bg-red-700 transition-colors"
            onClick={() => onLoadPreset('tesla')}
          >
            Tesla Gigafactory
          </button>
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-4 mb-4 shadow-sm">
        <h2 className="text-lg font-semibold mb-3 pb-2 border-b-2 border-blue-100 text-blue-700">Navigation Points</h2>
        <div className="grid grid-cols-2 gap-2">
          <button 
            id="set-start-btn" 
            className="bg-green-600 text-white rounded py-2 px-4 hover:bg-green-700 transition-colors"
            onClick={onSetStart}
          >
            Set Robot Start
          </button>
          <button 
            id="set-end-btn" 
            className="bg-red-600 text-white rounded py-2 px-4 hover:bg-red-700 transition-colors"
            onClick={onSetEnd}
          >
            Set Destination
          </button>
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-4 mb-4 shadow-sm">
        <h2 className="text-lg font-semibold mb-3 pb-2 border-b-2 border-blue-100 text-blue-700">Obstacle Management</h2>
        <div className="mb-3">
          <label htmlFor="obstacle-type" className="block mb-2">Obstacle Type:</label>
          <select 
            id="obstacle-type" 
            className="w-full p-2 border border-gray-300 rounded mb-2"
            onChange={(e) => onObstacleTypeChange(e.target.value)}
          >
            {obstacleTypes.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-1 gap-2">
          <button 
            id="toggle-obstacle-btn" 
            className="bg-blue-500 text-white rounded py-2 px-4 hover:bg-blue-600 transition-colors"
            onClick={onToggleObstacle}
          >
            Place/Remove Obstacle
          </button>
          <button 
            id="multi-grid-obstacle-btn" 
            className="bg-orange-500 text-white rounded py-2 px-4 hover:bg-orange-600 transition-colors font-bold border-2 border-dashed border-orange-800"
            onClick={onPlaceMultiGrid}
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
