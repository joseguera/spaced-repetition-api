module.exports = {
  PORT: process.env.PORT || 8000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  API_TOKEN: process.env.API_TOKEN,
  DATABASE_URL: process.env.DATABASE_URL || 'postgres://fhywsonqafdmzj:fe28e322c6462146e81dcb60335a365bba020c78ba6c223f9a9b006ff4e96654@ec2-52-206-15-227.compute-1.amazonaws.com:5432/dekrpsq3f50loi',
  JWT_SECRET: process.env.JWT_SECRET || 'change-this-secret',
  JWT_EXPIRY: process.env.JWT_EXPIRY || '3h',
}