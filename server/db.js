require('dotenv').config()
const pg = require('pg');
const client = new pg.Client(process.env.DB_NAME);
const uuid = require('uuid');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken')
const JWT= process.env.JWT

const createTables = async () => {
    const SQL = /*SQL*/ `
        DROP TABLE IF EXISTS comments;
        DROP TABLE IF EXISTS reviews;
        DROP TABLE IF EXISTS items;
        DROP TABLE IF EXISTS users;
        CREATE TABLE items(
            id UUID PRIMARY KEY,
            name VARCHAR(255) UNIQUE NOT NULL,
            text VARCHAR(1000)
        );
        CREATE TABLE users(
            id UUID PRIMARY KEY,
            username VARCHAR(50) UNIQUE NOT NULL,
            password VARCHAR(100) NOT NULL
        );
        CREATE TABLE reviews(
            id UUID PRIMARY KEY,
            text VARCHAR(1000),
            rating INTEGER NOT NULL,
            item_id UUID REFERENCES items(id) NOT NULL,
            user_id UUID REFERENCES users(id) NOT NULL,
            CONSTRAINT unique_user_review UNIQUE(item_id, user_id)
        );
        CREATE TABLE comments(
            id UUID PRIMARY KEY,
            text VARCHAR(1000),
            review_id UUID REFERENCES reviews(id) NOT NULL,
            user_id UUID REFERENCES users(id) NOT NULL
        );
    `
    const res = await client.query(SQL)
    return res.rows
}

const createUser = async ( { username, password } ) => {
    const SQL = /*SQL*/ `
        INSERT INTO users(id, username, password)
        VALUES ($1,$2,$3)
        RETURNING * 
    `
    const res = await client.query(SQL, [uuid.v4(), username, await bcrypt.hash(password, 5)])
    return res.rows[0]
}

const createComment = async ( { text, reviewId, userId } ) => {
    const SQL = /*SQL*/ `
        INSERT INTO comments(id, text, review_id, user_id)
        VALUES ($1,$2,$3,$4)
        RETURNING * 
    `
    const res = await client.query(SQL, [uuid.v4(), text, reviewId, userId])
    return res.rows[0]
}

const createItem = async ( { name, text } ) => {
    const SQL = /*SQL*/ `
        INSERT INTO items(id, name, text)
        VALUES ($1,$2,$3)
        RETURNING * 
    `
    const res = await client.query(SQL, [uuid.v4(), name, text])
    return res.rows[0]
}

const createReview = async ( {text, rating, itemId, userId} ) => {
    const SQL = /*SQL*/ `
        INSERT INTO reviews(id, text, rating, item_id, user_id)
        VALUES ($1,$2,$3,$4,$5)
        RETURNING * 
    `
    const res = await client.query(SQL, [uuid.v4(), text, rating, itemId, userId])
    return res.rows[0]
}

const fetchItems = async () => {
    const SQL = /*SQL*/ `
        SELECT * FROM items
    `
    const res = await client.query(SQL)
    return res.rows
}

const fetchSingleItem = async (id) => {
    console.log(id);
    const SQL = /*SQL*/ `
        SELECT * FROM items 
        WHERE id = $1
    `
    const res = await client.query(SQL, [id])
    return res.rows
}

const fetchItemReviews = async (id) => {
    console.log(id);
    const SQL = /*SQL*/ `
        SELECT * FROM reviews
        WHERE item_id = $1
    `
    const res = await client.query(SQL, [id])
    return res.rows
}

const fetchSingleReview = async (reviewId) => {
    console.log(reviewId);
    const SQL = /*SQL*/ `
        SELECT * FROM reviews
        WHERE id = $1
    `
    const res = await client.query(SQL, [reviewId])
    console.log(res.rows);
    return res.rows
}

function lorem(length) {
    let words = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.".split(' ');
    let result = '';
    for (let i = 0; i < length; i++) {
      result += words[Math.floor(Math.random() * words.length)] + ' ';
    }
    return result.trim();
  }

  const authenticate = async ( { username, password } ) => {
    const SQL = /*SQL*/ `
        SELECT id, password 
        FROM users
        WHERE username = $1
    `
    const res = await client.query(SQL, [username])
    if(!res.rows.length || await bcrypt.compare(password, res.rows[0].password) === false) {
        const error = Error('Not Authorized')
        error.status = 401
        throw error
    }
    const token = await jwt.sign({id: res.rows[0].id}, JWT)
    return { token: token}
  }

const findUserByToken = async (token) => {
    let id
    try {
        const payload = await jwt.verify(token, JWT)
        id = payload.id
    } catch (ex) {
        const error = Error('not authorized')
        error.status = 401
        throw error
    }
    const SQL = /*SQL*/ `
    SELECT id, username
    FROM users
    WHERE id = $1
    `
    const res = await client.query(SQL, [id])
    if(!res.rows.length) {
        const error = Error('Not Authorized')
        error.status = 401
        throw error
    }
    return res.rows[0]
}

const getMyReviews = async (userId) => {
    const SQL = /*SQL*/ `
        SELECT * 
        FROM reviews
        WHERE user_id = $1
    `
    const res = await client.query(SQL, [userId])
    return res.rows
}

const getMyComments = async (userId) => {
    console.log(userId);
    const SQL = /*SQL*/ `
        SELECT * 
        FROM comments
        WHERE user_id = $1
    `
    const res = await client.query(SQL, [userId])
    console.log(res.rows);
    return res.rows
}

const editReview = async ({text, rating, reviewId}) => {
    const SQL = /*SQL*/ `
        UPDATE reviews
        SET text=$1, rating=$2
        WHERE id=$3
        RETURNING *
    `
    const res = await client.query(SQL, [text, rating, reviewId])
    console.log(res.rows);
    return res.rows
}

const deleteReview = async({userId, reviewId}) => {
    const SQL = /*SQL*/ `
        DELETE FROM reviews
        WHERE id=$1 and user_id=$2
    `
    await client.query(SQL, [reviewId, userId])
}

const editComment = async ({text, commentId}) => {
    console.log(text);
    console.log(commentId);
    const SQL = /*SQL*/ `
        UPDATE comments
        SET text=$1
        WHERE id=$2
        RETURNING *
    `
    const res = await client.query(SQL, [text, commentId])
    console.log(res.rows);
    return res.rows
}


const deleteComment = async({userId, commentId}) => {
    const SQL = /*SQL*/ `
        DELETE FROM comments
        WHERE id=$1 and user_id=$2
    `
    await client.query(SQL, [commentId, userId])
}

module.exports = {
    client,
    createTables,
    createUser,
    createItem,
    createComment,
    createReview,
    fetchItems,
    lorem,
    fetchSingleItem,
    fetchItemReviews,
    fetchSingleReview,
    authenticate,
    findUserByToken,
    getMyReviews,
    editReview,
    deleteReview,
    getMyComments,
    editComment,
    deleteComment
}