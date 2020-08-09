const { ApolloServer, gql } = require("apollo-server");
const lodashId = require("lodash-id");
const low = require("lowdb");
const FileSync = require("lowdb/adapters/FileSync");

const adapter = new FileSync("db.json");
const db = low(adapter);

db._.mixin(lodashId);

const collection = db.get("products");

const typeDefs = gql`
  type Product {
    id: String
    name: String
    price: String
    imgUrl: String
  }

  type Query {
    products: [Product]
  }

  type Mutation {
    addProduct(name: String, price: String, imgUrl: String): Product
    deleteProduct(id: ID): String
  }
`;

const resolvers = {
  Query: {
    products: () => {
      return db.get("products");
    },
  },
  Mutation: {
    addProduct: (_, { name, price, imgUrl }) => {
      console.log({ name, price, imgUrl });
      // const collection = db.get("products");
      console.log("collection");
      console.log(collection);
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
  },
};

const server = new ApolloServer({ typeDefs, resolvers });

server.listen().then(({ url }) => {
  console.log(`🚀  Server ready at ${url}`);
});
