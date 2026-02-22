import { useState, useEffect, useCallback } from 'react'
import { vpsApi } from '../services/api'

export const useVPS = (vpsId = null) => {
  const [vps, setVps] = useState(null)
  const [vpsList, setVpsList] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [actionLoading, setActionLoading] = useState(null)

  // Fetch all VPS
  const fetchAll = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await vpsApi.getAll()
      setVpsList(response.data.vps || [])
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch VPS list')
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch single VPS
  const fetchById = useCallback(async (id) => {
    setLoading(true)
    setError(null)
    try {
      const response = await vpsApi.getById(id)
      setVps(response.data.vps)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch VPS')
    } finally {
      setLoading(false)
    }
  }, [])

  // VPS actions
  const performAction = useCallback(async (action, id) => {
    setActionLoading(action)
    setError(null)
    try {
      let response
      switch (action) {
        case 'start':
          response = await vpsApi.start(id)
          break
        case 'stop':
          response = await vpsApi.stop(id)
          break
        case 'reboot':
          response = await vpsApi.reboot(id)
          break
        case 'suspend':
          response = await vpsApi.suspend(id)
          break
        case 'unsuspend':
          response = await vpsApi.unsuspend(id)
          break
        default:
          throw new Error('Invalid action')
      }
      
      // Refresh VPS data
      if (vpsId) {
        await fetchById(vpsId)
      } else {
        await fetchAll()
      }
      
      return { success: true, status: response.data.status }
    } catch (err) {
      const message = err.response?.data?.message || `Failed to ${action} VPS`
      setError(message)
      return { success: false, error: message }
    } finally {
      setActionLoading(null)
    }
  }, [vpsId, fetchById, fetchAll])

  // Initial fetch
  useEffect(() => {
    if (vpsId) {
      fetchById(vpsId)
    } else {
      fetchAll()
    }
  }, [vpsId, fetchById, fetchAll])

  return {
    vps,
    vpsList,
    loading,
    error,
    actionLoading,
    refresh: vpsId ? () => fetchById(vpsId) : fetchAll,
    performAction,
    setError
  }
}
