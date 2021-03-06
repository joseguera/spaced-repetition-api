process.env.TZ = 'UCT'
process.env.NODE_ENV = 'test'
process.env.JWT_SECRET = 'test-jwt-secret'
process.env.JWT_EXPIRY = '3h'

require('dotenv').config()
// connect to test db
process.env.TEST_DATABASE_URL = process.env.TEST_DATABASE_URL
  || "postgresql://dunder-mifflin@localhost/spaced-repetition-test"

const { expect } = require('chai')
const supertest = require('supertest')

global.expect = expect
global.supertest = supertest
