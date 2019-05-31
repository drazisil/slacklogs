const fs = require('fs')
require('dotenv-safe').config()
const moment = require('moment')

const { WebClient } = require('@slack/web-api')

console.log('Getting started with Node Slack SDK')

// Create a new instance of the WebClient class with the token read from your environment variable
const web = new WebClient(process.env.SLACK_API_TOKEN)
// The current date
const currentTime = new Date().toTimeString()

async function saveAsCSV(filename, data) {
  const file = fs.createWriteStream(filename)
  file.write(
    'author_handle, author_name, created_at, text, timestamp, tweet_source\n'
  )
  data.forEach(line => {
    file.write(
      `"${line.author_handle}", "${line.author_name}", "${line.created_at}", "${
        line.text
      }", "${line.timestamp}", "${line.tweet_source}"\n`
    )
  })
  file.close()
}

;(async () => {
  // Use the `auth.test` method to find information about the installing user
  const res = await web.auth.test()

  // Find your user id to know where to send messages to
  const userId = res.user_id

  const history = await web.channels.history({
    channel: process.env.SLACK_CHANNEL,
  })

  // // Use the `chat.postMessage` method to send a message from this app
  // await web.chat.postMessage({
  //   channel: userId,
  //   text: `The current time is ${currentTime}`,
  // })

  console.log(history.messages.length)

  const botHistory = history.messages.filter(historyItem => {
    return historyItem.hasOwnProperty('bot_id')
  })

  const botMessages = botHistory.map(historyItem => {
    return historyItem.attachments[0]
  })

  const cleanedMessages = botMessages.map(message => {
    try {
      return {
        author_handle: message.author_subname,
        author_name: message.author_name,
        created_at: moment(message.ts, 'X').toISOString(),
        text: message.text.replace(/\r?\n|\r/g, ''),
        timestamp: message.ts,
        tweet_source: message.footer,
      }
    } catch (error) {
      console.error(message)
    }
  })

  console.dir(cleanedMessages)
  console.log(cleanedMessages.length)
  await saveAsCSV('output.csv', cleanedMessages)
})()
