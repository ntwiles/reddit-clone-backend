'use strict';

const { MongoClient, ObjectID } = require('mongodb');

// MongoDb
const dbUrl = 'mongodb://localhost:27017';
const dbName = 'redditClone';

const { DAO } = require('./DAO');

class MongoDAO extends DAO {

    getCollection(collectionName, callback) {
        const dbClient = new MongoClient(dbUrl);
    
        dbClient.connect()
            .then(() => {
                const db = dbClient.db(dbName);
                callback(dbClient, db.collection(collectionName));
            })
            .catch((err) => {
                console.log("Couldn't connect: "+err);
            });
    }
    
    getDatumById(collectionName, id) {
        return new Promise((resolve, reject) => {
            this.getCollection(collectionName,(dbClient, collection) => {
                collection.findOne(new ObjectID(id))
                    .then((data) => {
                        dbClient.close();
                        resolve(data);
                    })
                    .catch((err) => {
                        reject("Couldn't fetch collection: "+err);
                    })
            });
        });
    }
    
    getData(collectionName, query) {
        return new Promise((resolve, reject) => {
            this.getCollection(collectionName,(dbClient, collection) => {
                collection.find(query).toArray()
                    .then((data) => {
                        dbClient.close();
                        resolve(data);
                    })
                    .catch((err) => {
                        reject("Couldn't fetch collection: "+err);
                    })
            });
        });
    }
    
    getSortedData(collectionName, query, sortMethod, res) {
        return new Promise((resolve, reject) => {
            this.getCollection(collectionName,(dbClient,collection) => {
                collection.find(query)
                    .sort(sortMethod)
                    .toArray()
                    .then((data) => {
                        dbClient.close();
                        resolve(data);
                    })
                    .catch((err) => {
                        reject("Couldn't fetch collection: "+err);
                    })
            });
        });
    }
}

exports.MongoDAO = MongoDAO;
