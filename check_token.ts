import { getPayload } from 'payload'
import configPromise from './src/payload.config'

async function checkUserToken() {
  const payload = await getPayload({ config: configPromise })
  const user = await payload.findByID({
    collection: 'users',
    id: 33,
    depth: 0,
  })
  console.log('--- USER DATA ---')
  console.log('ID:', (user as any).id)
  console.log('Email:', (user as any).email)
  console.log('Push Token:', (user as any).pushToken)
  console.log('-----------------')
}

checkUserToken()
