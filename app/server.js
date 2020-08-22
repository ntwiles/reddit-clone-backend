
'use strict'
const express = require('express');

// DAO
const { MongoDAO } = require('./dal/mongoDAO');

const cors = require('cors');

// GraphQL
const { graphqlHTTP } = require('express-graphql');
const { buildSchema } = require('graphql');

// Settings
const port = 5000;
const dao = new MongoDAO();

// Express
const app = express();

app.use(cors());
app.use(express.static(__dirname + '/public'));

// GraphQL
let schema = buildSchema(`
    type Forum {
        name: String
    }

    type Post {
        id: String
        title: String
        timePosted: String
        forum: String
        message: String
        numComments: Int
    }

    type Query {
        forums: [Forum]
        posts(forum: String): [Post]
        post(id: String!): Post
        feed()
    }
`);

class Forum {
    constructor(data) {
        this.name = data.name;
    }
}

class Post {
    constructor(data) {
        this.id = data._id;
        this.title = data.title;
        this.timePosted = data.timePosted;
        this.forum = data.forum;
        this.message = data.message;
        this.numComments =data.numComments;
    }
}

let root = {
    forums: async () => {
        let query = {};
        const forums = await dao.getData('forums',query);
        return forums.map(f => new Forum(f));
    },
    posts: async ({forum}) => {
        let query = {};
        if (forum) query.forum = forum;
        const posts = await dao.getData('posts', query);
        return posts.map(p => new Post(p));
    },
    post: async ({id}) => {
        const post = await dao.getDatumById('posts', id);
        return new Post(post);
    },
};

app.use('/graphql', graphqlHTTP({
    schema: schema,
    rootValue: root,
    graphiql: true
}));

// Routes
app.get('/api/forums', (req, res) => {
    dao.getData('forums', {})
        .then(data => res.json(data))
        .catch(err => console.log(err));
});

app.get('/api/forums/:forumName/posts', (req, res) => {
    dao.getData('posts',{ forum : req.params.forumName})
        .then(data => res.json(data))
        .catch(err => console.log(err));
});

app.get('/api/posts', (req, res) => {
    let sortMethodName = req.query.sortMethod;
    let sortMethod = {};

    switch (sortMethodName) {
        case "new": sortMethod = { timePosted: -1}; break;
        case "hot": sortMethod = { numComments: -1}; break;
        default: sortMethod = { numComments: -1}; break;
    }

    dao.getSortedData('posts', {}, sortMethod)
        .then(data => res.json(data))
        .catch(err => console.log(err));
});

app.get('/api/posts/:postId', (req, res) => {
    dao.getDatumById('posts',req.params.postId)
        .then(data => res.json(data))
        .catch(err => console.log(err));
});


app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`)
});

