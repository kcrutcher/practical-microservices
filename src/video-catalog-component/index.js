const uuid = require('uuid/v4')

const projection = require('./projection')

// This component has 4 sets of handlers:
// 1. Its command stream
// 2. Its event stream
// 3. move-file's event stream
// 4. transcode's event stream
function createCommandHandlers ({ messageStore }) {
  return {
    async Catalog (catalog) {
      const videoId = catalog.data.videoId
      const videoStreamName = `videoCatalog-${videoId}`
      const video = await messageStore.fetch(videoStreamName, projection)

      if (video.isReceived) {
        console.log(`(${catalog.id}) Video already received. Skipping`)

        return true
      }

      const received = {
        id: uuid(),
        type: 'Received',
        metadata: {
          traceId: catalog.metadata.traceId
        },
        data: {
          videoId: catalog.data.videoId,
          source: catalog.data.source
        }
      }

      return messageStore.write(videoStreamName, received)
    }
  }
}

function createEventHandlers ({ messageStore }) {
  return {
    async Received (received) {
      const videoId = received.data.videoId
      const streamName = `videoCatalog-${videoId}`
      const video = await messageStore.fetch(streamName, projection)

      if (video.isMoved) {
        console.log(`(${received.id}) Video already moved. Skipping`)

        return true
      }

      const move = {
        id: uuid(),
        type: 'Move',
        metadata: {
          traceId: received.metadata.traceId,
          originStreamName: streamName
        },
        data: {
          fileId: videoId,
          source: received.data.source,
          destination: `permanent/path/${received.data.source}`
        }
      }
      const commandStream = `moveFile:command-${videoId}`

      return messageStore.write(commandStream, move)
    }
  }
}

function createMoveFileEventHandlers ({ messageStore }) {
  return {
    async Moved (moved) {
      // 1. Make sure it's one of ours
      const [originCategory, _] = moved.metadata.originStreamName.split('-')

      // 2. Fetch the entity and make the handler idempotent
      //   - Where can we find the streamName for the video entity?

      // 3. Write a Moved event to our stream

      return true
    }
  }
}

function createComponent ({ messageStore }) {
  const commandHandlers = createCommandHandlers({ messageStore })
  const eventHandlers = createEventHandlers({ messageStore })
  const moveFileEventHandlers = createMoveFileEventHandlers({ messageStore })

  function start () {
    console.log('Starting video catalog component')
  }

  return {
    commandHandlers,
    eventHandlers,
    moveFileEventHandlers,
    start
  }
}

module.exports = createComponent
