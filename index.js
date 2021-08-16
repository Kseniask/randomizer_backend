require('dotenv').config({
  path: __dirname + '../.env'
})
const express = require('express')
const axios = require('axios')
const cors = require('cors')
const app = express()

app.use(express.json())
app.use(cors())
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  next()
})

app.get('/restaurants/:longitude/:latitude', async (req, res) => {
  try {
    const response = await axios.get(
      'https://api.yelp.com/v3/businesses/search',
      {
        params: {
          radius: 1000,
          longitude: req.params.longitude,
          latitude: req.params.latitude,
          // open_now: true,
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
    res.status(200).json(response.data)
  } catch (err) {
    res.status(500).send(err.response.data)
  }
  // res.status(200).send(response.data)
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

const port = process.env.PORT || 3001

app.listen(port, () => console.log('Server started at ' + port))
