/**
 * Simple R2 Environment Test API
 * Tests if R2 environment variables are properly set
 */

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method Not Allowed' 
    })
  }

  try {
    // Check environment variables
    const envVars = {
      R2_ACCOUNT_ID: !!process.env.R2_ACCOUNT_ID,
      R2_ACCESS_KEY_ID: !!process.env.R2_ACCESS_KEY_ID,
      R2_SECRET_ACCESS_KEY: !!process.env.R2_SECRET_ACCESS_KEY,
      R2_BUCKET: !!process.env.R2_BUCKET,
      R2_ENDPOINT: !!process.env.R2_ENDPOINT,
      R2_PUBLIC_BASE_URL: !!process.env.R2_PUBLIC_BASE_URL,
      SUPABASE_URL: !!process.env.SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY
    }

    // Test if we can import required modules
    let moduleTests = {}
    try {
      require('@aws-sdk/client-s3')
      moduleTests['@aws-sdk/client-s3'] = true
    } catch (e) {
      moduleTests['@aws-sdk/client-s3'] = false
    }

    try {
      require('@aws-sdk/s3-request-presigner')
      moduleTests['@aws-sdk/s3-request-presigner'] = true
    } catch (e) {
      moduleTests['@aws-sdk/s3-request-presigner'] = false
    }

    try {
      require('uuid')
      moduleTests['uuid'] = true
    } catch (e) {
      moduleTests['uuid'] = false
    }

    try {
      require('../lib/r2')
      moduleTests['../lib/r2'] = true
    } catch (e) {
      moduleTests['../lib/r2'] = false
    }

    try {
      require('../lib/auth')
      moduleTests['../lib/auth'] = true
    } catch (e) {
      moduleTests['../lib/auth'] = false
    }

    return res.status(200).json({
      success: true,
      environmentVariables: envVars,
      moduleTests: moduleTests,
      nodeVersion: process.version,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('R2 Test error:', error)
    return res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    })
  }
}
