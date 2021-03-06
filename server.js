require('dotenv').config({
  path: __dirname + '../.env'
})
const Socket = require('socket.io')
const express = require('express')
const axios = require('axios')
const cors = require('cors')
const app = express()
const server = require('http').createServer(app)
const io = require('socket.io')(server, {
  cors: {
    origin: '*'
  }
})
const bannedCategories = [
  'icecream',
  'hotdogs',
  'cafes',
  'fondue',
  'fastfood',
  'coffee',
  'tobaccoshops',
  'convenience',
  'grocery'
]
const rooms = {}

function getRandomRestaurant (list) {
  let randomIndex, randomPlace
  let isBanned = true
  while (isBanned) {
    randomIndex = Math.floor(Math.random() * list.length)
    randomPlace = list[randomIndex]
    isBanned = bannedCategories.includes(randomPlace.categories[0].alias)
  }
  return randomPlace
}

function getSocketRoom (socket) {
  const socketRooms = Array.from(socket.rooms.values()).filter(
    room => room !== socket.id
  )
  return socketRooms[0] || null
}

io.on('connection', socket => {
  socket.on('join-group', async message => {
    await socket.join(message.roomId)
    if (io.sockets.adapter.rooms.get(message.roomId)) {
      if (!rooms[message.roomId]) {
        rooms[message.roomId] = {}
        rooms[message.roomId].room = io.sockets.adapter.rooms.get(
          message.roomId
        )
      }
      if (rooms[message.roomId].selectedRestaurant) {
        socket.emit(
          'group-joined',
          message.roomId,
          rooms[message.roomId].selectedRestaurant
        )
      } else {
        socket.emit('no-random-place', message.roomId)
      }
    }
  })

  socket.on('random-place-received', async message => {
    rooms[message.roomId].selectedRestaurant = message.randomRestaurant
    socket.emit(
      'group-joined',
      message.roomId,
      rooms[message.roomId].selectedRestaurant
    )
  })

  socket.on('update-restaurant', async message => {
    const room = getSocketRoom(socket)
    socket.to(room).emit('on-restaurant-update', message)
  })
})

app.use(express.json())
app.use(cors())
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  next()
})

app.get('/', (req, res) => {
  res.send('Test')
})

app.get('/random-restaurant/:longitude/:latitude', async (req, res) => {
  try {
    const response = await axios.get(
      'https://api.yelp.com/v3/businesses/search',
      {
        params: {
          radius: 1000,
          longitude: req.params.longitude,
          latitude: req.params.latitude,
          open_now: true,
          term: 'restaurants',
          price: '1,2'
        },
        headers: {
          Authorization: `Bearer 0XlXCuwc5sd1nxMWWKmvUazZ14b_RJM-GyqzraTHrbwgOjsTNUPW_U_ulKYLnQV-2_dzPw2eOMnOB-WAlgn-33q8eS2yACudTBTs__Q3CUV9S9HUwr90ahATnzUTYXYx`,
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        }
      }
    )
    const restaurantsList = response.data.businesses
    const restaurant = getRandomRestaurant(restaurantsList)
    res.status(200).json(restaurant)
  } catch (err) {
    res.status(500).send(err.response.data)
  }
})

app.get('/categories', async (req, res) => {
  try {
    const response = await axios.get('https://api.yelp.com/v3/categories', {
      params: {
        locale: 'en_CA'
      },
      headers: {
        Authorization: `Bearer 0XlXCuwc5sd1nxMWWKmvUazZ14b_RJM-GyqzraTHrbwgOjsTNUPW_U_ulKYLnQV-2_dzPw2eOMnOB-WAlgn-33q8eS2yACudTBTs__Q3CUV9S9HUwr90ahATnzUTYXYx`,
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      }
    })
    const mappedData = [
      ...new Set(
        response.data.categories.map(cat => {
          if (cat.parent_aliases[0] === 'restaurants') {
            return cat.alias
          }
        })
      )
    ]
    res.status(200).json(mappedData)
  } catch (err) {
    res.status(500).send(err.response.data)
  }
})

app.get('/images/:id', async (req, res) => {
  try {
    const response = await axios.get(
      `https://api.yelp.com/v3/businesses/${req.params.id}`,
      {
        headers: {
          Authorization: `Bearer 0XlXCuwc5sd1nxMWWKmvUazZ14b_RJM-GyqzraTHrbwgOjsTNUPW_U_ulKYLnQV-2_dzPw2eOMnOB-WAlgn-33q8eS2yACudTBTs__Q3CUV9S9HUwr90ahATnzUTYXYx`,
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        }
      }
    )
    res.status(200).json(response.data.photos)
  } catch (err) {
    res.status(500).send(err.response.data)
  }
})

const port = process.env.PORT || 3005
server.listen(port, () => console.log('Server started at ' + port))
