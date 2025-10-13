import { API_CONFIG } from '../config/api.config'

/**
 * Convert date from YYYY-MM-DD to YYYYMMDD format
 */
const formatDateForAPI = (date: string): string => {
  return date.replace(/-/g, '')
}

/**
 * Fetch water level data for a station
 * @param stationId - Station ID (e.g., "8639208")
 * @param beginDate - Start date in YYYY-MM-DD format
 * @param endDate - End date in YYYY-MM-DD format
 */
export const fetchStationWaterLevel = async (
  stationId: string,
  beginDate: string,
  endDate: string
) => {
  try {
    const formattedBeginDate = formatDateForAPI(beginDate)
    const formattedEndDate = formatDateForAPI(endDate)

    const url = `${API_CONFIG.baseURL}/noaa/water-level/download-all?begin_date=${formattedBeginDate}&end_date=${formattedEndDate}`
    console.log(stationId);
    console.log(url);
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([stationId.toString()]),
    })



    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error:::', error)
    throw error
  }
}
