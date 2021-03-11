const { ApolloServer, gql } = require("apollo-server");
const lodashId = require("lodash-id");
const low = require("lowdb");
const FileSync = require("lowdb/adapters/FileSync");
const format = require("date-fns/format");

const adapter = new FileSync("db.json");
const db = low(adapter);

db._.mixin(lodashId);

const collection = db.get("products");
const commentsCollection = db.get("comments");
const usersCollection = db.get("users");

const typeDefs = gql`
  type User {
    id: ID
    email: String
    password: String
  }

  type Product {
    id: String
    name: String
    price: String
    imgUrl: String
    comments: [Comment]
  }

  type Comment {
    id: ID
    productId: ID
    content: String
    createdAt: String
    score: Float
  }

  type Query {
    products: [Product]
    getProduct(id: ID!): Product
  }

  type Mutation {
    # Product
    addProduct(name: String, price: String, imgUrl: String): Product
    deleteProduct(id: ID): String

    # Comment
    addComment(content: String!, score: Float, productId: ID!): Comment

    # User
    login(email: String, password: String): User
  }
`;

const resolvers = {
  Query: {
    // Product:
    products: () => {
      return db.get("products");
    },
    getProduct: (_, { id }) => {
      const product = db.get("products").find({ id }).value();
      const comments = db.get("comments").filter({ productId: id }).value();
      return { ...product, comments };
    },
  },
  Mutation: {
    addProduct: (_, { name, price, imgUrl }) => {
      const newItem = collection
        .insert({
          name,
          price,
          imgUrl,
        })
        .write();

      return newItem;
    },
    deleteProduct: (_, { id }) => {
      // const collection = db.get('products')
      const result = collection.removeById(id).write();
      return result.id;
    },
    addComment: (_, { content, score, productId }) => {
      const newItem = commentsCollection
        .insert({
          content,
          score,
          productId,
          createdAt: format(new Date(), "yyyy/MM/dd"),
        })
        .write();

      return newItem;
    },
    login: (_, { email, password }) => {
      const user = usersCollection.find({ email }).value();
      if (!user) {
        throw new Error("User not exist");
      }
      if (user.password !== password) {
        throw new Error("Invalid password");
      }

      return {
        ...user,
        token: JWT.sign(),
      };
    },
  },
};

const server = new ApolloServer({ typeDefs, resolvers });

server.listen().then(({ url }) => {
  console.log(`🚀  Server ready at ${url}`);
});
