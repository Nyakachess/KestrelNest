import { CLI_VERSION } from './index.js'

const [command] = process.argv.slice(2)

if (command === '--version' || command === '-v') {
  console.log(`nest ${CLI_VERSION}`)
} else {
  console.log(`nest ${CLI_VERSION}`)
  console.log('')
  console.log('Commands arrive in Step 2: validate, scaffold, new-task, feed, open-cohort.')
}
