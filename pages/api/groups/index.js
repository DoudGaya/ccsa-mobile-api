import { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req, res) {
  // Groups have been unified with roles
  // Redirect all groups requests to roles endpoint
  const baseUrl = req.headers.host?.includes('localhost') 
    ? `http://${req.headers.host}` 
    : `https://${req.headers.host}`
    
  const rolesUrl = `${baseUrl}/api/roles`
  
  // For GET requests, redirect to roles
  if (req.method === 'GET') {
    return res.redirect(307, rolesUrl)
  }
  
  // For POST requests, return a message about the new endpoint
  if (req.method === 'POST') {
    return res.status(200).json({
      message: 'Groups have been unified with roles. Please use the /api/roles endpoint to create roles.',
      newEndpoint: rolesUrl,
      migration: {
        note: 'Groups and roles are now the same concept. Use the roles API for all role management.',
        example: {
          createRole: 'POST /api/roles',
          getRoles: 'GET /api/roles'
        }
      }
    })
  }
  
  res.setHeader('Allow', ['GET', 'POST'])
  return res.status(405).json({ error: `Method ${req.method} not allowed` })
}
