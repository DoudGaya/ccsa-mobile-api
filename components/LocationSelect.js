import { useState, useEffect } from 'react'
import hierarchicalData from '../data/hierarchical-data'

const LocationSelect = ({ 
  selectedState, 
  selectedLGA, 
  selectedWard,
  onStateChange,
  onLGAChange,
  onWardChange,
  onPollingUnitChange,
  errors = {},
  disabled = false,
  required = false
}) => {
  const [lgas, setLgas] = useState([])
  const [wards, setWards] = useState([])
  const [pollingUnits, setPollingUnits] = useState([])
  const [loading, setLoading] = useState(false)

  // Get all states from hierarchical data
  const states = hierarchicalData.map(state => ({
    value: state.state,
    label: state.state.charAt(0).toUpperCase() + state.state.slice(1).replace(/-/g, ' ')
  }))

  // Update LGAs when state changes
  useEffect(() => {
    if (selectedState) {
      setLoading(true)
      const stateData = hierarchicalData.find(state => state.state === selectedState)
      if (stateData) {
        const lgaList = stateData.lgas.map(lga => ({
          value: lga.lga,
          label: lga.lga.charAt(0).toUpperCase() + lga.lga.slice(1).replace(/-/g, ' ')
        }))
        setLgas(lgaList)
      } else {
        setLgas([])
      }
      setWards([])
      setPollingUnits([])
      setLoading(false)
    } else {
      setLgas([])
      setWards([])
      setPollingUnits([])
    }
  }, [selectedState])

  // Update wards when LGA changes
  useEffect(() => {
    if (selectedState && selectedLGA) {
      setLoading(true)
      const stateData = hierarchicalData.find(state => state.state === selectedState)
      if (stateData) {
        const lgaData = stateData.lgas.find(lga => lga.lga === selectedLGA)
        if (lgaData) {
          const wardList = lgaData.wards.map(ward => ({
            value: ward.ward,
            label: ward.ward.charAt(0).toUpperCase() + ward.ward.slice(1).replace(/-/g, ' ')
          }))
          setWards(wardList)
        } else {
          setWards([])
        }
      }
      setPollingUnits([])
      setLoading(false)
    } else {
      setWards([])
      setPollingUnits([])
    }
  }, [selectedState, selectedLGA])

  // Update polling units when ward changes
  useEffect(() => {
    if (selectedState && selectedLGA && selectedWard) {
      setLoading(true)
      const stateData = hierarchicalData.find(state => state.state === selectedState)
      if (stateData) {
        const lgaData = stateData.lgas.find(lga => lga.lga === selectedLGA)
        if (lgaData) {
          const wardData = lgaData.wards.find(ward => ward.ward === selectedWard)
          if (wardData) {
            const puList = wardData.polling_units.map(pu => ({
              value: pu,
              label: pu.charAt(0).toUpperCase() + pu.slice(1).replace(/-/g, ' ')
            }))
            setPollingUnits(puList)
          } else {
            setPollingUnits([])
          }
        }
      }
      setLoading(false)
    } else {
      setPollingUnits([])
    }
  }, [selectedState, selectedLGA, selectedWard])

  return (
    <div className="space-y-4">
      {/* State Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          State {required && <span className="text-red-500">*</span>}
        </label>
        <select
          value={selectedState || ''}
          onChange={(e) => onStateChange(e.target.value)}
          disabled={disabled}
          className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
            errors.state ? 'border-red-300' : ''
          } ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
        >
          <option value="">Select State</option>
          {states.map((state) => (
            <option key={state.value} value={state.value}>
              {state.label}
            </option>
          ))}
        </select>
        {errors.state && (
          <p className="mt-1 text-sm text-red-600">{errors.state.message}</p>
        )}
      </div>

      {/* LGA Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Local Government Area {required && <span className="text-red-500">*</span>}
        </label>
        <select
          value={selectedLGA || ''}
          onChange={(e) => onLGAChange(e.target.value)}
          disabled={disabled || !selectedState || loading}
          className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
            errors.localGovernment ? 'border-red-300' : ''
          } ${disabled || !selectedState ? 'bg-gray-100 cursor-not-allowed' : ''}`}
        >
          <option value="">
            {!selectedState 
              ? 'Select State first' 
              : loading 
              ? 'Loading...' 
              : 'Select Local Government'
            }
          </option>
          {lgas.map((lga) => (
            <option key={lga.value} value={lga.value}>
              {lga.label}
            </option>
          ))}
        </select>
        {errors.localGovernment && (
          <p className="mt-1 text-sm text-red-600">{errors.localGovernment.message}</p>
        )}
      </div>

      {/* Ward Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Ward {required && <span className="text-red-500">*</span>}
        </label>
        <select
          value={selectedWard || ''}
          onChange={(e) => onWardChange(e.target.value)}
          disabled={disabled || !selectedLGA || loading}
          className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
            errors.ward ? 'border-red-300' : ''
          } ${disabled || !selectedLGA ? 'bg-gray-100 cursor-not-allowed' : ''}`}
        >
          <option value="">
            {!selectedLGA 
              ? 'Select LGA first' 
              : loading 
              ? 'Loading...' 
              : 'Select Ward'
            }
          </option>
          {wards.map((ward) => (
            <option key={ward.value} value={ward.value}>
              {ward.label}
            </option>
          ))}
        </select>
        {errors.ward && (
          <p className="mt-1 text-sm text-red-600">{errors.ward.message}</p>
        )}
      </div>

      {/* Polling Unit Selection (Optional) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Polling Unit 
        </label>
        <select
          onChange={(e) => onPollingUnitChange && onPollingUnitChange(e.target.value)}
          disabled={disabled || !selectedWard || loading}
          className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
            errors.pollingUnit ? 'border-red-300' : ''
          } ${disabled || !selectedWard ? 'bg-gray-100 cursor-not-allowed' : ''}`}
        >
          <option value="">
            {!selectedWard 
              ? 'Select Ward first' 
              : loading 
              ? 'Loading...' 
              : 'Select Polling Unit (Optional)'
            }
          </option>
          {pollingUnits.map((pu) => (
            <option key={pu.value} value={pu.value}>
              {pu.label}
            </option>
          ))}
        </select>
        {errors.pollingUnit && (
          <p className="mt-1 text-sm text-red-600">{errors.pollingUnit.message}</p>
        )}
      </div>

      {loading && (
        <div className="flex items-center justify-center py-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-sm text-gray-600">Loading locations...</span>
        </div>
      )}
    </div>
  )
}

export default LocationSelect
