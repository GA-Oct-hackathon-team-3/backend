# Backend API Documentation

## Getting Started
Run `npm i` to install dependencies

Setup a .env file according to the .env.sample file

Run `npm start` to start development server

## Overview
This document outlines the available API endpoints in our backend service. All routes return an HTTPError with relevant status and a json body containing `message` on error.

Server runs on PORT 3010 by default.

---

## Authentication

### Signup - Create a new user

- **Endpoint**: `POST /api/users`
- **Request Body**: JSON object containing:
  - `email` (required, string)
  - `password` (required, string)
  - `name` (required, string)
  - `dob` (required, Date - yyyy-mm-dd)
  - `gender` (required, sring - one of "female", "male", "other")
  - `tel` (optional, number)
- **Response**: JSON object containing:
  - `accessToken`
- **Side Effect**: Creates an empty UserProfile

### Login - Authenticate an existing user

- **Endpoint**: `POST /api/users/login`
- **Request Body**: JSON object containing:
  - `email` (required, string)
  - `password` (required, string)
- **Response**: JSON object containing:
  - `accessToken`

---

## Protected Routes
**Note**: All the routes below expect an `Authorization` header with a Bearer token.

### Verify Email
- **Endpoint**: `POST /api/users/verify`
- **Authorization**: Bearer Token
- **Request Body**: JSON object containing:
  - `token` (required, string)
- **Response**: JSON object containing:
  - `message: User verified`

### Update Password

- **Endpoint**: `PUT /api/users/password`
- **Authorization**: Bearer Token
- **Request Body**: JSON object containing:
  - `oldPassword` (required, string)
  - `newPassword` (required, string)

### Update User Information

- **Endpoint**: `PUT /api/users`
- **Authorization**: Bearer Token
- **Request Body**: JSON object containing:
  - `name` (optional, string)
  - `tel` (optional, number)
  - `dob` (optional, Date)
  - `gender` (optional, sring - one of "female", "male", "other")

### Delete User

- **Endpoint**: `DELETE /api/users`
- **Authorization**: Bearer Token
- **Response**: JSON object containing:
  - `confirmationToken`

### Confirm User Deletion

- **Endpoint**: `POST /api/confirm-delete`
- **Authorization**: Bearer Token
- **Request Body**: JSON object containing:
  - `confirmationToken` (required, string)
- **Side Effect**: Deletes associated UserProfile

## User Profile

### Get Current User and Profile
- **Endpoint**: `GET /api/users/profile/all`
- **Authorization**: Bearer Token
- **Response**: JSON object containing:
  - `user`
  - `profile`

### Update Profile Details

- **Endpoint**: `PUT /api/users/profile`
- **Authorization**: Bearer Token
- **Request Body**: JSON object containing (any of):
  - `interests` (optional, string[])
  - `bio` (optional, string)
- **Response**: JSON object containing:
  - `message: "User profile updated"`
  - `profile`

### Get User Profile

- **Endpoint**: `GET /api/users/profile`
- **Authorization**: Bearer Token
- **Response**: JSON object containing:
  - `profile`

### Upload User Photo

- **Endpoint**: `POST /api/users/profile/upload`
- **Authorization**: Bearer Token
- **Request Body**: Form-data containing:
  - `photo` (required, File)
- **Response**: JSON object containing:
  - `message: "Photo uploaded successfully"`
  - `photoUrl`

Note: The photo upload utilizes AWS S3 for storage.

## Friends

### Get All Friends

- **Endpoint**: `GET /api/friends`
- **Authorization**: Bearer Token
- **Response**: JSON object containing:
  - `friend[]`

### Add Friend
- **Endpoint**: `POST /api/friends/create`
- **Authorization**: Bearer Token
- **Request Body**: JSON object containing:
  - `name` (required, string)
  - `dob` (required, Date - yyyy-mm-dd)
  - `gender` (required, string - one of "female", "male", "other")
  - `location` (optional, string)
  - `bio` (optional, string)
  - `interests` (optional, string[])
  - `tags` (optional, string[] - objectIds)
  - `giftPreferences` (optional, string[])
- **Response**: JSON object containing:
  - `newFriend`

### Upload Friend Photo
- **Endpoint**: `POST /api/friends/:id/upload`
- **Authorization**: Bearer Token
- **Request Body**: Form-data containing:
  - `photo` (required, File)
