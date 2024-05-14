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
            txt VARCHAR(1000)
        );
        CREATE TABLE users(
            id UUID PRIMARY KEY,
            username VARCHAR(50) UNIQUE NOT NULL,
            password VARCHAR(100) NOT NULL
        );
        CREATE TABLE reviews(
            id UUID PRIMARY KEY,
            txt VARCHAR(1000),
            rating INTEGER CHECK (rating > 0 and rating < 6) NOT NULL,
            item_id UUID REFERENCES items(id) NOT NULL,
            user_id UUID REFERENCES users(id) NOT NULL,
            CONSTRAINT unique_user_review UNIQUE(item_id, user_id)
        );
        CREATE TABLE comments(
            id UUID PRIMARY KEY,
            txt VARCHAR(1000),
            review_id UUID REFERENCES reviews(id) NOT NULL,
            user_id UUID REFERENCES users(id) NOT NULL
        );
    `
    const res = await client.query(SQL)
    return res.rows
}

module.exports = {
    client,
    createTables
}