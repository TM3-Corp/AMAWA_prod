/**
 * API Tests for Client Endpoints
 *
 * These tests validate the client API endpoints
 */

describe('Client API Endpoints', () => {
  describe('GET /api/clients', () => {
    it('should return a list of clients', async () => {
      const response = await fetch('http://localhost:3000/api/clients?limit=5')
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveProperty('clients')
      expect(data).toHaveProperty('total')
      expect(data).toHaveProperty('page')
      expect(data).toHaveProperty('totalPages')
      expect(Array.isArray(data.clients)).toBe(true)
    })

    it('should support pagination', async () => {
      const response = await fetch('http://localhost:3000/api/clients?limit=10&page=2')
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.page).toBe(2)
    })

    it('should support search', async () => {
      const response = await fetch('http://localhost:3000/api/clients?search=Las%20Condes')
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveProperty('clients')
    })
  })

  describe('GET /api/clients/[id]', () => {
    it('should return client details with related data', async () => {
      // First, get a client ID
      const listResponse = await fetch('http://localhost:3000/api/clients?limit=1')
      const listData = await listResponse.json()

      if (listData.clients && listData.clients.length > 0) {
        const clientId = listData.clients[0].id

        // Then fetch the detail
        const detailResponse = await fetch(`http://localhost:3000/api/clients/${clientId}`)
        const detailData = await detailResponse.json()

        expect(detailResponse.status).toBe(200)
        expect(detailData).toHaveProperty('client')
        expect(detailData).toHaveProperty('stats')
        expect(detailData.client).toHaveProperty('maintenances')
        expect(detailData.client).toHaveProperty('incidents')
        expect(detailData.stats).toHaveProperty('maintenance')
        expect(detailData.stats).toHaveProperty('incidents')
        expect(detailData.stats).toHaveProperty('tenure')
      }
    })

    it('should return 404 for non-existent client', async () => {
      const response = await fetch('http://localhost:3000/api/clients/non-existent-id')
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data).toHaveProperty('error')
    })
  })
})
