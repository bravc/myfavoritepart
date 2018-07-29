require('dotenv').config();

export let config = {
    'username': process.env.DB_USER,
    'password': process.env.DB_PASS,
    'database': 'myfavoritepart',
    'host': process.env.DB_HOST,
    'dialect': 'mysql'
};
