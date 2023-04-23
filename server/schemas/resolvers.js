const { AuthenticationError } = require('apollo-server-express');
const { Book, User } = require('../models');
const { signToken } = require('../utils/auth');

const resolvers = {
    Query: {
        // By adding context to our query, we can retrieve the logged in user without specifically searching for them
        me: async (parent, args, context) => {
            if (context.user) {
              return Profile.findOne({ _id: context.user._id });
            }
            throw new AuthenticationError('You need to be logged in!');
          }
    },
    Mutation: {
        login: async (parent, { email, password }) => {
            const user = await User.findOne({ email });
      
            if (!user) {
              throw new AuthenticationError('No profile with this email found!');
            }
      
            const correctPw = await user.isCorrectPassword(password);
      
            if (!correctPw) {
              throw new AuthenticationError('Incorrect password!');
            }
      
            const token = signToken(user);
            return { token, user };
        },
        addUser: async (parent, { name, email, password }) => {
            const user = await User.create({ name, email, password });
            const token = signToken(user);
      
            return { token, user };
        }, 
        saveBook: async (parent, args, context) => {
            if (context.user) {
                const book = await Book.create({
                    authors: args.authors,
                    description: args.description,
                    image: args.image,
                    link: args.link,
                    title: args.title,
                  });
                return User.findOneAndUpdate(
                    {_id: context.user._id},
                    {
                        $addToSet: {savedBooks: book},
                    },
                    {
                        new: true,
                        runValidators: true,
                    }
                );
            }
             // If user attempts to execute this mutation and isn't logged in, throw an error
            throw new AuthenticationError('You need to be logged in!');
        },
         // Make it so a logged in user can only remove a book from their own user profile
        removeBook: async (parent, { bookId }, context) => {
            if (context.user) {
              //  const book = await Book.findOneAndDelete({bookId: bookId});
                return User.findOneAndUpdate(
                    { _id: context.user._id },
                    { $pull: { savedBooks: {bookId: params.bookId} } },
                    { new: true }
                );
            }
            throw new AuthenticationError('You need to be logged in!');
        },

    }
}

module.exports = resolvers;