import { API_CONFIG } from '../config/api.config'

interface NotificationPayload {
  send_email: boolean
  send_push: boolean
  send_wse: boolean
  subject: string
}

/**
 * Send notification to all users
 */
export const sendNotification = async () => {
  try {
    const url = `${API_CONFIG.baseURL}/users/notify`

    const payload: NotificationPayload = {
      send_email: true,
      send_push: true,
      send_wse: true,
      subject: 'Water Surface Elevation Update'
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      throw new Error(`Notification request failed with status ${response.status}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error sending notification:', error)
    throw error
  }
}
