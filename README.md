# hotels-api

## create .env file and add MONGODB_URI={your_own_uri}

## Rest APIs

### Get first 10 hotel
GET http://localhost:3000/hotels

### Get first 10 hotel with pagination
GET http://localhost:3000/hotels?page=1&limit=10

### Upload one hotel
POST http://localhost:3000/hotels/

### Get hotel by Id
GET http://localhost:3000/hotels/64211a72afdd52cce5ba94da

### Update hotel by Id
PUT http://localhost:3000/hotels/64210e610e0f69215eaa2716

### Delete hotel By Id
DELETE http://localhost:3000/hotels/64210e610e0f69215eaa2716
