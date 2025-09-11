import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, Waves, Anchor, Wind, Thermometer, MapPin, Activity } from 'lucide-react';

// Type definitions
interface StationFeature {
  type: 'Feature';
  geometry: {
    type: 'Point';
    coordinates: [number, number];
  };
  properties: {
    id: string;
    name: string;
    status: 'active' | 'inactive';
    type?: string;
  };
}

interface StationsData {
  type: 'FeatureCollection';
  features: StationFeature[];
}

interface FilterState {
  [key: string]: boolean;
}

interface StationCounts {
  [key: string]: number;
}

interface CategoryFilter {
  id: string;
  label: string;
  count?: number;
}

interface Category {
  id: string;
  title: string;
  icon: React.ReactNode;
  color: string;
  description: string;
  filters: CategoryFilter[];
}

interface CategoryHeaderProps {
  category: Category;
  isExpanded: boolean;
  onToggle: () => void;
}

interface FilterOptionProps {
  categoryId: string;
  filter: CategoryFilter;
  isSelected: boolean;
  onToggle: () => void;
  isFirst: boolean;
}

interface TideMonitoringSiteCategoriesProps {
  onFiltersChange?: (filters: FilterState) => void;
  stationsData?: StationsData;
}

const TideMonitoringSiteCategories: React.FC<TideMonitoringSiteCategoriesProps> = ({ 
  onFiltersChange, 
  stationsData 
}) => {
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    'tide-stations': true,
    'water-level': false,
    'meteorological': false,
    'current-stations': false,
    'other-monitoring': false
  });

  const [selectedFilters, setSelectedFilters] = useState<FilterState>({
    'tide-stations-any': true,
    'tide-stations-verified': false,
    'tide-stations-preliminary': false,
    'tide-stations-harmonic': false,
    'tide-stations-subordinate': false,
    'water-level-any': true,
    'meteorological-any': true,
    'current-stations-any': true,
    'other-monitoring-any': true
  });

  const [stationCounts, setStationCounts] = useState<StationCounts>({});

  // Calculate station counts based on filters
  useEffect(() => {
    if (stationsData?.features) {
      const counts: StationCounts = {};
      const features = stationsData.features;
      
      // Mock counting logic - in real app, this would analyze actual station data
      counts['tide-stations-active'] = features.filter(f => f.properties.status === 'active').length;
      counts['tide-stations-inactive'] = features.filter(f => f.properties.status !== 'active').length;
      counts['water-level-active'] = Math.floor(features.length * 0.7);
      counts['meteorological-active'] = Math.floor(features.length * 0.4);
      counts['current-stations-active'] = Math.floor(features.length * 0.3);
      counts['other-monitoring-active'] = Math.floor(features.length * 0.2);
      
      setStationCounts(counts);
    }
  }, [stationsData]);

  const toggleCategory = (categoryId: string): void => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  const toggleFilter = (filterId: string): void => {
    const newFilters = { ...selectedFilters };
    
    // Handle "Any data" selections
    if (filterId.endsWith('-any')) {
      const category = filterId.replace('-any', '');
      // When selecting "Any data", unselect other options in the same category
      Object.keys(newFilters).forEach(key => {
        if (key.startsWith(category) && key !== filterId) {
          newFilters[key] = false;
        }
      });
      newFilters[filterId] = true;
    } else {
      // When selecting specific option, unselect "Any data"
      const category = filterId.split('-').slice(0, -1).join('-');
      newFilters[`${category}-any`] = false;
      newFilters[filterId] = !newFilters[filterId];
    }
    
    setSelectedFilters(newFilters);
    
    // Notify parent component of filter changes
    if (onFiltersChange) {
      onFiltersChange(newFilters);
    }
  };

  const categories: Category[] = [
    {
      id: 'tide-stations',
      title: 'Tide Stations',
      icon: <Waves className="w-4 h-4 text-blue-500" />,
      color: 'blue',
      description: 'Water level measurement stations',
      filters: [
        { id: 'any', label: 'Any data', count: stationCounts['tide-stations-active'] },
        { id: 'verified', label: 'Verified data' },
        { id: 'preliminary', label: 'Preliminary data' },
        { id: 'harmonic', label: 'Harmonic predictions' },
        { id: 'subordinate', label: 'Subordinate stations' },
        { id: 'historical', label: 'Historical data' }
      ]
    },
    {
      id: 'water-level',
      title: 'Water Level Sites',
      icon: <Activity className="w-4 h-4 text-cyan-500" />,
      color: 'cyan',
      description: 'Continuous water level monitoring',
      filters: [
        { id: 'any', label: 'Any data', count: stationCounts['water-level-active'] },
        { id: 'real-time', label: 'Real-time data' },
        { id: 'daily-means', label: 'Daily means' },
        { id: 'monthly-means', label: 'Monthly means' },
        { id: 'annual-extremes', label: 'Annual extremes' }
      ]
    },
    {
      id: 'meteorological',
      title: 'Meteorological Sites',
      icon: <Wind className="w-4 h-4 text-green-500" />,
      color: 'green',
      description: 'Weather and atmospheric data',
      filters: [
        { id: 'any', label: 'Any data', count: stationCounts['meteorological-active'] },
        { id: 'wind', label: 'Wind data' },
        { id: 'pressure', label: 'Barometric pressure' },
        { id: 'temperature', label: 'Air temperature' },
        { id: 'humidity', label: 'Humidity data' }
      ]
    },
    {
      id: 'current-stations',
      title: 'Current Stations',
      icon: <Anchor className="w-4 h-4 text-purple-500" />,
      color: 'purple',
      description: 'Water current measurements',
      filters: [
        { id: 'any', label: 'Any data', count: stationCounts['current-stations-active'] },
        { id: 'speed', label: 'Current speed' },
        { id: 'direction', label: 'Current direction' },
        { id: 'predictions', label: 'Current predictions' }
      ]
    },
    {
      id: 'other-monitoring',
      title: 'Other Monitoring',
      icon: <MapPin className="w-4 h-4 text-orange-500" />,
      color: 'orange',
      description: 'Additional monitoring stations',
      filters: [
        { id: 'any', label: 'Any data', count: stationCounts['other-monitoring-active'] },
        { id: 'water-quality', label: 'Water quality' },
        { id: 'salinity', label: 'Salinity data' },
        { id: 'temperature', label: 'Water temperature' }
      ]
    }
  ];

  const CategoryHeader: React.FC<CategoryHeaderProps> = ({ category, isExpanded, onToggle }) => (
    <div 
      className={`flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50 border-l-4 border-${category.color}-500 transition-colors`}
      onClick={onToggle}
    >
      <div className="flex items-center space-x-3">
        {category.icon}
        <div>
          <span className="font-medium text-gray-800 text-sm">{category.title}</span>
          <div className="text-xs text-gray-500">{category.description}</div>
        </div>
      </div>
      {isExpanded ? (
        <ChevronDown className="w-4 h-4 text-gray-400" />
      ) : (
        <ChevronRight className="w-4 h-4 text-gray-400" />
      )}
    </div>
  );

  const FilterOption: React.FC<FilterOptionProps> = ({ categoryId, filter, isSelected, onToggle, isFirst }) => (
    <div className="flex items-center justify-between py-1.5 px-4 hover:bg-blue-25 transition-colors">
      <div className="flex items-center space-x-2">
        <input
          type="radio"
          name={`${categoryId}-filter`}
          checked={isSelected}
          onChange={onToggle}
          className={`w-3 h-3 ${isFirst ? 'text-blue-600' : 'text-gray-400'} focus:ring-blue-500 focus:ring-1`}
        />
        <label className="text-xs text-gray-700 cursor-pointer select-none">
          {filter.label}
        </label>
      </div>
      {filter.count !== undefined && (
        <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
          {filter.count}
        </span>
      )}
    </div>
  );

  const activeFilterCount = Object.values(selectedFilters).filter(Boolean).length;

  const handleReset = (): void => {
    const resetFilters = Object.keys(selectedFilters).reduce<FilterState>((acc, key) => {
      acc[key] = key.endsWith('-any');
      return acc;
    }, {});
    setSelectedFilters(resetFilters);
    if (onFiltersChange) onFiltersChange(resetFilters);
  };

  return (
    <div className="w-80 bg-white border border-gray-200 rounded-lg shadow-lg">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border-b border-gray-200 p-4">
        <div className="flex items-center space-x-2">
          <Waves className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-gray-800">Site Categories</h3>
        </div>
        <p className="text-xs text-gray-600 mt-1">Filter tide monitoring stations</p>
      </div>

      {/* Categories */}
      <div className="max-h-96 overflow-y-auto">
        {categories.map((category) => {
          const isExpanded = expandedCategories[category.id];
          
          return (
            <div key={category.id} className="border-b border-gray-100 last:border-b-0">
              <CategoryHeader
                category={category}
                isExpanded={isExpanded}
                onToggle={() => toggleCategory(category.id)}
              />
              
              {isExpanded && (
                <div className="bg-gray-25">
                  <div className="py-2">
                    {/* Active Sites Section */}
                    <div className="px-4 py-1">
                      <div className="flex items-center space-x-1 mb-2">
                        <ChevronDown className="w-3 h-3 text-gray-500" />
                        <span className="text-xs font-medium text-gray-700">Active Sites</span>
                        <span className="text-xs text-gray-500 bg-green-100 px-1.5 py-0.5 rounded">
                          {stationCounts[`${category.id}-active`] || 0}
                        </span>
                      </div>
                      
                      <div className="ml-4 space-y-1">
                        {category.filters.map((filter, index) => (
                          <FilterOption
                            key={filter.id}
                            categoryId={category.id}
                            filter={filter}
                            isSelected={selectedFilters[`${category.id}-${filter.id}`]}
                            onToggle={() => toggleFilter(`${category.id}-${filter.id}`)}
                            isFirst={index === 0}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Inactive Sites Section */}
                    <div className="px-4 py-1 mt-3">
                      <div className="flex items-center space-x-1 mb-1">
                        <ChevronRight className="w-3 h-3 text-gray-400" />
                        <span className="text-xs font-medium text-gray-500">Inactive Sites</span>
                        <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                          {stationCounts[`${category.id}-inactive`] || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="bg-gray-50 border-t border-gray-200 p-3">
        <div className="flex space-x-2 mb-2">
          <button className="flex-1 bg-blue-500 text-white text-xs py-2 px-3 rounded hover:bg-blue-600 transition-colors">
            Apply Filters
          </button>
          <button 
            className="text-xs py-2 px-3 text-gray-600 hover:text-gray-800 transition-colors border border-gray-300 rounded"
            onClick={handleReset}
          >
            Reset
          </button>
        </div>
        
        {/* Active filters summary */}
        <div className="text-xs text-blue-700 bg-blue-50 p-2 rounded">
          <span className="font-medium">Active filters: </span>
          <span className="bg-blue-100 px-1.5 py-0.5 rounded ml-1">
            {activeFilterCount}
          </span>
        </div>
      </div>
    </div>
  );
};

export default TideMonitoringSiteCategories;