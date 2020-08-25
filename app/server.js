
'use strict'
const express = require('express');

// DAO
const { MongoDAO } = require('./dal/mongoDAO');

const cors = require('cors');

// GraphQL
const { graphqlHTTP } = require('express-graphql');
const { buildSchema, GraphQLEnumType } = require('graphql');

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
        rules: String
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
        forum(name: String!): Forum
        posts(sortMethod: String, forum: String): [Post]
        post(id: String!): Post
    }

    type Mutation {
        createPost(title: String!, forum: String!, message: String, url: String, type: String!): Post
        createForum(name: String!, rules: String!) : Forum
    }
`);

class Forum {
    constructor(data) {
        this.name = data.name;
        this.rules = data.rules;
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
    forum: async({name}) => {
        let query = { name: name };
        const forum = await dao.getDatum('forums',query);
        return new Forum(forum);
    },
    posts: async ({forum, sortMethod}) => {
        let query = {};
        let sort = {};
        let posts;

        if (forum) query.forum = forum;

        if (sortMethod) {
            switch (sortMethod) {
                case "new": sort = { timePosted: -1}; break;
                case "hot": sort = { numComments: -1}; break;
                default: sort = { numComments: -1}; break;
            }
            
            posts = await dao.getSortedData('posts',query,sort);
        }
        else posts = await dao.getData('posts', query);

        return posts.map(p => new Post(p));
    },
    post: async ({id}) => {
        const post = await dao.getDatumById('posts', id);
        return new Post(post);
    },
    createPost: async ({title, forum, type, message, url}) => {
        const mutation = { title: title, forum: forum, type: type, message: message, url: url}
        const result = await dao.insertDatum('posts',mutation);
        return new Post(result.ops[0]);
    },
    createForum: async ({name, rules}) => {
        const mutation = { name: name, rules: rules}
        const result = await dao.insertDatum('forums',mutation);
        return new Forum(result.ops[0]);
    }
};

app.use('/graphql', graphqlHTTP({
    schema: schema,
    rootValue: root,
    graphiql: true
}));

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`)
});

