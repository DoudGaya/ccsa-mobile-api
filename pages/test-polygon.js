import React from 'react';
import PolygonMap from '../components/PolygonMap';

const PolygonTestPage = () => {
  // Sample polygon data in different formats for testing
  const testPolygons = [
    {
      name: "GeoJSON Polygon",
      data: {
        "type": "Polygon",
        "coordinates": [[
          [7.491302, 9.057001],
          [7.491502, 9.057201], 
          [7.491702, 9.056801],
          [7.491402, 9.056601],
          [7.491302, 9.057001]
        ]]
      }
    },
    {
      name: "Simple Coordinate Array",
      data: [
        [7.491302, 9.057001],
        [7.491502, 9.057201], 
        [7.491702, 9.056801],
        [7.491402, 9.056601],
        [7.491302, 9.057001]
      ]
    },
    {
      name: "GeoJSON Feature",
      data: {
        "type": "Feature",
        "geometry": {
          "type": "Polygon",
          "coordinates": [[
            [7.491302, 9.057001],
            [7.491502, 9.057201], 
            [7.491702, 9.056801],
            [7.491402, 9.056601],
            [7.491302, 9.057001]
          ]]
        },
        "properties": {}
      }
    },
    {
      name: "Flat Coordinate Array",
      data: [7.491302, 9.057001, 7.491502, 9.057201, 7.491702, 9.056801, 7.491402, 9.056601, 7.491302, 9.057001]
    }
  ];

  return (
    <div className="container mx-auto p-8 space-y-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Polygon Visualization Test</h1>
      
      {testPolygons.map((test, index) => (
        <div key={index} className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">{test.name}</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-600 mb-2">Data:</h3>
              <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-40">
                {JSON.stringify(test.data, null, 2)}
              </pre>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-600 mb-2">Visualization:</h3>
              <PolygonMap 
                polygonData={test.data}
                width={400}
                height={250}
                showCoordinates={true}
                title={`${test.name} Visualization`}
              />
            </div>
          </div>
        </div>
      ))}
      
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-yellow-800 mb-4">Test Instructions</h2>
        <ul className="text-yellow-700 space-y-2">
          <li>• Each polygon above should render as a green polygon with numbered vertices</li>
          <li>• The debug information should show the extracted coordinates and bounds</li>
          <li>• If you see "No polygon data available", the extraction logic needs adjustment</li>
          <li>• Check the browser console for additional debugging information</li>
        </ul>
      </div>
    </div>
  );
};

export default PolygonTestPage;