- **Response**: JSON object containing:
  - `message: "Photo uploaded successfully"`
  - `photoUrl`

### Show Friend
- **Endpoint**: `POST /api/friends/:id`
- **Authorization**: Bearer Token
- **Response**: JSON object containing:
  - `friend`

### Delete Friend
- **Endpoint**: `DELETE /api/friends/:id/delete`
- **Authorization**: Bearer Token
- **Response**: JSON object containing:
  -  `message: 'Friend deleted successfully'`

### Update Friend
- **Endpoint**: `PUT /api/friends/:id/update`
- **Authorization**: Bearer Token
- **Request Body**: JSON object containing:
  - `name` (optional, string)
  - `dob` (optional, Date - yyyy-mm-dd)
  - `location` (optional, string)
  - `bio` (optional, string)
  - `interests` (optional, string[])
  - `tags` (optional, string[] - objectIds)
  - `giftPreferences` (optional, string[])
  - `gender` (optional, string - one of "female", "male", "other")
- **Response**: JSON object containing:
  -  `message: 'Friend updated'`

Note: tags and giftPreferences are not checked for duplicate entries at this endpoint.

### Add A Tag
- **Endpoint**: `POST /api/friends/:id/tags`
- **Authorization**: Bearer Token
- **Request Body**: JSON object containing:
  - `title` (required, string - title of tag)
  - `type` (optional, string - category of tag)
- **Response**: JSON object containing:
  - `_id` (objectId of added tag)

Note: A new tag is created if title-type combinatino does not exist. If friend already has this combination, the existing tag's objectId is returned.

### Remove A Tag
- **Endpoint**: `DELETE /api/friends/:id/tags/:tagId`
- **Authorization**: Bearer Token
- **Response**: JSON object containing:
  - `message: "Tag removed"`

Note: tagId must be a valid, existing tag's Id. If the friend's tags array does not contain the provided valid tag Id, HTTP 204 is returned with empty response body.

### Add A Gift Preference
- **Endpoint**: `POST /api/friends/:id/preferences`
- **Authorization**: Bearer Token
- **Request Body**: JSON object containing:
  - `preference` (required, string - must be known to the backend. Currently "present" and "experience" are accepted)
- **Response**: JSON object containing:
  - `friend`

### Remove A Gift Preference
- **Endpoint**: `POST /api/friends/:id/preferences/remove`
- **Authorization**: Bearer Token
- **Request Body**: JSON object containing:
  - `preference` (required, string - must be known to the backend. Currently "present", "experience" and "donation" are accepted)
- **Response**: JSON object containing:
  - `friend`

### Generate 3 Gift Recommendations
- **Endpoint**: `POST /api/friends/:id/generate-gift`
- **Authorization**: Bearer Token
- **Request Body**: JSON object containing:
  - `giftTypes` (required, string[] - must be known to the backend. Currently "present", "donation" and "experience" are accepted)
  - `tags` (required, string[] - names of tags to be sent with the query)
  - `budget` (optional, number - recommendations will try to be below this amount)
- **Response**: JSON object containing:
  - `recommendations`
  - `message: 'Gift recommendations generated'`

### Favorite a Gift Recommendation
- **Endpoint**: `POST /api/friends/:id/favorites`
- **Authorization**: Bearer Token
- **Request Body**: JSON object containing:
  - `title` (required, string)
  - `reason` (required, string)
  - `imgSrc` (required, string - link of thumbnail image)
  - `giftType` (required, string - one of 'present', 'experience' or 'donation')
  - `imageSearchQuery` (required, string - query used to find thumbnail image)
**Response**: JSON object containing:
  - `recommendation` (with ObjectId)

### List All Favorite Gift Recommendations
- **Endpoint**: `GET /api/friends/:id/favorites`
- **Authorization**: Bearer Token
**Response**: JSON object containing:
  - `favorites`

### Delete a Favorite Gift Recommendation
- **Endpoint**: `DELETE /api/friends/:id/favorites/:favoriteId`
- **Authorization**: Bearer Token
**Response**: JSON object containing:
  - `message: "Favorite gift removed"`

## Tags

### Get All Tags
- **Endpoint**: `GET /api/tags`
- **Response**: JSON object containing:
  - `tag[]`