# Dawit Develops

Dawit-Develops is a MERN stack blog application that allows users to create and share programming-related tutorials and examples. Users can create an account, log in, create posts with markdown formatting using React-Quill, and view other users' posts. The application uses MongoDB for data storage, Express for the back-end API, and React for the front-end UI with Vite as a build tool. The authentication system is implemented using JSON Web Token (JWT).

## Technologies Used
- MongoDB: A NoSQL document database used for data storage
- Express: A Node.js web application framework used for creating API endpoints
- React: A JavaScript library used for building user interfaces
- React-Quill: A React component for creating rich text editors with markdown support
- Vercel: A cloud platform used for deploying the application
- Vite: A build tool used for bundling and serving the client-side code
- JSON Web Token: A standard for implementing authentication in web applications

## Usage
To run the application locally, follow these steps:

1. Clone the repository: git clone https://github.com/dawhagos/tech-blog.git
2. Install dependencies: npm install
3. Create a .env file in the root of the project directory with the following variable:
```
VITE_APP_API_URL=your-local-api-endpoint>
```
4. Create a .env file in the api folder with the following variable:
```
MONGODB_URI=<your-mongodb-uri>
UNSPLASH_ACCESS_KEY=<your-unsplash-access-key>
UNSPLASH_SECRET=<your-unsplash-secret>
SECRET=<your-secret-for-cookies>
```
5. Start the server (if using Node.js 19+): node --watch api/index.js
6. Start the client: npm run dev
7. The application will be available at http://localhost:5173.

## Contributing
Contributions are welcome! If you find a bug or have a feature request, please create an issue. If you would like to contribute code, please create a pull request.
